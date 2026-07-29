/* UI collection — data model + progressive enhancement.
   Every entry is lifted from code that actually ships in one of the projects
   below. Private projects contribute presentational CSS only: no endpoints,
   no data models, no copy from the real product. */

export const SPECIMENS = [
  {
    id: 'blur-lift',
    name: 'Blur-lift entrance',
    blurb: 'Content is visible first, then lifts the last six pixels out of a five-pixel blur. Stagger comes from a data attribute, not per-element CSS.',
    project: { name: 'kyleboas.com' },
    source: { repo: 'kyleboas/kyleboas.com', path: 'style.css', public: true, href: '/style.css' },
    theme: 'paper',
    surface: 'inline',
    scope: 'motion',
    tags: ['motion', 'entrance', 'stagger'],
    variants: ['single', 'staggered'],
    status: 'shipped',
    code: `.fade{opacity:0;filter:blur(5px);transform:translateY(-6px)}
.fade.v{animation:fi .55s cubic-bezier(.2,.8,.2,1) forwards}
[data-s="1"]{animation-delay:80ms}
[data-s="2"]{animation-delay:160ms}
@keyframes fi{to{opacity:1;filter:blur(0);transform:translateY(0)}}
@media(prefers-reduced-motion:reduce){
  .fade{opacity:1;filter:none;transform:none;animation:none!important}
}`
  },
  {
    id: 'timeline-dots',
    name: 'Timeline state dots',
    blurb: 'A one-pixel rule with dots sitting on it. The active dot changes fill and gains a soft ring instead of a second colour or an icon.',
    project: { name: 'kyleboas.com' },
    source: { repo: 'kyleboas/kyleboas.com', path: 'style.css', public: true, href: '/style.css' },
    theme: 'paper',
    surface: 'inline',
    scope: 'component',
    tags: ['list', 'state', 'hairline'],
    variants: ['resting', 'active'],
    status: 'shipped',
    code: `.tl{position:relative;padding-left:24px}
.tl::before{content:'';position:absolute;left:4px;top:8px;bottom:8px;
  width:1px;background:rgba(0,0,0,.06)}
.dot{position:absolute;left:-24px;top:14px;width:9px;height:9px;
  border-radius:50%;background:#999;transform:translateX(.5px)}
.dot.active{background:#1a1a1a;box-shadow:0 0 0 3px rgba(26,26,26,.12)}`
  },
  {
    id: 'dotted-rule-links',
    name: 'Dotted-rule link row',
    blurb: 'The underline is a repeating four-pixel gradient parked on the baseline, so it can change colour on hover without a border repaint or layout shift.',
    project: { name: 'kyleboas.com' },
    source: { repo: 'kyleboas/kyleboas.com', path: 'style.css', public: true, href: '/style.css' },
    theme: 'paper',
    surface: 'inline',
    scope: 'component',
    tags: ['links', 'typography', 'hover'],
    variants: ['row', 'inline'],
    status: 'shipped',
    code: `.links a{color:#666;background-image:linear-gradient(to right,#999 50%,transparent 50%);
  background-position:0 1.2em;background-repeat:repeat-x;background-size:4px 1px;
  padding-bottom:2px;transition:color .2s,background-image .2s}
.links a:hover{color:#1a1a1a;
  background-image:linear-gradient(to right,#1a1a1a 50%,transparent 50%)}`
  },
  {
    id: 'big-type-form',
    name: 'Big-type utility form',
    blurb: 'A single-purpose tool with no chrome: thirty-pixel label, thirty-pixel field, one filled button and one outlined one. The mobile step is a wholesale rescale, not a tweak.',
    project: { name: 'Tools' },
    source: { repo: 'tools-kyleboas', path: 'public/plain-text/index.html', public: false },
    theme: 'utility',
    surface: 'inline',
    scope: 'pattern',
    tags: ['forms', 'scale', 'responsive'],
    variants: ['desktop scale', 'compact scale'],
    status: 'shipped',
    code: `label{display:block;margin:0 0 16px;font-size:30px;line-height:1.1;
  font-weight:700;letter-spacing:-.025em}
textarea{width:100%;border:2px solid #d9d9d9;border-radius:18px;padding:26px 25px;
  font:inherit;font-size:30px;line-height:1.25}
button{min-height:84px;border:2px solid #111;border-radius:19px;padding:0 30px;
  background:#111;color:#fff;font-size:30px;font-weight:700}
button.secondary{background:#fff;color:#111;border-color:#d9d9d9}`
  },
  {
    id: 'motion-tokens',
    name: 'Three durations, two curves',
    blurb: 'Every animation in the app spends one of three durations and one of two curves, so a route change, a drawer and a button press read as the same hand.',
    project: { name: 'Notes app' },
    source: { repo: 'diver-notes', path: 'src/app/globals.css', public: false },
    theme: 'tokens',
    surface: 'inline',
    scope: 'tokens',
    tags: ['motion', 'tokens', 'system'],
    variants: ['fast', 'base', 'slow'],
    status: 'shipped',
    code: `:root{
  --motion-fast:120ms;
  --motion-base:200ms;
  --motion-slow:280ms;
  --ease-out:cubic-bezier(.22,1,.36,1);
  --ease-in-out:cubic-bezier(.4,0,.2,1);
  --press-scale:.97;
}`
  },
  {
    id: 'drawn-check',
    name: 'Check that draws itself',
    blurb: 'The mark is an L of two borders turned forty-five degrees. Clipping it before the rotation walks the pen from one free end, through the corner, to the other; the box fills first and the mark lands a beat later.',
    project: { name: 'Notes app' },
    source: { repo: 'diver-notes', path: 'src/app/globals.css', public: false },
    theme: 'tokens',
    surface: 'inline',
    scope: 'component',
    tags: ['motion', 'forms', 'feedback'],
    variants: ['unchecked', 'checked'],
    status: 'shipped',
    code: `.check::after{content:"";position:absolute;left:5px;top:2px;width:4px;height:8px;
  border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}
.check:checked::after{animation:checkmark-in 160ms var(--ease-out) 40ms both}
@keyframes checkmark-in{
  from{opacity:0;transform:rotate(45deg) scale(.8);clip-path:inset(75% 100% 0 0)}
  30%{opacity:1;clip-path:inset(75% 0 0 0)}
  to{opacity:1;transform:rotate(45deg) scale(1);clip-path:inset(0 0 0 0)}
}`
  },
  {
    id: 'watchful-row',
    name: 'Watchful dashboard row',
    blurb: 'A dark workspace where hierarchy comes from type and spacing. Uppercase eleven-pixel labels, a tabular number, and a hairline that is stronger under the header than between rows.',
    project: { name: 'Scouting dashboard' },
    source: { repo: 'yourscout', path: 'DESIGN.md, make-dashboard.py', public: false },
    theme: 'watchful',
    surface: 'bleed',
    scope: 'pattern',
    tags: ['dark', 'density', 'tables'],
    variants: ['rows', 'tiles'],
    status: 'shipped',
    code: `.watch{--bg:#08090a;--panel:#0f1011;--line:#23252a;--line-t:#ffffff0d;
  --ink:#f7f8f8;--mut:#8a8f98;--mut-2:#62666d;--accent:#8fbd78}
.watch th{font-size:11px;font-weight:510;text-transform:uppercase;
  letter-spacing:.06em;color:var(--mut-2);border-bottom:1px solid var(--line)}
.watch td{border-bottom:1px solid var(--line-t);vertical-align:top;padding:10px 16px}
.watch tr:hover td{background:#1c1c1f}`
  },
  {
    id: 'alternating-tiles',
    name: 'Alternating tile surfaces',
    blurb: 'Full-bleed sections stacked parchment, white, dark. The surface change is the divider, so no borders, shadows or cards are needed to separate them.',
    project: { name: 'Tactics Journal' },
    source: { repo: 'tacticsjournal', path: 'DESIGN.md', public: false },
    theme: 'editorial',
    surface: 'bleed',
    scope: 'pattern',
    tags: ['layout', 'full-bleed', 'editorial'],
    variants: ['parchment', 'dark'],
    status: 'shipped',
    code: `.tile{padding:80px 24px}
.tile>.inner{max-width:760px;margin:0 auto}
.tile--parchment{background:#f5f5f7;color:#1d1d1f}
.tile--canvas{background:#fff;color:#1d1d1f}
.tile--dark{background:#272729;color:#d2d2d7}
.tile--dark a{color:#2997ff}
@media(max-width:640px){.tile{padding:56px 20px}}`
  }
];

const REQUIRED = ['id', 'name', 'blurb', 'code', 'theme', 'surface', 'scope', 'status'];

/** Entries missing required identity or provenance fields are refused, not rendered. */
export function isRenderable(entry) {
  if (!entry || typeof entry !== 'object') return false;
  if (!REQUIRED.every((k) => typeof entry[k] === 'string' && entry[k].trim())) return false;
  if (!entry.project || !entry.project.name) return false;
  if (!entry.source || !entry.source.repo || !entry.source.path) return false;
  if (!Array.isArray(entry.tags) || !entry.tags.length) return false;
  if (!Array.isArray(entry.variants) || entry.variants.length < 1) return false;
  return true;
}

export const RENDERABLE = SPECIMENS.filter(isRenderable);

if (typeof document !== 'undefined') {
  const byId = new Map(RENDERABLE.map((s) => [s.id, s]));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.documentElement.classList.add('js');

  /* Full-bleed stages measure against the viewport minus its scrollbar; 100vw
     includes the scrollbar and would push the page sideways by its width. */
  const setViewportWidth = () => {
    document.documentElement.style.setProperty('--vw', `${document.documentElement.clientWidth}px`);
  };
  setViewportWidth();
  window.addEventListener('resize', setViewportWidth);

  /* Copy buttons: the code shown in the page is the code copied. */
  for (const btn of document.querySelectorAll('[data-copy]')) {
    const section = btn.closest('section[id]');
    const pre = section && section.querySelector('pre');
    const status = section && section.querySelector('[data-status]');
    if (!pre) continue;
    btn.hidden = false;
    btn.addEventListener('click', async () => {
      const text = pre.textContent.replace(/\s+$/, '');
      try {
        if (!navigator.clipboard) throw new Error('unavailable');
        await navigator.clipboard.writeText(text);
        if (status) status.textContent = 'Copied to clipboard.';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        if (status) status.textContent = 'Copy was blocked. The code is selected — copy it manually.';
      }
    });
  }

  /* Variant controls: plain buttons in a radio-group, arrow keys included. */
  for (const group of document.querySelectorAll('[data-variants]')) {
    const buttons = [...group.querySelectorAll('button')];
    const target = document.getElementById(group.dataset.variants);
    if (!target || !buttons.length) continue;
    const select = (btn) => {
      for (const b of buttons) b.setAttribute('aria-checked', String(b === btn));
      target.dataset.variant = btn.dataset.variant;
    };
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn) select(btn);
    });
    group.addEventListener('keydown', (e) => {
      const i = buttons.indexOf(document.activeElement);
      if (i < 0) return;
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = buttons[(i + 1) % buttons.length];
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = buttons[(i - 1 + buttons.length) % buttons.length];
      if (!next) return;
      e.preventDefault();
      next.focus();
      select(next);
    });
  }

  /* Animation examples replay on demand. Nothing autoplays. */
  for (const btn of document.querySelectorAll('[data-replay]')) {
    const stage = document.getElementById(btn.dataset.replay);
    if (!stage) continue;
    btn.hidden = false;
    btn.addEventListener('click', () => {
      const status = btn.closest('section[id]').querySelector('[data-status]');
      if (reduced.matches) {
        stage.classList.remove('is-playing');
        stage.classList.add('is-done');
        if (status) status.textContent = 'Reduced motion: end state shown immediately.';
        return;
      }
      stage.classList.remove('is-playing', 'is-done');
      void stage.offsetWidth;
      stage.classList.add('is-playing');
      if (status) status.textContent = 'Replayed.';
    });
  }

  /* Sticky index highlights the section in view. */
  const links = [...document.querySelectorAll('.ui-index a')];
  if (links.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          for (const a of links) {
            a.setAttribute('aria-current', a.hash === `#${entry.target.id}` ? 'true' : 'false');
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    for (const id of byId.keys()) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
  }
}
