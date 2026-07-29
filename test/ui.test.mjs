import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'ui/index.html'), 'utf8');
const css = readFileSync(join(root, 'ui/parts.css'), 'utf8');

const { SPECIMENS, RENDERABLE, isRenderable } = await import(
  new URL('../ui/parts.js', import.meta.url)
);

const REQUIRED = ['id', 'name', 'blurb', 'code', 'theme', 'surface', 'scope', 'status'];

test('every entry carries the required non-empty fields', () => {
  for (const s of SPECIMENS) {
    for (const key of REQUIRED) {
      assert.equal(typeof s[key], 'string', `${s.id}: ${key} must be a string`);
      assert.ok(s[key].trim().length, `${s.id}: ${key} must not be empty`);
    }
    assert.ok(s.project?.name?.trim(), `${s.id}: project.name required`);
    assert.ok(s.source?.repo?.trim(), `${s.id}: source.repo required`);
    assert.ok(s.source?.path?.trim(), `${s.id}: source.path required`);
    assert.ok(Array.isArray(s.tags) && s.tags.length, `${s.id}: tags required`);
    assert.ok(Array.isArray(s.variants) && s.variants.length, `${s.id}: variants required`);
  }
});

test('ids are unique', () => {
  const ids = SPECIMENS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('the renderer refuses entries missing required source fields', () => {
  assert.equal(RENDERABLE.length, SPECIMENS.length);
  assert.equal(isRenderable({ ...SPECIMENS[0], source: { repo: 'x' } }), false);
  assert.equal(isRenderable({ ...SPECIMENS[0], name: '  ' }), false);
  assert.equal(isRenderable({ ...SPECIMENS[0], project: {} }), false);
});

test('each entry has a matching section and index anchor in the page', () => {
  for (const s of SPECIMENS) {
    assert.match(html, new RegExp(`<section id="${s.id}" aria-labelledby="${s.id}-h">`), s.id);
    assert.match(html, new RegExp(`<h2 id="${s.id}-h">`), `${s.id}: heading`);
    assert.match(html, new RegExp(`href="#${s.id}"`), `${s.id}: index link`);
  }
});

test('the code shown in the page is the code in the data model', () => {
  const unescape = (t) =>
    t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
  const blocks = [...html.matchAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g)].map((m) =>
    unescape(m[1])
  );
  assert.equal(blocks.length, SPECIMENS.length);
  for (const [i, s] of SPECIMENS.entries()) {
    assert.equal(blocks[i], s.code.trim(), `${s.id}: rendered code drifted from the data model`);
  }
});

test('reduced-motion alternatives exist in the stylesheet', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation: none !important/);
});

test('private provenance is never emitted as a link', () => {
  for (const s of SPECIMENS) {
    if (s.source.public) continue;
    assert.equal(s.source.href, undefined, `${s.id}: private source must not carry an href`);
    const escaped = s.source.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const linked = new RegExp(`<a[^>]*>[^<]*${escaped}`);
    assert.doesNotMatch(html, linked, `${s.id}: private path rendered inside an anchor`);
  }
  assert.doesNotMatch(html, /href="[^"]*github\.com/, 'no GitHub links on the page');
  assert.doesNotMatch(html, /href="[^"]*(diver-notes|yourscout|tools-kyleboas)/, 'no private repo links');
});

test('specimen code carries no external or private URLs', () => {
  const allowed = ['https://kyleboas.com', 'https://tacticsjournal.com'];
  for (const s of SPECIMENS) {
    for (const url of s.code.match(/https?:\/\/[^\s'"();]+/g) ?? []) {
      assert.ok(
        allowed.some((a) => url.startsWith(a)),
        `${s.id}: unexpected URL in specimen code: ${url}`
      );
    }
  }
});

test('assets stay small and dependency-free', () => {
  const bytes = [html, css, readFileSync(join(root, 'ui/parts.js'), 'utf8')].reduce(
    (n, f) => n + Buffer.byteLength(f),
    0
  );
  assert.ok(bytes < 100_000, `custom /ui/ assets are ${bytes} bytes`);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/, 'no third-party scripts');
});
