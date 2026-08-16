const SESSION_CACHE_SECONDS = 600;
const RESOURCE_CACHE_SECONDS = 15;
const AIRPORT_CACHE_SECONDS = 600;
const DEFAULT_SESSION_NAME = 'Expert Server';

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

async function fetchUpstream(path, env) {
  if (!env.INFINITEFLIGHT_API_KEY) return error('infiniteflight_not_configured', 503);
  if (!env.INFINITEFLIGHT_COORDINATOR) return error('upstream_coordinator_not_configured', 503);

  let upstream;
  try {
    const id = env.INFINITEFLIGHT_COORDINATOR.idFromName('shared-infiniteflight-api-key');
    upstream = await env.INFINITEFLIGHT_COORDINATOR.get(id).fetch(
      `https://infiniteflight-coordinator${path}`
    );
  } catch (cause) {
    console.error('Infinite Flight coordinator request failed', cause);
    return error('upstream_unavailable', 502, {
      'x-infiniteflight-failure': 'coordinator',
    });
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
    return error('upstream_unavailable', 502, {
      'x-infiniteflight-upstream-status': String(upstream.status),
    });
  }

  try {
    return json(await upstream.json());
  } catch (cause) {
    console.error('Infinite Flight upstream returned invalid JSON', cause);
    return error('upstream_invalid_response', 502, {
      'x-infiniteflight-failure': 'invalid-json',
    });
  }
}

function normalizedSessionName(value) {
  return typeof value === 'string'
    ? value.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/server$/, '')
    : '';
}

function selectedSession(payload, sessionName) {
  const sessions = payload?.result;
  if (!Array.isArray(sessions)) return null;

  const target = normalizedSessionName(sessionName);
  return sessions.find((session) => normalizedSessionName(session?.name) === target) || null;
}

async function currentSession(request, env, cache) {
  const sessionUrl = new URL(request.url);
  sessionUrl.pathname = '/api/infiniteflight/session-cache';
  sessionUrl.search = '';
  const key = new Request(sessionUrl.toString(), { method: 'GET' });
  const response = await cached(cache, key, SESSION_CACHE_SECONDS, async () => {
    const sessions = await fetchUpstream('/sessions', env);
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
  if (pathname === '/flights' || pathname === '/atc' || pathname === '/world') {
    return { type: pathname.slice(1) };
  }

  const airport = pathname.match(/^\/airport\/([A-Z0-9]{3,5})(?:\/(status|atis))?$/);
  if (!airport) return null;
  return { type: 'airport', icao: airport[1], resource: airport[2] || 'metadata' };
}

export async function handleInfiniteFlightRequest(request, env, cache = caches.default) {
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
    const result = await currentSession(request, env, cache);
    return withCors(request, env, result.response || json(
      { errorCode: 0, result: result.session },
      200,
      { 'cache-control': `public, max-age=${SESSION_CACHE_SECONDS}` }
    ));
  }

  if (matched.type === 'airport' && matched.resource === 'metadata') {
    const airportUrl = new URL(request.url);
    airportUrl.pathname = `/api/infiniteflight/airport-cache/${matched.icao}`;
    const key = new Request(airportUrl.toString(), { method: 'GET' });
    const result = await cached(cache, key, AIRPORT_CACHE_SECONDS,
      () => fetchUpstream(`/airport/${matched.icao}`, env));
    return withCors(request, env, result);
  }

  const sessionResult = await currentSession(request, env, cache);
  if (sessionResult.response) return withCors(request, env, sessionResult.response);

  const sessionId = sessionResult.session?.id;
  if (typeof sessionId !== 'string' || !sessionId) {
    return withCors(request, env, error('active_session_unavailable', 502));
  }

  let upstreamPath = `/sessions/${encodeURIComponent(sessionId)}/${matched.type}`;
  if (matched.type === 'airport') {
    upstreamPath = `/sessions/${encodeURIComponent(sessionId)}/airport/${matched.icao}/${matched.resource}`;
  }

  const resourceUrl = new URL(request.url);
  resourceUrl.pathname = `/api/infiniteflight/resource-cache${endpoint}`;
  const key = new Request(resourceUrl.toString(), { method: 'GET' });
  const result = await cached(cache, key, RESOURCE_CACHE_SECONDS,
    () => fetchUpstream(upstreamPath, env));
  return withCors(request, env, result);
}
