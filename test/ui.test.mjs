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
  assert.equal(SPECIMENS.length, 7, 'seven original specimens remain');
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

test('the top nav is one compact Subscribe pill, not an inline field', () => {
  const nav = (html.match(/<nav class="topnav"[\s\S]*?<\/nav>/) || [])[0];
  assert.ok(nav, 'the nav is present');
  assert.match(nav, /aria-label="Site"/);
  assert.ok(nav.includes('href="/"'), 'the identity links home');

  /* The visible control is a compact pill; the field it opens ships hidden. */
  assert.match(
    nav,
    /<button type="button" class="topnav-link topnav-link--js" data-newsletter-open aria-expanded="false" aria-controls="newsletter-form">Subscribe<\/button>/,
    'a compact Subscribe button is the resting state'
  );
  assert.match(nav, /<form class="topnav-signup" id="newsletter-form"[^>]*data-newsletter-signup[^>]*hidden>/,
    'the field is hidden until the pill is clicked');
  assert.match(css, /\.topnav-signup\[hidden\] \{ display: none; \}/);

  /* Without JS the same pill is an anchor to the feed; the sheet swaps them. */
  assert.match(nav, /<a class="topnav-link topnav-link--nojs" href="\/feed">Subscribe<\/a>/);
  assert.match(css, /\.topnav-link--js \{ display: none; \}/);
  assert.match(css, /\.js \.topnav-link--js \{ display: inline-flex; \}/);
  assert.match(css, /\.js \.topnav-link--nojs \{ display: none; \}/);

  assert.doesNotMatch(nav, /Archive/, 'archive is not a destination in this nav');
  /* Nothing left of the modal attempt, and no visible label to leak. */
  for (const f of [html, css, js]) {
    for (const dangling of [/signup-dialog/, /newsletter-dialog/, /topnav-signup-label/, /topnav-fallback/]) {
      assert.doesNotMatch(f, dangling, `stale reference: ${dangling}`);
    }
  }

  /* The mark is the site face, sized in markup so the row never shifts. */
  assert.match(
    nav,
    /<img class="topnav-face" src="\/assets\/IMG_0124\.png" alt="[^"]+" width="26" height="26" decoding="async">/,
    'the face is a local, pre-sized image'
  );
  assert.doesNotMatch(nav, /KB</, 'no initials mark survives');
  assert.doesNotMatch(css, /\.topnav-mark/, 'the drawn initials mark is gone from the sheet');
  assert.doesNotMatch(html, /raw\.githubusercontent\.com/, 'no remote image dependency');

  /* Nothing anywhere still drives or styles the removed disclosure menu. */
  for (const f of [html, css, js]) {
    for (const dangling of [/data-menu-toggle/, /topnav-menu/, /topnav-toggle/]) {
      assert.doesNotMatch(f, dangling, `dangling menu reference: ${dangling}`);
    }
  }

  assert.match(css, /--blue: #[0-9a-f]{6}/i, 'a blue token exists');
  assert.match(css, /\.topnav-link \{[\s\S]*?background: var\(--blue\); color: #fff;/);
  assert.match(css, /\.topnav-link:hover \{ background: var\(--blue-deep\); \}/);
  assert.match(css, /@media \(max-width: 560px\) \{[\s\S]*?\.topnav-link \{ min-height: 36px;/);
  assert.match(css, /@media \(max-width: 560px\) \{[\s\S]*?\.topnav-signup input \{ min-height: 44px; font-size: 16px;/);
});

test('clicking Subscribe turns the nav slot into the field, not a popup', () => {
  const nav = (html.match(/<nav class="topnav"[\s\S]*?<\/nav>/) || [])[0];
  assert.match(nav, /<div class="topnav-cta" data-newsletter-cta>/, 'pill and field share one slot');
  assert.match(nav, /action="\/api\/newsletter\/signup" method="post"/);
  assert.match(
    nav,
    /<input id="newsletter-email"[^>]*type="email"[^>]*autocomplete="email"[^>]*aria-label="Email address"[^>]*required>/,
    'the field is named without a visible label in the row'
  );
  assert.match(nav, /<button type="submit" class="topnav-signup-go">Subscribe<\/button>/);
  assert.match(nav, /data-newsletter-cancel aria-label="Cancel"/, 'a cancel affordance exists');
  assert.match(nav, /data-newsletter-status[^>]*aria-live="polite"/);

  /* Open swaps the pill for the field in place; nothing overlays the page. */
  assert.match(js, /cta\.dataset\.state = 'open'/);
  assert.match(js, /newsletter\.hidden = false/);
  assert.match(js, /openBtn\.setAttribute\('aria-expanded', 'true'\)/);
  assert.match(js, /if \(email\) email\.focus\(\)/, 'focus lands on the field');
  assert.match(css, /\.topnav-cta\[data-state="open"\] \.topnav-link \{ display: none; \}/);
  assert.match(css, /\.topnav-signup \{[^}]*animation: ui-cta-open/, 'the field grows out of the row');
  assert.doesNotMatch(css, /\.topnav-signup \{[^}]*position: (?:fixed|absolute)/, 'the field stays in the row');
  /* The code viewer keeps its own dialog; the signup must not have one. */
  assert.doesNotMatch(html, /<dialog[^>]*newsletter/i, 'signup lives in the nav, not a dialog');
  assert.doesNotMatch(js, /signupDialog/, 'no signup dialog is driven from JS');

  /* Cancel and Escape put the pill back and hand focus with it. */
  assert.match(js, /if \(event\.key !== 'Escape'\) return;/);
  assert.match(js, /newsletter\.hidden = true/);
  assert.match(js, /openBtn\.setAttribute\('aria-expanded', 'false'\)/);
  assert.match(js, /if \(restoreFocus\) openBtn\.focus\(\)/, 'focus returns to the pill');
  assert.match(js, /cta\.contains\(event\.target\)/, 'a click outside collapses the row');
});

test('newsletter signup posts explicit consent and handles API success states', () => {
  assert.match(js, /fetch\('\/api\/newsletter\/signup'/);
  assert.match(js, /source: 'website'/);
  assert.match(js, /consent: \{ newsletter: true \}/);
  assert.match(js, /result\.status === 'confirmation_sent'/);
  assert.match(js, /result\.status === 'already_subscribed'/);
  assert.match(js, /announce\('Submitting your email…', 'submitting'\)/, 'a submitting state is announced');
  assert.match(js, /announce\(errorMessage\(error\.message\), 'error'\)/, 'failures land in the live region');
  assert.match(js, /submit\.disabled = true/);
  assert.match(js, /newsletter\.reportValidity\(\)/);
  assert.match(css, /\.topnav-signup-status\[data-state="success"\]/);
  assert.match(css, /\.topnav-signup-status\[data-state="error"\]/);
  assert.match(css, /\.topnav-signup-go:disabled \{ opacity: \.65; cursor: wait; \}/);
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
  assert.equal(heads.length, SPECIMENS.length + 1, 'one extra header introduces the loader collection');
  for (const [i, head] of heads.slice(0, SPECIMENS.length).entries()) {
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
    SPECIMENS.length + 3,
    'one live region per specimen, loader collection, dialog, and newsletter signup'
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
  const githubLinks = html.match(/href="https:\/\/github\.com\/kasturikhanke\/generative-loaders"/g) || [];
  assert.equal(githubLinks.length, 1, 'only the public Generative Loaders attribution links to GitHub');
  assert.doesNotMatch(html, /href="[^"]*(diver-notes|yourscout|tools-kyleboas)/, 'no private repo links');
});

test('the page links nowhere unexpected', () => {
  const allowed = ['https://tacticsjournal.com', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://github.com/kasturikhanke/generative-loaders'];
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
  const generativeCss = readFileSync(join(root, 'ui/generative-loaders.css'), 'utf8');
  const generativeJs = readFileSync(join(root, 'ui/generative-loaders.js'), 'utf8');
  const bytes = [html, css, js, generativeCss, generativeJs].reduce((n, f) => n + Buffer.byteLength(f), 0);
  assert.ok(bytes < 190_000, `custom /ui/ assets are ${bytes} bytes`);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/, 'no third-party scripts');
});

test('the complete MIT-licensed Generative Loaders collection is present', async () => {
  const { GENERATIVE_LOADERS } = await import(new URL('../ui/generative-loaders.js', import.meta.url));
  const expected = { text: 16, inline: 18, image: 12 };
  assert.match(html, /id="generative-loaders"/);
  assert.match(html, /GENERATIVE_LOADERS_LICENSE\.md/);
  assert.match(html, /github\.com\/kasturikhanke\/generative-loaders/);
  for (const [collection, count] of Object.entries(expected)) {
    assert.equal(GENERATIVE_LOADERS[collection].length, count, `${collection}: full collection`);
    for (const variant of GENERATIVE_LOADERS[collection]) {
      assert.match(html, new RegExp(`data-gl-loader="${collection}-${variant}"`), `${collection}: ${variant}`);
    }
  }
  assert.equal(Object.values(GENERATIVE_LOADERS).flat().length, 46, 'all available loaders are shown');
});
