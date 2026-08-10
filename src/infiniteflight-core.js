const API_BASE_URL = 'https://api.infiniteflight.com/public/v2';
const SESSION_CACHE_SECONDS = 600;
const FLIGHTS_CACHE_SECONDS = 15;
const DEFAULT_SESSION_NAME = 'Expert Server';
const AIRPORT_CODE = /^[A-Z]{4}$/;

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('origin');
  const allowedOrigin = env.CORS_ORIGIN || 'https://kyleboas.com';
  const headers = { vary: 'Origin' };

  if (!origin || origin === allowedOrigin) {
    headers['access-control-allow-origin'] = origin || allowedOrigin;
  }
  headers['access-control-allow-methods'] = 'GET, OPTIONS';
  headers['access-control-allow-headers'] = 'Accept';
  headers['access-control-max-age'] = '86400';
  return headers;
}

function withCors(request, env, source) {
  const headers = new Headers(source.headers);
  for (const [name, value] of Object.entries(corsHeaders(request, env))) headers.set(name, value);
  return new Response(source.body, { status: source.status, headers });
}

function error(code, status, headers = {}) {
  return json({ error: code, code }, status, headers);
}

function cacheRequest(request, suffix) {
  const url = new URL(request.url);
  url.pathname = `${url.pathname}${suffix}`;
  url.search = '';
  return new Request(url.toString(), { method: 'GET' });
}

async function cached(cache, key, seconds, load) {
  const existing = await cache.match(key);
  if (existing) return existing;

  const loaded = await load();
  if (loaded.status === 200) {
    const headers = new Headers(loaded.headers);
    headers.set('cache-control', `public, max-age=${seconds}`);
    const cacheable = new Response(loaded.body, { status: loaded.status, headers });
    await cache.put(key, cacheable.clone());
    return cacheable;
  }
  return loaded;
}

async function fetchUpstream(path, env, fetchFn) {
  if (!env.INFINITEFLIGHT_API_KEY) return error('infiniteflight_not_configured', 503);

  let upstream;
  try {
    upstream = await fetchFn(`${API_BASE_URL}${path}`, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${env.INFINITEFLIGHT_API_KEY}`,
      },
    });
  } catch (cause) {
    console.error('Infinite Flight upstream request failed', cause);
    return error('upstream_unavailable', 502);
  }

  if (upstream.status === 429) {
    const retryAfter = upstream.headers.get('retry-after');
    return error('upstream_rate_limited', 429, retryAfter ? { 'retry-after': retryAfter } : {});
  }
  if (upstream.status === 401 || upstream.status === 403) {
    console.error(`Infinite Flight upstream authentication failed (${upstream.status})`);
    return error('upstream_auth_failed', 502);
  }
  if (!upstream.ok) {
    console.error(`Infinite Flight upstream returned ${upstream.status}`);
    return error('upstream_unavailable', 502);
  }

  try {
    return json(await upstream.json());
  } catch (cause) {
    console.error('Infinite Flight upstream returned invalid JSON', cause);
    return error('upstream_invalid_response', 502);
  }
}

function selectedSession(payload, sessionName) {
  const sessions = payload?.result;
  if (!Array.isArray(sessions)) return null;
  return sessions.find((session) => session?.name === sessionName) || null;
}

async function currentSession(request, env, fetchFn, cache) {
  const sessionUrl = new URL(request.url);
  sessionUrl.pathname = '/api/infiniteflight/session-cache';
  sessionUrl.search = '';
  const key = new Request(sessionUrl.toString(), { method: 'GET' });
  const response = await cached(cache, key, SESSION_CACHE_SECONDS, async () => {
    const sessions = await fetchUpstream('/sessions', env, fetchFn);
    if (!sessions.ok) return sessions;

    const payload = await sessions.json();
    const session = selectedSession(payload, env.INFINITEFLIGHT_SESSION_NAME || DEFAULT_SESSION_NAME);
    return session
      ? json({ errorCode: 0, result: session })
      : error('active_session_unavailable', 502);
  });

  if (!response.ok) return { response };
  const payload = await response.clone().json();
  return { session: payload.result };
}

function route(pathname) {
  if (pathname === '/session') return { type: 'session' };
  if (pathname === '/flights' || pathname === '/world' || pathname === '/atc') {
    return { type: 'session-resource', resource: pathname };
  }

  const airport = pathname.match(/^\/airport\/([A-Z]{4})(?:\/(status|atis))?$/);
  if (!airport) return null;
  return { type: airport[2] ? 'session-resource' : 'airport', icao: airport[1], resource: airport[2] };
}

export async function handleInfiniteFlightRequest(request, env, fetchFn = fetch, cache = caches.default) {
  const url = new URL(request.url);
  const headers = corsHeaders(request, env);

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'GET') return withCors(request, env, error('method_not_allowed', 405));
  if (url.search) return withCors(request, env, error('invalid_request', 400));

  const prefix = '/api/infiniteflight';
  const endpoint = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) || '/' : '';
  const matched = route(endpoint);
  if (!matched) return withCors(request, env, error('not_found', 404));

  if (matched.type === 'session') {
    const result = await currentSession(request, env, fetchFn, cache);
    return withCors(request, env, result.response || json(
      { errorCode: 0, result: result.session },
      200,
      { 'cache-control': `public, max-age=${SESSION_CACHE_SECONDS}` }
    ));
  }

  if (matched.type === 'airport') {
    if (!AIRPORT_CODE.test(matched.icao)) return withCors(request, env, error('invalid_airport', 400));
    const result = await fetchUpstream(`/airport/${matched.icao}`, env, fetchFn);
    return withCors(request, env, result);
  }

  const sessionResult = await currentSession(request, env, fetchFn, cache);
  if (sessionResult.response) return withCors(request, env, sessionResult.response);

  const sessionId = sessionResult.session?.id;
  if (typeof sessionId !== 'string' || !sessionId) {
    return withCors(request, env, error('active_session_unavailable', 502));
  }

  const upstreamPath = matched.icao
    ? `/sessions/${encodeURIComponent(sessionId)}/airport/${matched.icao}/${matched.resource}`
    : `/sessions/${encodeURIComponent(sessionId)}${matched.resource}`;
  const ttl = matched.resource === '/flights' ? FLIGHTS_CACHE_SECONDS : 15;
  const result = await cached(cache, cacheRequest(request, '/upstream-cache'), ttl,
    () => fetchUpstream(upstreamPath, env, fetchFn));
  return withCors(request, env, result);
}
