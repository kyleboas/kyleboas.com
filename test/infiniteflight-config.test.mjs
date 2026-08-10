import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const newsletterConfig = JSON.parse(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
const infiniteFlightConfig = JSON.parse(
  readFileSync(join(root, 'wrangler.infiniteflight.jsonc'), 'utf8')
);

function routes(config) {
  return config.routes;
}

test('newsletter Worker configuration remains newsletter-only', () => {
  assert.equal(newsletterConfig.name, 'kyleboas-newsletter-api');
  assert.equal(newsletterConfig.main, 'src/newsletter-worker.js');
  assert.deepEqual(routes(newsletterConfig), ['kyleboas.com/api/newsletter/*']);
  assert.ok(newsletterConfig.d1_databases);
  assert.equal(newsletterConfig.durable_objects, undefined);
  assert.equal(newsletterConfig.migrations, undefined);
});

test('Infinite Flight has an isolated Worker configuration and Durable Object', () => {
  assert.equal(infiniteFlightConfig.name, 'infiniteflight-inbounds');
  assert.equal(infiniteFlightConfig.main, 'src/infiniteflight-worker.js');
  assert.deepEqual(routes(infiniteFlightConfig), ['kyleboas.com/api/infiniteflight/*']);
  assert.equal(infiniteFlightConfig.d1_databases, undefined);
  assert.deepEqual(infiniteFlightConfig.durable_objects.bindings, [
    {
      name: 'INFINITEFLIGHT_COORDINATOR',
      class_name: 'InfiniteFlightUpstreamCoordinator',
    },
  ]);
  assert.deepEqual(infiniteFlightConfig.migrations, [
    {
      tag: 'v1',
      new_sqlite_classes: ['InfiniteFlightUpstreamCoordinator'],
    },
  ]);
  assert.equal(infiniteFlightConfig.vars.INFINITEFLIGHT_SESSION_NAME, 'Expert Server');
  assert.equal(infiniteFlightConfig.vars.INFINITEFLIGHT_UPSTREAM_REQUESTS_PER_MINUTE, '30');
  assert.equal(infiniteFlightConfig.vars.INFINITEFLIGHT_API_KEY, undefined);
});
