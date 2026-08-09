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
const { buildCollections, renderInto, textVisual } = await import(new URL('../tools/generate-loader-markup.mjs', import.meta.url));

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

/* Upstream splits its text variants in two. Stream variants (SkeletonText,
   WipeText, RedactText, LineText, TerminalText) splitAt() the stream cursor and
   animate the incoming remainder as ONE element; everything else runs through
   charNodes(). Getting this backwards is the exact class of defect that shipped
   skeleton bars over real copy and four redact bars instead of one. */
const STREAM_TEXT = ['skeleton', 'wipe', 'redact', 'line', 'terminal'];

test('stream text variants reveal one incoming token, not per-character markup', () => {
  for (const variant of STREAM_TEXT) {
    const markup = card(`text-${variant}`);
    assert.doesNotMatch(markup, /tl-word|tl-char|gl-text-char/,
      `${variant}: upstream never routes a stream variant through charNodes()`);
    assert.match(markup, />Thinking through the details\.</,
      `${variant}: the incoming phrase is emitted as one intact run`);
  }
});

test('stream text variants emit upstream element structure exactly', () => {
  const phrase = 'Thinking through the details.';
  /* Left-hand <span> is upstream's already-settled stable half; the gallery
     replays a cursor at 0, so it is empty and the phrase is all incoming. */
  const expected = {
    skeleton: `<span class="tl-copy tl-skeleton-stream"><span></span><span class="tl-skeleton-token">${phrase}</span></span>`,
    wipe: `<span class="tl-copy tl-wipe-stream"><span></span><span>${phrase}</span></span>`,
    line: `<span class="tl-copy tl-line-stream"><span></span><span>${phrase}</span></span>`,
    redact: `<span class="tl-copy tl-redact"><span></span><span class="tl-redact-word"><span>${phrase}</span><i></i></span></span>`,
    terminal: `<span class="tl-copy tl-terminal"><b aria-hidden="true">&rsaquo;</b><span><span>${phrase}</span></span><i class="tl-terminal-cursor"></i></span>`,
  };
  for (const [variant, markup] of Object.entries(expected)) {
    assert.ok(card(`text-${variant}`).includes(markup), `${variant}: upstream structure`);
  }
  /* Skeleton only falls back to shimmer bars while the stream is still empty. */
  assert.match(textVisual('skeleton', ''), /tl-skeleton-wrap.*tl-skeleton.*<i><\/i><i><\/i>/);
  assert.doesNotMatch(card('text-skeleton'), /tl-skeleton-wrap/,
    'a non-empty stream must show copy, not bars');
});

test('charNodes variants keep upstream word grouping and raw whitespace', () => {
  for (const variant of GENERATIVE_LOADERS.text) {
    const markup = card(`text-${variant}`);
    assert.match(markup, /<span class="tl-visual" aria-hidden="true">/, `${variant}: decorative visual is hidden`);
    if (STREAM_TEXT.includes(variant)) continue;
    assert.match(markup, /<span class="tl-word">/, `${variant}: words stay unbreakable`);
    /* Upstream puts the raw whitespace in .tl-space (styled pre-wrap) rather
       than routing spaces through the per-character render. */
    assert.match(markup, /<span class="tl-space"><span> <\/span><\/span>/, `${variant}: raw space token`);
    assert.doesNotMatch(markup, /<span class="tl-space">(?:(?!<\/span>).)*&nbsp;/, `${variant}: no padded space chars`);
  }
});

test('the port matches the canonical upstream DOM for every text and image loader', () => {
  /* Element/class/content parity, checked against the shapes recorded from
     react-dom/server output of kasturikhanke/generative-loaders. Inline styles
     legitimately differ: upstream emits framer-motion's initial frame, the
     static port drives the same reveal from CSS keyframes. */
  const shapes = {
    'text-decode': /tl-copy tl-decode.*<span class="tl-decode-char"[^>]*><b>T<\/b><i>A<\/i><\/span>/,
    'text-dissolve': /tl-copy tl-dissolve.*<span class="tl-dissolve-char"[^>]*><b>T<\/b><i aria-hidden="true"/,
    'text-coalesce': /tl-copy tl-coalesce.*<span class="tl-coalesce-char"[^>]*><b>T<\/b><i style/,
    'text-slice': /<i class="tl-slice-part tl-slice-part-1" style="--gl-px:-3px;--gl-p:0">T<\/i>/,
    'text-fragments': /<i class="tl-fragment tl-fragment-1" style="--gl-px:-8px;--gl-py:-6px;--gl-f:0">T<\/i>/,
    'image-skeleton': /<span class="iml-skeleton"><i><\/i><b><\/b><\/span>/,
    'image-bands': /<span class="iml-bands"><i><\/i><i><\/i><i><\/i><b><\/b><\/span>/,
    'image-scan': /<span class="iml-scan"><i><\/i><b><\/b><em><\/em><\/span>/,
    'image-bloom': /<span class="iml-bloom"><i><\/i><b><\/b><em><\/em><\/span>/,
    'image-focus': /<span class="iml-focus"><i><\/i><i><\/i><i><\/i><b><\/b><\/span>/,
    'image-shutter': /<span class="iml-shutter"><i><\/i><i><\/i><b><\/b><em><\/em><\/span>/,
  };
  for (const [key, shape] of Object.entries(shapes)) assert.match(card(key), shape, key);
  /* Upstream marks dissolve's debris aria-hidden and leaves coalesce's bare. */
  assert.doesNotMatch(card('text-coalesce'), /aria-hidden="true"><\/i>/,
    'coalesce particles carry no aria-hidden upstream');
  /* Element counts upstream fixes per variant. */
  const counts = { 'image-tiles': 16, 'image-pixel-grid': 16, 'image-resolution': 36, 'image-diffusion': 28, 'image-raster': 8 };
  for (const [key, n] of Object.entries(counts)) {
    assert.equal((card(key).match(/<i /g) || []).length, n, `${key}: ${n} elements`);
  }
  assert.equal((card('image-coalesce').match(/<i /g) || []).length, 24, 'image-coalesce: 24 particles');
});

test('loaders expose the upstream state attributes', () => {
  for (const collection of Object.keys(GENERATIVE_LOADERS)) {
    for (const variant of GENERATIVE_LOADERS[collection]) {
      assert.match(card(`${collection}-${variant}`), /data-speed="1" data-paused="false"/,
        `${collection}-${variant}: upstream state hooks`);
    }
  }
  assert.match(card('text-decode'), /data-received-length="29"/, 'text loaders report the received length');
  /* The gallery controls must keep those attributes honest. */
  assert.match(js, /loader\.dataset\.paused = String\(paused\)/);
  assert.match(js, /loader\.dataset\.speed = String\(speed\)/);
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
  /* Upstream marks only dissolve's debris aria-hidden; coalesce's <i> are bare. */
  const firstCoalesce = /<span class="tl-coalesce-char"[^>]*>[\s\S]*?<\/span>/.exec(coalesce)[0];
  assert.equal((firstCoalesce.match(/<i style/g) || []).length, 3, 'three coalesce particles');
  assert.doesNotMatch(firstCoalesce, /aria-hidden/, 'coalesce debris carries no aria-hidden');
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

test('redact draws one bar over the incoming phrase', () => {
  const redact = card('text-redact');
  const bars = redact.match(/<span class="tl-redact-word"/g) || [];
  assert.equal(bars.length, 1, 'upstream bars the incoming run once, not per word');
  assert.doesNotMatch(redact, /--gl-i/, 'a single bar has no per-character stagger');
  /* transform-origin: right upstream, so the bar wipes off toward the end. */
  assert.match(css, /@keyframes gl-redact \{[\s\S]*?scaleX\(\.18\)/, 'bar collapses through .18');
  assert.match(css, /\.tl-redact-word > span \{ animation: gl-redact-copy/, 'copy lifts out from under it');
});

test('line-by-line clips one incoming run rather than per-character spans', () => {
  assert.match(card('text-line'), /tl-copy tl-line-stream/, 'upstream uses the stream wrapper');
  assert.doesNotMatch(css, /\.tl-line \{ display: block; \}/, 'the invented .tl-line override is gone');
  assert.match(css, /\.tl-line-stream > span:last-child \{ animation-name: gl-line-stream; \}/);
  /* opacity 0, x -3, clipPath inset(0 100% 0 0) upstream. */
  assert.match(css, /@keyframes gl-line-stream \{[^}]*translateX\(-3px\)[^}]*inset\(0 100% 0 0\)/);
});

test('per-character reveals use upstream stagger, not a whole-loop spread', () => {
  /* The defect this pins: a large negative per-index delay spread the phrase
     across most of the cycle, so ~13 of 29 characters were mid-reveal at any
     instant and a hole travelled through the sentence. Upstream's stagger() is
     min(.035, (index - start) * .005) — the chunk lands very nearly together. */
  assert.doesNotMatch(css, /animation-delay:[^;]*var\(--gl-i\) \* -/,
    'a negative per-index delay desynchronises characters across the loop');
  assert.match(css, /animation-delay: min\(calc\(var\(--gl-i\) \* 5ms\), 35ms\)/,
    'stagger is 5ms per character capped at 35ms');
  /* Dissolve is the one upstream ripple: min(.2, index * .018). */
  assert.match(css, /\.tl-dissolve-char > b \{\s*animation-name: gl-dissolve;\s*animation-delay: min\(calc\(var\(--gl-i\) \* 18ms\), 200ms\);/);
  /* Every reveal must settle and then hold, never dip back out mid-cycle. */
  for (const name of ['gl-text-in', 'gl-type', 'gl-cascade', 'gl-wave', 'gl-focus', 'gl-flip',
    'gl-track', 'gl-dissolve', 'gl-coalesce', 'gl-decode', 'gl-fragment', 'gl-slice',
    'gl-wipe', 'gl-line-stream', 'gl-skeleton-token']) {
    const block = new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n`).exec(css);
    assert.ok(block, `${name} defined`);
    assert.match(block[1], /\d+%, 100% \{/, `${name} holds its settled frame to 100%`);
  }
});

test('reveal keyframes carry the upstream initial states', () => {
  /* Each value below is the framer-motion `initial` upstream sets. */
  const expected = [
    [/@keyframes gl-cascade \{[^}]*translateY\(4px\)/, 'cascade y: 4'],
    [/@keyframes gl-wave \{[^}]*translateY\(4px\) scale\(\.94\)/, 'wave y: 4, scale: .94'],
    [/@keyframes gl-focus \{[^}]*opacity: \.18; filter: blur\(2px\)/, 'focus opacity .18, blur 2px'],
    [/@keyframes gl-flip \{[^}]*rotateX\(-42deg\) translateY\(1px\)/, 'flip rotateX -42, y 1'],
    [/@keyframes gl-track \{[^}]*scaleX\(1\.06\)/, 'tracking scaleX 1.06'],
    [/@keyframes gl-dissolve \{[^}]*opacity: \.05/, 'dissolve opacity .05'],
    [/@keyframes gl-coalesce \{[^}]*scale\(\.9\)/, 'coalesce scale .9'],
    [/@keyframes gl-skeleton-token \{[^}]*blur\(2px\); transform: translateY\(2px\)/, 'skeleton y 2, blur 2px'],
    [/@keyframes gl-slice \{[^}]*translateX\(var\(--gl-px\)\)/, 'slice shears from its own offset'],
  ];
  for (const [pattern, label] of expected) assert.match(css, pattern, label);
  /* Wave is its own curve upstream; it must not be aliased onto cascade. */
  assert.doesNotMatch(css, /\.tl-wave \.gl-text-char \{ animation-name: gl-cascade; \}/);
  /* Both carets blink: upstream animates tl-cursor as well as tl-terminal-cursor. */
  assert.match(css, /\.tl-cursor \{ animation: gl-caret/, 'the typewriter caret blinks');
  assert.match(css, /\.tl-terminal-cursor \{ animation: gl-cursor/);
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
