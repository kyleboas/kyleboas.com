import test from 'node:test';
import assert from 'node:assert/strict';
import { handleInfiniteFlightRequest } from '../src/infiniteflight-core.js';

const API_BASE_URL = 'https://api.infiniteflight.com/public/v2';

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

function env(upstream = async () => new Response()) {
  return {
    INFINITEFLIGHT_API_KEY: 'test-key',
    INFINITEFLIGHT_SESSION_NAME: 'Expert Server',
    CORS_ORIGIN: 'https://kyleboas.com',
    INFINITEFLIGHT_COORDINATOR: {
      idFromName(name) {
        assert.equal(name, 'shared-infiniteflight-api-key');
        return name;
      },
      get() {
        return {
          fetch(input) {
            const path = new URL(typeof input === 'string' ? input : input.url).pathname;
            return upstream(`${API_BASE_URL}${path}`, {
              headers: {
                accept: 'application/json',
                authorization: 'Bearer test-key',
              },
            });
          },
        };
      },
    },
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

  const first = await handleInfiniteFlightRequest(request('/flights'), env(fetchFn), cache);
  const second = await handleInfiniteFlightRequest(request('/flights'), env(fetchFn), cache);

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

  const session = await handleInfiniteFlightRequest(request('/session'), env(fetchFn), cache);
  const flights = await handleInfiniteFlightRequest(request('/flights'), env(fetchFn), cache);

  assert.equal(session.status, 200);
  assert.equal(flights.status, 200);
  assert.match(session.headers.get('cache-control'), /max-age=600/);
  assert.equal(sessionCalls, 1);
  assert.match(flights.headers.get('cache-control'), /max-age=15/);
});

test('keeps the upstream key unavailable when missing, rate limited, or inaccessible', async () => {
  let called = false;
  const missing = await handleInfiniteFlightRequest(request('/flights'), {}, new MockCache());
  assert.equal(missing.status, 503);
  assert.deepEqual(await missing.json(), {
    error: 'infiniteflight_not_configured', code: 'infiniteflight_not_configured',
  });
  assert.equal(called, false);

  const rateLimited = await handleInfiniteFlightRequest(request('/flights'), env(async (url) => {
    if (url.endsWith('/sessions')) {
      return Response.json({ errorCode: 0, result: [{ id: 'session-123', name: 'Expert Server' }] });
    }
    return new Response(null, { status: 429, headers: { 'retry-after': '30' } });
  }), new MockCache());
  assert.equal(rateLimited.status, 429);
  assert.deepEqual(await rateLimited.json(), {
    error: 'upstream_rate_limited', code: 'upstream_rate_limited',
  });
  assert.equal(rateLimited.headers.get('retry-after'), '30');
});

test('reports safe diagnostics without exposing upstream response bodies', async () => {
  const rejected = await handleInfiniteFlightRequest(request('/session'), env(async () => (
    new Response('provider details stay private', { status: 500 })
  )), new MockCache());
  assert.equal(rejected.status, 502);
  assert.equal(rejected.headers.get('x-infiniteflight-upstream-status'), '500');
  assert.deepEqual(await rejected.json(), {
    error: 'upstream_unavailable', code: 'upstream_unavailable',
  });

  const coordinatorFailure = env();
  coordinatorFailure.INFINITEFLIGHT_COORDINATOR.get = () => ({
    fetch() {
      throw new Error('private runtime details');
    },
  });
  const failed = await handleInfiniteFlightRequest(
    request('/session'), coordinatorFailure, new MockCache()
  );
  assert.equal(failed.status, 502);
  assert.equal(failed.headers.get('x-infiniteflight-failure'), 'coordinator');
  assert.deepEqual(await failed.json(), {
    error: 'upstream_unavailable', code: 'upstream_unavailable',
  });
});

test('fails closed when the global upstream coordinator binding is unavailable', async () => {
  const response = await handleInfiniteFlightRequest(request('/session'), {
    INFINITEFLIGHT_API_KEY: 'test-key',
  }, new MockCache());

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: 'upstream_coordinator_not_configured', code: 'upstream_coordinator_not_configured',
  });
});

test('exposes only the shared session and flight snapshot routes', async () => {
  for (const path of ['/sessions/not-a-real-session/flights', '/world', '/atc', '/airport/KJFK']) {
    const response = await handleInfiniteFlightRequest(request(path), env(), new MockCache());
    assert.equal(response.status, 404, `${path} is not public`);
    assert.deepEqual(await response.json(), { error: 'not_found', code: 'not_found' });
  }
});
