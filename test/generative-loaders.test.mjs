/*
 * Regression cover for the static port of Generative Loaders.
 *
 * The gallery is generated from tools/loader-geometry.mjs, so these tests
 * recompute the upstream formulas independently and assert the committed HTML
 * carries those exact numbers. That is what catches a loader being "not
 * correct": a particle field copied from the wrong generator, a stagger that
 * counts the wrong index, or an element the vendored CSS can never target.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'ui/index.html'), 'utf8');
const css = readFileSync(join(root, 'ui/generative-loaders.css'), 'utf8');
const js = readFileSync(join(root, 'ui/generative-loaders.js'), 'utf8');

const { GENERATIVE_LOADERS } = await import(new URL('../ui/generative-loaders.js', import.meta.url));
const { buildCollections, renderInto } = await import(new URL('../tools/generate-loader-markup.mjs', import.meta.url));

const card = (key) => {
  const match = new RegExp(`<article class="gl-card[^"]*" data-gl-loader="${key}">[\\s\\S]*?</article>`).exec(html);
  assert.ok(match, `card missing: ${key}`);
  return match[0];
};
const styles = (markup) => [...markup.matchAll(/style="([^"]*)"/g)].map((m) => m[1]);
const varOf = (style, name) => {
  const m = new RegExp(`--${name}:([^;"]*)`).exec(style);
  return m ? m[1] : undefined;
};

/* --- the committed markup is what the generator produces --- */

test('ui/index.html matches the loader generator output', () => {
  assert.equal(renderInto(html, buildCollections(GENERATIVE_LOADERS)), html,
    'run node tools/generate-loader-markup.mjs and commit the result');
});

/* --- the vendored upstream stylesheet stays untouched --- */

test('the vendored Generative Loaders stylesheet is byte-identical to upstream', () => {
  const start = css.indexOf(':root {');
  const end = css.indexOf('/* Static-gallery framing');
  assert.ok(start >= 0 && end > start, 'vendored region markers missing');
  const digest = createHash('sha256').update(css.slice(start, end).trimEnd()).digest('hex');
  assert.equal(digest, '7cc93ec6738ee27ffe7dfaf03989546b14c231782faccf61ea0759317f39edbd',
    'the upstream MIT stylesheet region was modified; adapt in the gallery layer below it instead');
  assert.match(css, /licensed under MIT/, 'attribution header survives');
});

/* --- inline loader geometry --- */

test('vortex places its dots on three rings, not a rectangular grid', () => {
  /* Upstream: rings of 8/12/16 dots on circles of radius 18 + ring * 14. */
  const expected = [8, 12, 16].flatMap((count, ring) => Array.from({ length: count }, (_, index) => ({
    x: 50 + Math.sin((index * (360 / count) + ring * 11) * Math.PI / 180) * (18 + ring * 14),
    y: 50 - Math.cos((index * (360 / count) + ring * 11) * Math.PI / 180) * (18 + ring * 14),
    delay: -(ring * .12 + index / count),
    scale: 1 - ring * .12,
  })));
  const got = styles(card('inline-vortex'));
  assert.equal(got.length, 36, 'vortex keeps all 36 dots');
  for (const [i, style] of got.entries()) {
    assert.equal(varOf(style, 'il-x'), `${expected[i].x}%`, `dot ${i} x`);
    assert.equal(varOf(style, 'il-y'), `${expected[i].y}%`, `dot ${i} y`);
    assert.equal(varOf(style, 'il-delay'), `${expected[i].delay}s`, `dot ${i} delay`);
    assert.equal(varOf(style, 'il-scale'), String(expected[i].scale), `dot ${i} scale`);
  }
  /* A grid port gave every row the same y and marched x in equal steps. */
  const ys = new Set(got.map((s) => varOf(s, 'il-y')));
  assert.ok(ys.size > 6, 'ring dots must not collapse onto grid rows');
  assert.equal(new Set(got.map((s) => varOf(s, 'il-scale'))).size, 3, 'one scale per ring');
});

test('matrix, pixel-drift, domino and dot-pulse keep their upstream stagger', () => {
  const matrix = styles(card('inline-matrix'));
  assert.equal(matrix.length, 25);
  for (const [index, style] of matrix.entries()) {
    const distance = Math.abs((index % 5) - 2) + Math.abs(Math.floor(index / 5) - 2);
    assert.equal(varOf(style, 'il-distance'), String(distance), `cell ${index} distance`);
    assert.equal(varOf(style, 'il-delay'), `${distance * -.13 - index * .008}s`, `cell ${index} delay`);
  }
  const drift = styles(card('inline-pixel-drift'));
  for (const [index, style] of drift.entries()) {
    assert.equal(varOf(style, 'il-delay'), `${((index % 4) + Math.floor(index / 4)) * -.1}s`, `drift ${index}`);
  }
  const domino = styles(card('inline-domino'));
  for (const [index, style] of domino.entries()) {
    assert.equal(varOf(style, 'il-delay'), `calc(var(--il-duration) * ${(3 - index) * -.115})`, `domino ${index}`);
  }
  assert.deepEqual(styles(card('inline-dot-pulse')).map((s) => varOf(s, 'il-i')), ['3', '2', '1', '0']);
});

test('the rotor keeps upstream geometry and all three ring weights', () => {
  const rotor = card('inline-rotor');
  assert.match(rotor, /d="M50 56 L50 22 M50 56 L79\.45 73 M50 56 L20\.55 73"/);
  for (const ring of ['top', 'right', 'left']) {
    assert.match(rotor, new RegExp(`il-rotor-ring il-rotor-ring-${ring}`), `${ring} ring`);
  }
  assert.match(rotor, /il-rotor-hub-glow/);
});

/* --- image loader geometry --- */

test('image coalesce follows the golden-angle spiral, not the diffusion field', () => {
  const got = styles(card('image-coalesce'));
  assert.equal(got.length, 24);
  for (const [index, style] of got.entries()) {
    const angle = index * 137.508 * Math.PI / 180;
    const startX = 50 + Math.cos(angle) * (42 + ((index * 7) % 8));
    const startY = 50 + Math.sin(angle) * (38 + ((index * 11) % 10));
    assert.equal(varOf(style, 'iml-start-x'), `${startX}%`, `particle ${index} start x`);
    assert.equal(varOf(style, 'iml-start-y'), `${startY}%`, `particle ${index} start y`);
    assert.equal(varOf(style, 'iml-particle-size'), `${1.35 + ((index * 7) % 5) * .32}%`, `particle ${index} size`);
    assert.equal(varOf(style, 'iml-delay'), `calc(var(--iml-duration) * ${-((index * 11) % 24) / 24})`, `particle ${index} delay`);
    assert.equal(varOf(style, 'iml-particle-opacity'), String(.42 + (index % 4) * .12), `particle ${index} opacity`);
  }
  /* The regression this guards: start points cloned from diffusion's 8 + n%84. */
  const diffusionStart = styles(card('image-diffusion')).map((s) => varOf(s, 'iml-x'));
  assert.notDeepEqual(got.map((s) => varOf(s, 'iml-start-x')), diffusionStart.slice(0, 24));
});

test('image diffusion keeps upstream particle sizes and delays', () => {
  const got = styles(card('image-diffusion'));
  assert.equal(got.length, 28);
  for (const [index, style] of got.entries()) {
    assert.equal(varOf(style, 'iml-x'), `${8 + ((index * 37) % 84)}%`, `dot ${index} x`);
    assert.equal(varOf(style, 'iml-y'), `${8 + ((index * 53) % 84)}%`, `dot ${index} y`);
    assert.equal(varOf(style, 'iml-dot-size'), `${1.8 + ((index * 7) % 5) * .7}%`, `dot ${index} size`);
    assert.equal(varOf(style, 'iml-delay'), `calc(var(--iml-duration) * ${-((index * 13) % 28) / 28})`, `dot ${index} delay`);
  }
});

test('tiles, pixel-grid and resolution keep their upstream fields', () => {
  const tiles = styles(card('image-tiles'));
  for (const [index, style] of tiles.entries()) {
    const x = index % 4, y = Math.floor(index / 4);
    assert.equal(varOf(style, 'iml-delay'), `${(Math.abs(x - 1.5) + Math.abs(y - 1.5) - 4) * .12}s`, `tile ${index}`);
  }
  const grid = styles(card('image-pixel-grid'));
  for (const [index, style] of grid.entries()) {
    const x = index % 4, y = Math.floor(index / 4);
    assert.equal(varOf(style, 'iml-x'), String(x));
    assert.equal(varOf(style, 'iml-y'), String(y));
    assert.equal(varOf(style, 'iml-delay'), `${(x + y - 6) * .09}s`, `pixel ${index}`);
  }
  const resolution = styles(card('image-resolution'));
  assert.equal(resolution.length, 36);
  for (const [index, style] of resolution.entries()) {
    const x = index % 6, y = Math.floor(index / 6);
    assert.equal(varOf(style, 'iml-delay'), `${(Math.abs(x - 2.5) + Math.abs(y - 2.5) - 6) * .055}s`, `cell ${index}`);
    assert.equal(varOf(style, 'iml-tone'), `${28 + ((x * 13 + y * 9) % 34)}%`, `cell ${index} tone`);
  }
});

/* --- text loader structure: the vendored CSS must have something to target --- */

test('text loaders keep upstream word grouping and character elements', () => {
  for (const variant of GENERATIVE_LOADERS.text) {
    const markup = card(`text-${variant}`);
    assert.match(markup, /<span class="tl-visual" aria-hidden="true">/, `${variant}: decorative visual is hidden`);
    /* Skeleton shows bars rather than copy, and redact groups by its own
       word element, so neither runs through upstream's charNodes(). */
    if (variant === 'skeleton') continue;
    if (variant !== 'redact') assert.match(markup, /<span class="tl-word">/, `${variant}: words stay unbreakable`);
    assert.match(markup, /<span class="tl-space">/, `${variant}: spaces are their own token`);
  }
});

test('wave and tracking carry tl-char so their per-character sizing applies', () => {
  /* .tl-wave .tl-char and .tl-tracking .tl-char set min-width upstream; without
     the class the letters collapse and the reveal loses its rhythm. */
  assert.match(css, /\.tl-wave \.tl-char \{ min-width: \.16em; \}/);
  assert.match(css, /\.tl-tracking \.tl-char \{ min-width: \.14em;/);
  for (const variant of ['wave', 'tracking', 'cascade', 'focus', 'flip', 'typewriter']) {
    assert.match(card(`text-${variant}`), /class="tl-char gl-text-char"/, `${variant}: tl-char present`);
  }
});

test('decode scrambles unresolved characters', () => {
  const decode = card('text-decode');
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789()[]{}:;?/';
  assert.match(decode, /<span class="tl-decode-char"/, 'decode uses the two-layer character cell');
  const cells = [...decode.matchAll(/<span class="tl-decode-char" style="--gl-i:(\d+)"><b>(?:[^<]*)<\/b>(?:<i>([^<]*)<\/i>)?/g)];
  assert.ok(cells.length > 20, 'every character gets a cell');
  for (const [, index, scramble] of cells) {
    if (scramble === undefined) continue;
    assert.equal(scramble, glyphs[Number(index) % glyphs.length], `char ${index} scramble glyph`);
  }
  assert.match(css, /@keyframes gl-scramble/, 'the scramble layer burns off');
});

test('dissolve and coalesce emit their particle debris', () => {
  const dissolve = card('text-dissolve');
  assert.match(dissolve, /<span class="tl-dissolve-char"/);
  /* Upstream throws six particles per dissolving character and three per
     coalescing one; the offsets drive the CSS translate. */
  const firstDissolve = /<span class="tl-dissolve-char"[^>]*>[\s\S]*?<\/span>/.exec(dissolve)[0];
  assert.equal((firstDissolve.match(/<i aria-hidden="true"/g) || []).length, 6, 'six dissolve particles');
  const coalesce = card('text-coalesce');
  assert.match(coalesce, /<span class="tl-coalesce-char"/);
  const firstCoalesce = /<span class="tl-coalesce-char"[^>]*>[\s\S]*?<\/span>/.exec(coalesce)[0];
  assert.equal((firstCoalesce.match(/<i aria-hidden="true"/g) || []).length, 3, 'three coalesce particles');
  assert.match(css, /@keyframes gl-particle\b/);
  assert.match(css, /@keyframes gl-particle-in/);
});

test('slice and fragments keep their clip-path layers', () => {
  const slice = card('text-slice');
  for (const part of [1, 2, 3]) assert.match(slice, new RegExp(`tl-slice-part-${part}`), `slice part ${part}`);
  const fragments = card('text-fragments');
  for (const part of [1, 2, 3, 4]) assert.match(fragments, new RegExp(`tl-fragment-${part}`), `fragment ${part}`);
  /* Fragments fly in from the upstream offsets rather than a shared nudge. */
  assert.match(fragments, /--gl-px:-8px;--gl-py:-6px/);
  assert.match(css, /@keyframes gl-fragment/);
});

test('redact bars each word rather than the whole line', () => {
  const redact = card('text-redact');
  const words = redact.match(/<span class="tl-redact-word"/g) || [];
  assert.equal(words.length, 4, 'one bar per word in the sample sentence');
  assert.match(css, /\.tl-redact-word > i \{ animation: gl-redact[^}]*--gl-i/, 'bars lift in reading order');
});

test('line-by-line reveals a wrapped paragraph, not one word per row', () => {
  /* Upstream's legacy .tl-line grid makes every child span its own row. */
  assert.match(css, /\.tl-line > span \{ display: inline; width: auto; \}/);
});

/* --- count-up is a timer upstream, not a frozen number --- */

test('count-up counts instead of showing a fixed number', async () => {
  const countUp = card('inline-count-up');
  assert.match(countUp, /data-gl-count-up/, 'the counter is wired to the gallery script');
  assert.match(countUp, /data-value="0">0</, 'no-JS readers see the resting frame');
  assert.doesNotMatch(countUp, />42</, 'the placeholder number must not come back');
  const { countUpDelay } = await import(new URL('../ui/generative-loaders.js', import.meta.url));
  assert.equal(countUpDelay(0), 45, 'upstream steps every 45ms');
  assert.equal(countUpDelay(100), 800, 'and rests 800ms at the top');
  assert.match(js, /countUpDelay\(Number\(node\.dataset\.value\)\) \/ rate/, 'speed control drives the counter');
  assert.match(js, /if \(paused\) stopCounters\(\); else runCounters\(\)/, 'pause stops the counter');
  assert.match(js, /prefers-reduced-motion: reduce/, 'reduced motion stops the counter');
});

/* --- accessibility and licensing --- */

test('every loader is a labelled status with its decoration hidden', () => {
  for (const [collection, variants] of Object.entries(GENERATIVE_LOADERS)) {
    for (const variant of variants) {
      const markup = card(`${collection}-${variant}`);
      assert.match(markup, /role="status"/, `${collection}-${variant}: status role`);
      assert.match(markup, /aria-label="[^"]+ loading demonstration"/, `${collection}-${variant}: label`);
      assert.match(markup, new RegExp(`data-variant="${variant}"`), `${collection}-${variant}: variant hook`);
    }
  }
  for (const collection of ['text', 'image']) {
    const hidden = html.match(new RegExp(`gl-demo--${collection}"><span class="(?:tl|iml)-loader[^>]*>(<span class="(?:tl|iml)-visual" aria-hidden="true">)`, 'g')) || [];
    assert.equal(hidden.length, GENERATIVE_LOADERS[collection].length, `${collection}: every visual is aria-hidden`);
  }
});

test('reduced motion settles the restored particle layers', () => {
  const block = /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*$/.exec(css)[0];
  for (const selector of ['.tl-decode-char > b', '.tl-dissolve-char > b', '.tl-coalesce-char > b',
    '.tl-slice-char > i', '.tl-fragment-char > i']) {
    assert.ok(block.includes(selector), `reduced motion must settle ${selector}`);
  }
  for (const selector of ['.tl-decode-char > i', '.tl-dissolve-char > i', '.tl-coalesce-char > i']) {
    assert.ok(block.includes(selector), `reduced motion must clear ${selector}`);
  }
});
