/* UI collection — data model + progressive enhancement.
   Every entry is lifted from code that actually ships in one of the projects
   below. Private projects contribute presentational CSS only: no endpoints,
   no data models, no copy from the real product. */

export const SPECIMENS = [
  {
    id: 'blur-lift',
    name: 'Blur-lift entrance',
    blurb: 'Visible first, then the last six pixels lift out of a five-pixel blur.',
    project: { name: 'kyleboas.com' },
    source: { repo: 'kyleboas/kyleboas.com', path: 'style.css', public: true, href: '/style.css' },
    theme: 'paper',
    surface: 'standard',
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
    blurb: 'A hairline with dots on it; the active one changes fill and gains a ring.',
    project: { name: 'kyleboas.com' },
    source: { repo: 'kyleboas/kyleboas.com', path: 'style.css', public: true, href: '/style.css' },
    theme: 'paper',
    surface: 'standard',
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
    blurb: 'The underline is a repeating gradient on the baseline, so hover never shifts layout.',
    project: { name: 'kyleboas.com' },
    source: { repo: 'kyleboas/kyleboas.com', path: 'style.css', public: true, href: '/style.css' },
    theme: 'paper',
    surface: 'standard',
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
    id: 'one-purpose-tool',
    name: 'One-purpose tool',
    blurb: 'Four states, one field: empty, has value, copied, cleared. The label carries the state.',
    project: { name: 'Tools' },
    source: { repo: 'tools', path: 'plain-text', public: false },
    theme: 'utility',
    surface: 'standard',
    scope: 'pattern',
    tags: ['forms', 'state', 'feedback'],
    variants: ['empty', 'filled'],
    status: 'shipped',
    code: `.tool label{display:block;margin:0 0 6px;font-size:15px;font-weight:500}
.tool textarea{width:100%;border:1px solid var(--line);border-radius:10px;
  padding:10px 12px;font:inherit;font-size:15px;line-height:1.45}
.tool button{min-height:44px;border-radius:10px;padding:0 16px;font-size:15px}
.tool[data-state="copied"] .go{background:var(--ink)}
.tool.is-clearing textarea{opacity:0;filter:blur(2px);
  transition:opacity 400ms ease-in-out,filter 400ms ease-in-out}`
  },
  {
    id: 'motion-tokens',
    name: 'Three durations, two curves',
    blurb: 'A route change, a drawer and a button press read as one hand because they share a scale.',
    project: { name: 'Notes app' },
    source: { repo: 'diver-notes', path: 'globals.css', public: false },
    theme: 'tokens',
    surface: 'standard',
    scope: 'tokens',
    tags: ['motion', 'tokens', 'system'],
    variants: ['base', 'inout'],
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
    blurb: 'Clipping the mark before its rotation walks the pen from one free end to the other.',
    project: { name: 'Notes app' },
    source: { repo: 'diver-notes', path: 'globals.css', public: false },
    theme: 'tokens',
    surface: 'standard',
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
    blurb: 'Dark density where the hierarchy is type and spacing, never a second colour.',
    project: { name: 'Scouting dashboard' },
    source: { repo: 'yourscout', path: 'DESIGN.md', public: false },
    theme: 'watchful',
    surface: 'tall',
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
    blurb: 'Parchment, white, dark. The surface change is the divider, so nothing else has to be.',
    project: { name: 'Tactics Journal' },
    source: { repo: 'tacticsjournal', path: 'DESIGN.md', public: false },
    theme: 'editorial',
    surface: 'tall',
    scope: 'pattern',
    tags: ['layout', 'surfaces', 'editorial'],
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
  const root = document.documentElement;

  root.classList.add('js');

  /* Durations come from the stylesheet so JS and CSS never drift apart. */
  const ms = (name, fallback) => {
    const raw = getComputedStyle(document.body).getPropertyValue(name).trim();
    const n = parseFloat(raw);
    if (!raw || Number.isNaN(n)) return fallback;
    return raw.endsWith('ms') ? n : n * 1000;
  };

  const setStatus = (section, text) => {
    const el = section && section.querySelector('[data-status]');
    if (el) el.textContent = text;
  };

  const codeOf = (section) => {
    const pre = section && section.querySelector('.spec-src code');
    return pre ? pre.textContent.replace(/\s+$/, '') : '';
  };

  async function copyText(text) {
    if (!navigator.clipboard) throw new Error('unavailable');
    await navigator.clipboard.writeText(text);
  }

  /* Copy: the icon swaps to a check for a beat; the live region carries the
     same news for anyone who can't see the swap. */
  const flashCopied = (btn) => {
    btn.setAttribute('data-copied', '');
    window.setTimeout(() => btn.removeAttribute('data-copied'), ms('--duration-very-slow', 500) * 3);
  };

  for (const btn of document.querySelectorAll('.surface-actions [data-copy]')) {
    const section = btn.closest('section[id]');
    if (!section || !codeOf(section)) continue;
    btn.addEventListener('click', async () => {
      try {
        await copyText(codeOf(section));
        flashCopied(btn);
        setStatus(section, 'Code copied to the clipboard.');
      } catch {
        setStatus(section, 'Copy was blocked. Open the code and copy it manually.');
      }
    });
  }

  /* ---- code dialog ---- */
  const dialog = document.getElementById('code-dialog');
  if (dialog) {
    const title = dialog.querySelector('#code-dialog-t');
    const path = dialog.querySelector('[data-dialog-path]');
    const body = dialog.querySelector('[data-dialog-code]');
    const live = dialog.querySelector('[data-dialog-status]');
    const copyBtn = dialog.querySelector('[data-dialog-copy]');
    const closeBtn = dialog.querySelector('[data-dialog-close]');
    let opener = null;

    const close = () => {
      if (!dialog.open) return;
      if (reduced.matches) {
        dialog.close();
        return;
      }
      dialog.classList.add('is-closing');
      window.setTimeout(() => {
        dialog.classList.remove('is-closing');
        dialog.close();
      }, ms('--duration-quick', 150));
    };

    dialog.addEventListener('close', () => {
      dialog.classList.remove('is-closing');
      if (live) live.textContent = '';
      if (opener && document.contains(opener)) opener.focus();
      opener = null;
    });
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      close();
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) close();
    });
    if (closeBtn) closeBtn.addEventListener('click', close);

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await copyText(body.textContent.replace(/\s+$/, ''));
          flashCopied(copyBtn);
          if (live) live.textContent = 'Code copied to the clipboard.';
        } catch {
          if (live) live.textContent = 'Copy was blocked. Select the code and copy it manually.';
        }
      });
    }

    for (const btn of document.querySelectorAll('[data-code]')) {
      const section = btn.closest('section[id]');
      const entry = section && byId.get(section.id);
      if (!section || !entry) continue;
      btn.addEventListener('click', () => {
        opener = btn;
        title.textContent = entry.name;
        path.textContent = `${entry.project.name} / ${entry.source.path}`;
        body.textContent = codeOf(section);
        dialog.showModal();
        if (closeBtn) closeBtn.focus();
      });
    }
  }

  /* ---- variant tabs: the pill slides between options ---- */
  for (const group of document.querySelectorAll('[data-variants]')) {
    const buttons = [...group.querySelectorAll('button')];
    const pill = group.querySelector('.variants-pill');
    const target = document.getElementById(group.dataset.variants);
    if (!target || !buttons.length) continue;

    const movePill = (btn, animate) => {
      if (!pill) return;
      if (!animate) pill.style.transition = 'none';
      pill.style.width = `${btn.offsetWidth}px`;
      pill.style.transform = `translateX(${btn.offsetLeft - 2}px)`;
      if (!animate) {
        void pill.offsetWidth;
        pill.style.transition = '';
      }
    };

    const select = (btn, animate = true) => {
      for (const b of buttons) b.setAttribute('aria-checked', String(b === btn));
      target.dataset.variant = btn.dataset.variant;
      movePill(btn, animate);
      target.dispatchEvent(new CustomEvent('variantchange', { detail: btn.dataset.variant }));
    };

    const current = () => buttons.find((b) => b.getAttribute('aria-checked') === 'true') || buttons[0];

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

    /* First paint and every resize write the pill's position without a
       transition, so it never animates in from zero width. */
    movePill(current(), false);
    window.addEventListener('resize', () => movePill(current(), false));
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => movePill(current(), false));
    }
  }

  /* ---- replay ---- */
  for (const btn of document.querySelectorAll('[data-replay]')) {
    const stage = document.getElementById(btn.dataset.replay);
    if (!stage) continue;
    btn.addEventListener('click', () => {
      const section = btn.closest('section[id]');
      if (reduced.matches) {
        stage.classList.remove('is-playing');
        stage.classList.add('is-done');
        setStatus(section, 'Reduced motion: end state shown immediately.');
        return;
      }
      stage.classList.remove('is-playing', 'is-done');
      void stage.offsetWidth;
      stage.classList.add('is-playing');
      setStatus(section, 'Replayed.');
      window.setTimeout(
        () => stage.classList.remove('is-playing'),
        ms('--duration-very-slow', 500) * 3
      );
    });
  }

  /* ---- the one-purpose tool's state machine ---- */
  const tool = document.querySelector('[data-tool]');
  if (tool) {
    const field = tool.querySelector('[data-tool-field]');
    const hint = tool.querySelector('[data-tool-hint]');
    const go = tool.querySelector('[data-tool-go]');
    const goLabel = tool.querySelector('[data-tool-go-label]');
    const clear = tool.querySelector('[data-tool-clear]');
    const section = tool.closest('section[id]');
    const stage = document.getElementById('one-purpose-tool-stage');
    const SAMPLE = 'The second half was the same shape as the first, played faster.';

    const swap = (el, text) => {
      if (el.textContent === text) return;
      el.classList.remove('is-swapping');
      void el.offsetWidth;
      el.textContent = text;
      if (!reduced.matches) el.classList.add('is-swapping');
    };

    let state = 'empty';
    const render = () => {
      const has = field.value.trim().length > 0;
      tool.dataset.state = state;
      go.disabled = !has;
      clear.disabled = !has;
      if (state === 'copied') {
        swap(goLabel, 'Copied');
        swap(hint, `${field.value.trim().length} characters on the clipboard.`);
      } else if (state === 'cleared') {
        swap(goLabel, 'Copy plain text');
        swap(hint, 'Cleared.');
      } else if (has) {
        swap(goLabel, 'Copy plain text');
        swap(hint, `${field.value.trim().length} characters ready.`);
      } else {
        swap(goLabel, 'Copy plain text');
        swap(hint, 'One job, stated once.');
      }
    };

    field.addEventListener('input', () => {
      state = field.value.trim() ? 'filled' : 'empty';
      render();
    });

    tool.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!field.value.trim()) return;
      try {
        await copyText(field.value);
        state = 'copied';
        render();
        setStatus(section, 'Copied the field to the clipboard.');
      } catch {
        setStatus(section, 'Copy was blocked. Select the text and copy it manually.');
      }
      window.setTimeout(() => {
        if (state !== 'copied') return;
        state = field.value.trim() ? 'filled' : 'empty';
        render();
      }, ms('--duration-very-slow', 500) * 4);
    });

    clear.addEventListener('click', () => {
      if (!field.value) return;
      const finish = () => {
        tool.classList.remove('is-clearing');
        field.value = '';
        state = 'cleared';
        render();
        setStatus(section, 'Field cleared.');
        window.setTimeout(() => {
          if (state !== 'cleared') return;
          state = 'empty';
          render();
        }, ms('--duration-very-slow', 500) * 3);
      };
      if (reduced.matches) {
        finish();
        return;
      }
      tool.classList.add('is-clearing');
      window.setTimeout(finish, ms('--duration-slow', 400));
    });

    /* The variant tabs are the same state machine, driven from outside. */
    if (stage) {
      stage.addEventListener('variantchange', (e) => {
        field.value = e.detail === 'filled' ? SAMPLE : '';
        state = e.detail === 'filled' ? 'filled' : 'empty';
        render();
      });
    }

    render();
  }

  /* ---- rail highlight + section reveal + ambient loops ---- */
  const links = [...document.querySelectorAll('.rail a[href^="#"]')];
  const sections = [...byId.keys()]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          for (const a of links) {
            a.setAttribute('aria-current', a.hash === `#${entry.target.id}` ? 'true' : 'false');
          }
        }
      },
      { rootMargin: '-15% 0px -70% 0px' }
    );
    for (const el of sections) current.observe(el);

    /* Reveal is an enhancement: sections are visible, then JS opts them into
       the transition and a fallback timer un-hides them no matter what. */
    if (!reduced.matches) {
      for (const el of sections) el.classList.add('reveal');
      const revealAll = () => {
        for (const el of sections) el.classList.add('is-revealed');
      };
      const revealer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add('is-revealed');
            revealer.unobserve(entry.target);
          }
        },
        { rootMargin: '0px 0px -8% 0px' }
      );
      for (const el of sections) revealer.observe(el);
      window.setTimeout(revealAll, ms('--duration-very-slow', 500) * 4);
      window.addEventListener('beforeprint', revealAll);
    }

    /* Ambient loops run only for the two specimens whose subject is timing,
       only while they are on screen, and never under reduced motion. */
    if (!reduced.matches) {
      const ambient = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            entry.target.classList.toggle('is-ambient', entry.isIntersecting);
          }
        },
        { threshold: 0.55 }
      );
      for (const id of ['blur-lift-stage', 'motion-tokens-stage']) {
        const el = document.getElementById(id);
        if (el) ambient.observe(el);
      }
    }
  }
}
