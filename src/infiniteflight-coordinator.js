const API_BASE_URL = 'https://api.infiniteflight.com/public/v2';
const SESSION_CACHE_SECONDS = 600;
const RESOURCE_CACHE_SECONDS = 15;
const DEFAULT_REQUESTS_PER_MINUTE = 30;
const RATE_LIMIT_KEY = 'rate-limit';

function response(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

function cacheSeconds(path) {
  return path === '/sessions' ? SESSION_CACHE_SECONDS : RESOURCE_CACHE_SECONDS;
}

function allowedPath(path) {
  return path === '/sessions' || /^\/sessions\/[^/]+\/flights$/.test(path);
}

function requestsPerMinute(env) {
  const configured = Number.parseInt(env.INFINITEFLIGHT_UPSTREAM_REQUESTS_PER_MINUTE, 10);
  return Number.isSafeInteger(configured) && configured > 0
    ? configured
    : DEFAULT_REQUESTS_PER_MINUTE;
}

export class InfiniteFlightUpstreamCoordinator {
  constructor(ctx, env, fetchFn = fetch, now = () => Date.now()) {
    this.ctx = ctx;
    this.env = env;
    this.fetchFn = (...args) => fetchFn(...args);
    this.now = now;
    this.inFlight = new Map();
    this.requestsPerMinute = requestsPerMinute(env);
    this.ready = this.initialize();
  }

  async initialize() {
    const load = async () => {
      this.bucket = await this.ctx.storage.get(RATE_LIMIT_KEY) || {
        tokens: this.requestsPerMinute,
        updatedAt: this.now(),
      };
    };
    if (this.ctx.blockConcurrencyWhile) return this.ctx.blockConcurrencyWhile(load);
    return load();
  }

  async fetch(request) {
    await this.ready;
    const path = new URL(request.url).pathname;
    if (request.method !== 'GET' || !allowedPath(path)) {
      return response({ error: 'not_found', code: 'not_found' }, 404);
    }

    const cached = await this.ctx.storage.get(`cache:${path}`);
    if (cached?.expiresAt > this.now()) return this.cachedResponse(cached);

    let loading = this.inFlight.get(path);
    if (!loading) {
      loading = this.load(path);
      this.inFlight.set(path, loading);
    }

    try {
      return (await loading).clone();
    } finally {
      if (this.inFlight.get(path) === loading) this.inFlight.delete(path);
    }
  }

  async load(path) {
    const retryAfter = this.takeToken();
    if (retryAfter) {
      return response({ error: 'upstream_rate_limited', code: 'upstream_rate_limited' }, 429, {
        'retry-after': String(retryAfter),
      });
    }

    let upstream;
    try {
      upstream = await this.fetchFn(`${API_BASE_URL}${path}`, {
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${this.env.INFINITEFLIGHT_API_KEY}`,
        },
      });
    } catch (cause) {
      console.error('Infinite Flight upstream request failed', cause);
      return response({ error: 'upstream_unavailable', code: 'upstream_unavailable' }, 502);
    }

    const body = await upstream.text();
    if (upstream.status === 200) {
      const entry = { body, expiresAt: this.now() + cacheSeconds(path) * 1000 };
      await this.ctx.storage.put(`cache:${path}`, entry);
    }
    return new Response(body, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8' },
    });
  }

  takeToken() {
    const now = this.now();
    const elapsed = Math.max(0, now - this.bucket.updatedAt);
    const tokens = Math.min(
      this.requestsPerMinute,
      this.bucket.tokens + elapsed * this.requestsPerMinute / 60_000
    );
    this.bucket = { tokens, updatedAt: now };

    if (tokens < 1) {
      this.persistBucket();
      return Math.max(1, Math.ceil((1 - tokens) * 60 / this.requestsPerMinute));
    }

    this.bucket.tokens -= 1;
    this.persistBucket();
    return 0;
  }

  persistBucket() {
    const write = this.ctx.storage.put(RATE_LIMIT_KEY, this.bucket);
    if (this.ctx.waitUntil) this.ctx.waitUntil(write);
  }

  cachedResponse(entry) {
    return new Response(entry.body, {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}
