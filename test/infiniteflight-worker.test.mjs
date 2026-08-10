import test from 'node:test';
import assert from 'node:assert/strict';
import { handleInfiniteFlightRequest } from '../src/infiniteflight-core.js';

class MockCache {
  entries = new Map();

  async match(request) {
    const response = this.entries.get(request.url);
    return response?.clone();
  }

  async put(request, response) {
    this.entries.set(request.url, response.clone());
  }
}

function env() {
  return {
    INFINITEFLIGHT_API_KEY: 'test-key',
    INFINITEFLIGHT_SESSION_NAME: 'Expert Server',
    CORS_ORIGIN: 'https://kyleboas.com',
  };
}

function request(path) {
  return new Request(`https://kyleboas.com/api/infiniteflight${path}`);
}

test('discovers the configured session server-side and caches flights for 15 seconds', async () => {
  const calls = [];
  const fetchFn = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/sessions')) {
      return Response.json({
        errorCode: 0,
        result: [{ id: 'session-123', name: 'Expert Server' }],
      });
    }
    if (url.endsWith('/sessions/session-123/flights')) {
      return Response.json({ errorCode: 0, result: [{ flightId: 'flight-123' }] });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };
  const cache = new MockCache();

  const first = await handleInfiniteFlightRequest(request('/flights'), env(), fetchFn, cache);
  const second = await handleInfiniteFlightRequest(request('/flights'), env(), fetchFn, cache);

  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), { errorCode: 0, result: [{ flightId: 'flight-123' }] });
  assert.equal(second.status, 200);
  assert.equal(calls.length, 2, 'the second flight request is served from operational cache');
  assert.equal(calls[0].url, 'https://api.infiniteflight.com/public/v2/sessions');
  assert.equal(calls[1].url, 'https://api.infiniteflight.com/public/v2/sessions/session-123/flights');
  assert.equal(calls[0].options.headers.authorization, 'Bearer test-key');
  assert.match(first.headers.get('cache-control'), /max-age=15/);
});

test('does not fetch an upstream session more than once while its ten-minute cache is fresh', async () => {
  let sessionCalls = 0;
  const fetchFn = async (url) => {
    if (url.endsWith('/sessions')) {
      sessionCalls += 1;
      return Response.json({ errorCode: 0, result: [{ id: 'session-123', name: 'Expert Server' }] });
    }
    return Response.json({ errorCode: 0, result: [] });
  };
  const cache = new MockCache();

  const session = await handleInfiniteFlightRequest(request('/session'), env(), fetchFn, cache);
  const world = await handleInfiniteFlightRequest(request('/world'), env(), fetchFn, cache);

  assert.equal(session.status, 200);
  assert.equal(world.status, 200);
  assert.match(session.headers.get('cache-control'), /max-age=600/);
  assert.equal(sessionCalls, 1);
  assert.match(world.headers.get('cache-control'), /max-age=15/);
});

test('keeps the upstream key unavailable when missing, rate limited, or inaccessible', async () => {
  let called = false;
  const missing = await handleInfiniteFlightRequest(request('/flights'), {}, async () => {
    called = true;
    return new Response();
  }, new MockCache());
  assert.equal(missing.status, 503);
  assert.deepEqual(await missing.json(), {
    error: 'infiniteflight_not_configured', code: 'infiniteflight_not_configured',
  });
  assert.equal(called, false);

  const rateLimited = await handleInfiniteFlightRequest(request('/flights'), env(), async (url) => {
    if (url.endsWith('/sessions')) {
      return Response.json({ errorCode: 0, result: [{ id: 'session-123', name: 'Expert Server' }] });
    }
    return new Response(null, { status: 429, headers: { 'retry-after': '30' } });
  }, new MockCache());
  assert.equal(rateLimited.status, 429);
  assert.deepEqual(await rateLimited.json(), {
    error: 'upstream_rate_limited', code: 'upstream_rate_limited',
  });
  assert.equal(rateLimited.headers.get('retry-after'), '30');
});

test('does not permit arbitrary upstream paths or browser-supplied session IDs', async () => {
  const response = await handleInfiniteFlightRequest(request('/sessions/not-a-real-session/flights'), env(),
    async () => new Response(), new MockCache());

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'not_found', code: 'not_found' });
});
