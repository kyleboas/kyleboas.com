import test from 'node:test';
import assert from 'node:assert/strict';
import { InfiniteFlightUpstreamCoordinator } from '../src/infiniteflight-coordinator.js';

class MockStorage {
  entries = new Map();

  async get(key) {
    return this.entries.get(key);
  }

  async put(key, value) {
    this.entries.set(key, value);
  }
}

function context(storage = new MockStorage()) {
  return {
    storage,
    blockConcurrencyWhile(callback) {
      return callback();
    },
    waitUntil() {},
  };
}

function request(path) {
  return new Request(`https://infiniteflight-coordinator${path}`);
}

test('coalesces concurrent global cache misses into one upstream request', async () => {
  let resolveUpstream;
  let upstreamCalls = 0;
  const upstream = new Promise((resolve) => {
    resolveUpstream = resolve;
  });
  const coordinator = new InfiniteFlightUpstreamCoordinator(context(), {
    INFINITEFLIGHT_API_KEY: 'test-key',
  }, async () => {
    upstreamCalls += 1;
    return upstream;
  });

  const first = coordinator.fetch(request('/sessions/session-123/flights'));
  const second = coordinator.fetch(request('/sessions/session-123/flights'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(upstreamCalls, 1);

  resolveUpstream(Response.json({ errorCode: 0, result: [{ flightId: 'flight-123' }] }));
  const [firstResponse, secondResponse] = await Promise.all([first, second]);
  assert.deepEqual(await firstResponse.json(), { errorCode: 0, result: [{ flightId: 'flight-123' }] });
  assert.deepEqual(await secondResponse.json(), { errorCode: 0, result: [{ flightId: 'flight-123' }] });
});

test('persists a shared token bucket that bounds cache misses across coordinator instances', async () => {
  let now = 0;
  let upstreamCalls = 0;
  const sharedContext = context();
  const env = {
    INFINITEFLIGHT_API_KEY: 'test-key',
    INFINITEFLIGHT_UPSTREAM_REQUESTS_PER_MINUTE: '2',
  };
  const upstream = async () => {
    upstreamCalls += 1;
    return Response.json({ errorCode: 0, result: [] });
  };
  const firstInstance = new InfiniteFlightUpstreamCoordinator(sharedContext, env, upstream, () => now);

  assert.equal((await firstInstance.fetch(request('/sessions/one/flights'))).status, 200);
  assert.equal((await firstInstance.fetch(request('/sessions/two/flights'))).status, 200);

  const restartedInstance = new InfiniteFlightUpstreamCoordinator(sharedContext, env, upstream, () => now);
  const limited = await restartedInstance.fetch(request('/sessions/three/flights'));
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '30');
  assert.equal(upstreamCalls, 2);

  now = 30_000;
  assert.equal((await restartedInstance.fetch(request('/sessions/three/flights'))).status, 200);
  assert.equal(upstreamCalls, 3);
});

test('uses one shared session snapshot for at least ten minutes and flight snapshots for 15 seconds', async () => {
  let now = 0;
  let upstreamCalls = 0;
  const coordinator = new InfiniteFlightUpstreamCoordinator(context(), {
    INFINITEFLIGHT_API_KEY: 'test-key',
  }, async () => {
    upstreamCalls += 1;
    return Response.json({ errorCode: 0, result: [] });
  }, () => now);

  await coordinator.fetch(request('/sessions'));
  now = 599_999;
  await coordinator.fetch(request('/sessions'));
  assert.equal(upstreamCalls, 1);

  await coordinator.fetch(request('/sessions/session-123/flights'));
  now += 14_999;
  await coordinator.fetch(request('/sessions/session-123/flights'));
  assert.equal(upstreamCalls, 2);

  now += 1;
  await coordinator.fetch(request('/sessions/session-123/flights'));
  assert.equal(upstreamCalls, 3);
});
