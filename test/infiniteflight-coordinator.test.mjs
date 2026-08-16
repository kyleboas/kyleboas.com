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

test('invokes the Worker fetch function without an object receiver', async () => {
  let receiver;
  const fetchFn = async function () {
    receiver = this;
    return Response.json({ errorCode: 0, result: [] });
  };
  const coordinator = new InfiniteFlightUpstreamCoordinator(
    context(), { INFINITEFLIGHT_API_KEY: 'test-key' }, fetchFn, () => 1_000
  );

  const response = await coordinator.fetch(request('/sessions'));

  assert.equal(response.status, 200);
  assert.equal(receiver, undefined);
});

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

test('keeps large flight snapshots out of size-limited durable storage', async () => {
  const storage = new MockStorage();
  const originalPut = storage.put.bind(storage);
  storage.put = async (key, value) => {
    if (key.startsWith('cache:/sessions/') && JSON.stringify(value).length > 1_000) {
      throw new Error('durable object value too large');
    }
    return originalPut(key, value);
  };
  let upstreamCalls = 0;
  const largeFlight = { flightId: 'flight-123', payload: 'x'.repeat(2_000) };
  const coordinator = new InfiniteFlightUpstreamCoordinator(context(storage), {
    INFINITEFLIGHT_API_KEY: 'test-key',
  }, async () => {
    upstreamCalls += 1;
    return Response.json({ errorCode: 0, result: [largeFlight] });
  }, () => 1_000);

  const first = await coordinator.fetch(request('/sessions/session-123/flights'));
  const second = await coordinator.fetch(request('/sessions/session-123/flights'));

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(upstreamCalls, 1);
  assert.equal(storage.entries.has('cache:/sessions/session-123/flights'), false);
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
