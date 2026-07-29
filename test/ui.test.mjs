import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'ui/index.html'), 'utf8');
const css = readFileSync(join(root, 'ui/parts.css'), 'utf8');
const js = readFileSync(join(root, 'ui/parts.js'), 'utf8');

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

test('each entry has a matching section and heading in the page', () => {
  for (const s of SPECIMENS) {
    assert.match(html, new RegExp(`<section class="spec" id="${s.id}" aria-labelledby="${s.id}-h">`), s.id);
    assert.match(html, new RegExp(`<h2 id="${s.id}-h">`), `${s.id}: heading`);
  }
});

test('the watchful dashboard specimen is gone, leaving nothing behind', () => {
  assert.equal(SPECIMENS.length, 7, 'seven specimens remain');
  assert.equal(SPECIMENS.find((s) => s.id === 'watchful-row'), undefined);
  for (const f of [html, css, js]) {
    for (const dangling of [/watchful/i, /demo-watch/, /stage--watchful/, /yourscout/]) {
      assert.doesNotMatch(f, dangling, `dangling reference: ${dangling}`);
    }
  }
});

test('the top index block is gone at every width', () => {
  for (const f of [html, css, js]) {
    for (const dangling of [/\brail-/, /class="rail"/, /\.rail\b/, /Collection index/]) {
      assert.doesNotMatch(f, dangling, `index rail must not survive: ${dangling}`);
    }
  }
  assert.doesNotMatch(html, /<ol class="[^"]*rail/, 'no numbered index list');
});

test('the top nav is the page chrome: identity, local face, disclosure menu', () => {
  assert.match(html, /<nav class="topnav" aria-label="Site">/);
  assert.match(html, /<img class="topnav-face" src="\/assets\/IMG_0124\.png"[^>]*width="28" height="28"/,
    'local avatar with intrinsic size, so the nav does not shift');
  assert.doesNotMatch(html, /raw\.githubusercontent\.com/, 'no remote image dependency');
  const toggle = (html.match(/<button[^>]*data-menu-toggle[^>]*>/) || [])[0];
  assert.ok(toggle, 'the hamburger is a real button');
  assert.match(toggle, /type="button"/);
  assert.match(toggle, /aria-expanded="false"/);
  assert.match(toggle, /aria-controls="topnav-menu"/);
  assert.match(html, /<div class="topnav-menu" id="topnav-menu" hidden>/);
  for (const href of ['href="/"', 'href="/archive.html"', 'href="/ui/"']) {
    assert.ok(html.includes(href), `menu link missing: ${href}`);
  }
  /* Keyboard: Escape closes it and focus goes back to the button. */
  assert.match(js, /e\.key !== 'Escape'/);
  assert.match(js, /menuBtn\.focus\(\)/);
  /* The menu expands in flow, so it never covers the specimens on a phone. */
  assert.doesNotMatch(css, /\.topnav-menu \{[^}]*position: absolute/);
});

test('choosing a variant replays that specimen without a second click', () => {
  /* The variant control announces the change on the stage; each animated
     stage plays itself from that event, cancelling its own pending timer. */
  assert.match(js, /new CustomEvent\('variantchange'/, 'variant selection announces itself');
  assert.match(js, /stage\.addEventListener\('variantchange'/, 'the stage replays on variant change');
  assert.match(js, /const play = \(note\) => \{/, 'one play function drives button and variant alike');
  assert.match(js, /window\.clearTimeout\(timer\)/, 'a new play cancels the previous one');
  assert.match(js, /void stage\.offsetWidth;/, 'a reflow restarts the animation');
  /* Keyboard selection runs the same select(), so arrows replay too. */
  assert.match(js, /next\.focus\(\);\s*\n\s*select\(next\);/);
  /* Reduced motion: state changes, no motion, nothing left blank. */
  assert.match(js, /if \(reduced\.matches\) \{[\s\S]{0,220}?is-done/);
});

test('every section carries one compact header row: number, name, blurb', () => {
  const heads = [...html.matchAll(/<div class="spec-head">([\s\S]*?)<\/div>/g)].map((m) => m[1]);
  assert.equal(heads.length, SPECIMENS.length, 'one spec-head per specimen');
  for (const [i, head] of heads.entries()) {
    const s = SPECIMENS[i];
    assert.match(head, /<span class="spec-n">\d{2}<\/span>/, `${s.id}: catalogue number`);
    assert.match(head, new RegExp(`<h2 id="${s.id}-h">${s.name}</h2>`), `${s.id}: name`);
    assert.match(head, /<p class="spec-blurb">/, `${s.id}: blurb`);
    assert.equal(
      (head.match(/<p class="spec-blurb">/g) || []).length,
      1,
      `${s.id}: exactly one blurb`
    );
  }
  /* Provenance lives on the surface, not in the header row. */
  assert.equal(
    (html.match(/<p class="spec-prov">/g) || []).length,
    SPECIMENS.length,
    'one provenance line per specimen, outside the header'
  );
});

test('the code shown in the page is the code in the data model', () => {
  const unescape = (t) =>
    t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
  const blocks = [...html.matchAll(/<pre class="spec-src"><code>([\s\S]*?)<\/code><\/pre>/g)].map(
    (m) => unescape(m[1])
  );
  assert.equal(blocks.length, SPECIMENS.length, 'one hidden code source per specimen');
  for (const [i, s] of SPECIMENS.entries()) {
    assert.equal(blocks[i], s.code.trim(), `${s.id}: rendered code drifted from the data model`);
  }
});

test('the per-section code source stays reachable without JS', () => {
  /* The <pre> is in the normal document and only stepped aside once the JS
     class lands, so no-JS readers and tests keep the code. */
  assert.doesNotMatch(html, /<pre class="spec-src" hidden/, 'code source must not be hidden in markup');
  assert.match(css, /\.js \.spec-src \{ display: none; \}/);
  assert.match(html, /<dialog class="code-dialog" id="code-dialog"/, 'code moves into a native dialog');
  assert.match(js, /dialog\.showModal\(\)/);
});

test('the big-type form is gone, replaced by the one-purpose tool', () => {
  for (const f of [html, css, js]) {
    assert.doesNotMatch(f, /big-type-form/, 'big-type-form identifier must not survive');
    assert.doesNotMatch(f, /demo-form/, 'the old form markup must not survive');
  }
  const tool = SPECIMENS.find((s) => s.id === 'one-purpose-tool');
  assert.ok(tool, 'one-purpose-tool specimen exists');
  assert.match(html, /id="one-purpose-tool-stage"/);
  assert.match(css, /\.demo-tool-btns button \{[\s\S]*?min-height: 44px;/, '44px controls');
  assert.match(css, /\.demo-tool textarea \{[\s\S]*?font-size: 15px;/, '15px field');
});

test('the viewport-measurement scaffolding is gone', () => {
  for (const f of [html, css, js]) {
    assert.doesNotMatch(f, /stage--bleed/, 'stage--bleed must not survive');
    assert.doesNotMatch(f, /--vw\b/, 'viewport measurement must not survive');
  }
  assert.doesNotMatch(js, /clientWidth/, 'no viewport width measurement in JS');
  assert.match(css, /\.shell \{[\s\S]*?max-width: 720px;/, 'one centered column');
});

test('the surface is the visual focus', () => {
  assert.match(css, /\.surface \{[\s\S]*?min-height: 272px;/);
  assert.match(css, /\.surface \{[\s\S]*?background: var\(--canvas\);/);
  assert.match(css, /\.surface \{[\s\S]*?box-shadow: 0 0 0 1px var\(--line\);/);
  assert.match(css, /\.surface-in \{[\s\S]*?max-width: 480px;/);
});

test('tokens are scoped to the page, not the global root', () => {
  assert.doesNotMatch(css, /:root\s*\{/, 'no global token block in the page stylesheet');
  for (const token of ['--canvas: #f2f2f3', '--surface: #fff', '--field: #ececed', '--hover: #f4f4f5',
    '--ink: #1a1a1a', '--ink-2: #5c5f63', '--ink-3: #8a8d92', '--page: #fcfcfc']) {
    assert.ok(css.includes(token), `missing token ${token}`);
  }
  assert.doesNotMatch(css, /#2563eb|#0d6efd|#3b82f6/i, 'no borrowed blue accent');
});

test('a motion token block exists and the sheet reads from it', () => {
  assert.match(css, /\/\* ---- motion tokens ---- \*\//);
  assert.match(css, /\/\* ---- end motion tokens ---- \*\//);
  for (const token of ['--duration-quick', '--duration-fast', '--duration-very-slow',
    '--ease-smooth-out', '--ease-in-out', '--blur-small']) {
    assert.ok(css.includes(token), `missing motion token ${token}`);
  }
  assert.ok(css.includes('var(--duration-quick)'), 'motion tokens are referenced, not just declared');
});

test('no raw durations outside the motion token block and its stated exceptions', () => {
  const start = css.indexOf('/* ---- motion tokens ---- */');
  const end = css.indexOf('/* ---- end motion tokens ---- */');
  assert.ok(start >= 0 && end > start);
  const outside = css.slice(0, start) + css.slice(end);
  const offenders = outside
    .split('\n')
    .filter((line) => !line.includes('allow-duration'))
    .filter((line) => /(?:^|[\s:,(])\d*\.?\d+\s*m?s\b/.test(line));
  assert.deepEqual(offenders, [], 'hardcoded durations must use the motion tokens');
});

test('reduced-motion alternatives exist in the stylesheet', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation: none !important/);
  assert.match(css, /transition: none !important/);
  assert.match(js, /prefers-reduced-motion: reduce/, 'JS honours reduced motion too');
});

test('controls are real buttons with visible focus and a live region', () => {
  assert.doesNotMatch(css, /outline:\s*none/, 'no outline suppression');
  assert.match(css, /:focus-visible \{ outline: 2px solid/);
  assert.equal(
    (html.match(/aria-live="polite"/g) || []).length,
    SPECIMENS.length + 1,
    'one live region per specimen plus the dialog'
  );
  for (const attr of html.match(/<button[^>]*>/g) || []) {
    assert.match(attr, /type="(button|submit)"/, `button missing an explicit type: ${attr}`);
  }
  assert.equal((html.match(/<div class="surface-actions">/g) || []).length, SPECIMENS.length);
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

test('the page links nowhere unexpected', () => {
  const allowed = ['https://tacticsjournal.com', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
  for (const m of html.matchAll(/href="(https?:[^"]+)"/g)) {
    assert.ok(
      allowed.some((a) => m[1].startsWith(a)),
      `unexpected external link: ${m[1]}`
    );
  }
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
  const bytes = [html, css, js].reduce((n, f) => n + Buffer.byteLength(f), 0);
  assert.ok(bytes < 100_000, `custom /ui/ assets are ${bytes} bytes`);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/, 'no third-party scripts');
});
