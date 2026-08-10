import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const route = readFileSync(join(root, 'infiniteflight/inbounds/index.html'), 'utf8');
const stylesheet = readFileSync(join(root, 'infiniteflight/infiniteflight.css'), 'utf8');
const inboundsScript = readFileSync(join(root, 'infiniteflight/js/inbounds.js'), 'utf8');
const apiScript = readFileSync(join(root, 'infiniteflight/js/api.js'), 'utf8');

const requiredFiles = [
  'infiniteflight/infiniteflight.css',
  'infiniteflight/assets/favicon.ico',
  'infiniteflight/assets/favicon-32x32.png',
  'infiniteflight/assets/apple-touch-icon.png',
  'infiniteflight/assets/site.webmanifest',
  'infiniteflight/js/main.js',
  'infiniteflight/js/inbounds.js',
  'infiniteflight/js/inbounds-map.js',
  'infiniteflight/js/airport.js',
  'infiniteflight/js/api.js',
  'infiniteflight/js/icao.js',
  'infiniteflight/js/search.js',
  'infiniteflight/js/spacing.js',
];

test('the Inbounds route is a standalone static page with its required controls', () => {
  assert.doesNotMatch(route, /^---/m, 'the route must not require Jekyll front matter');
  assert.match(route, /<link rel="stylesheet" href="\/infiniteflight\/infiniteflight\.css">/);
  assert.match(route, /<script type="module" src="\/infiniteflight\/js\/main\.js"><\/script>/);
  for (const id of ['icao', 'search', 'add', 'settings', 'update', 'flightsTable', 'mapCanvas']) {
    assert.match(route, new RegExp(`id="${id}"`), `${id} control is present`);
  }
});

test('the static route contains every local asset and module it needs', () => {
  for (const file of requiredFiles) {
    assert.ok(existsSync(join(root, file)), `${file} exists`);
  }
  assert.doesNotMatch(stylesheet, /^---/m, 'the stylesheet must be deployable CSS, not Jekyll Sass');
});

test('the route manifest keeps its icons within the restored asset directory', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'infiniteflight/assets/site.webmanifest'), 'utf8'));
  assert.equal(manifest.name, 'Infinite Flight Inbounds');
  for (const icon of manifest.icons) {
    assert.match(icon.src, /^\/infiniteflight\/assets\//);
    assert.ok(existsSync(join(root, icon.src.slice(1))), `${icon.src} exists`);
  }
});

test('the restored UI only calls the same-origin Infinite Flight proxy and bounds polling', () => {
  assert.match(inboundsScript, /const PROXY_URL = '\/api\/infiniteflight'/);
  assert.match(inboundsScript, /FLIGHT_POLL_INTERVAL_MS = 15_000/);
  assert.match(inboundsScript, /CLIENT_INACTIVITY_LIMIT_MS = 15 \* 60 \* 1000/);
  assert.match(inboundsScript, /scheduleInactivityStop/);
  assert.match(inboundsScript, /infiniteflight-api-error/);
  assert.match(apiScript, /AIRPORTDB_URL = "\/api\/infiniteflight\/airport\/"/);
  assert.doesNotMatch(inboundsScript, /infiniteflightapi\.deno\.dev/);
  assert.doesNotMatch(apiScript, /infiniteflightapi\.deno\.dev/);
});

test('map initialization waits for a flight selection', () => {
  const map = readFileSync(join(root, 'infiniteflight/js/inbounds-map.js'), 'utf8');
  assert.doesNotMatch(map, /setTimeout\(\(\) => showMapPopup\(allFlights\[0\]/,
    'an empty initial flight list must not throw before a search');
});
