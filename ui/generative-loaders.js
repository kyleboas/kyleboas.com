/* Gallery controls for the static HTML adaptation of Generative Loaders. */
export const GENERATIVE_LOADERS = {
  text: ["decode", "typewriter", "skeleton", "cascade", "focus", "wipe", "flip", "redact", "line", "terminal", "wave", "dissolve", "slice", "tracking", "coalesce", "fragments"],
  inline: ["glyph", "matrix", "orbit", "ripple", "signal", "spark", "rotor", "pixel-drift", "chomp", "snake", "fold", "gravity", "domino", "aperture", "dot-pulse", "vortex", "halo", "count-up"],
  image: ["skeleton", "bands", "tiles", "scan", "pixel-grid", "resolution", "coalesce", "diffusion", "raster", "bloom", "focus", "shutter"]
};

/* Upstream's count-up loader is the one variant driven by a timer rather than
   CSS: it walks 0 to 100 at 45ms a step and rests 800ms at the top before
   wrapping. Same cadence here, so the static gallery counts instead of showing
   a frozen number. */
export function countUpDelay(value) {
  return value === 100 ? 800 : 45;
}

if (typeof document !== 'undefined') {
  const gallery = document.querySelector('[data-generative-loaders]');
  if (gallery) {
    const status = gallery.closest('.spec')?.querySelector('[data-status]');
    const announce = (message) => { if (status) status.textContent = message; };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let rate = 1;
    const counters = [...gallery.querySelectorAll('[data-gl-count-up]')];
    const timers = new Map();
    const tick = (node) => {
      window.clearTimeout(timers.get(node));
      if (reduced.matches || gallery.classList.contains('is-paused')) return;
      const value = Number(node.dataset.value) === 100 ? 0 : Number(node.dataset.value) + 1;
      timers.set(node, window.setTimeout(() => {
        node.dataset.value = String(value);
        node.textContent = String(value);
        tick(node);
      }, countUpDelay(Number(node.dataset.value)) / rate));
    };
    const runCounters = () => { for (const node of counters) tick(node); };
    const stopCounters = () => { for (const timer of timers.values()) window.clearTimeout(timer); };
    runCounters();
    reduced.addEventListener?.('change', () => { stopCounters(); runCounters(); });

    const setSpeed = (speed) => {
      rate = speed;
      gallery.style.setProperty('--gl-text-duration', `${1.2 / speed}s`);
      for (const loader of gallery.querySelectorAll('.il-loader')) loader.style.setProperty('--il-duration', `${1.2 / speed}s`);
      for (const loader of gallery.querySelectorAll('.iml-loader')) loader.style.setProperty('--iml-duration', `${2.35 / speed}s`);
      for (const loader of gallery.querySelectorAll('[data-speed]')) loader.dataset.speed = String(speed);
      for (const button of gallery.querySelectorAll('[data-gl-speed]')) button.setAttribute('aria-pressed', String(Number(button.dataset.glSpeed) === speed));
      announce(`Animation speed: ${speed}×.`);
    };
    for (const button of gallery.querySelectorAll('[data-gl-speed]')) {
      button.addEventListener('click', () => setSpeed(Number(button.dataset.glSpeed)));
    }
    const pause = gallery.querySelector('[data-gl-pause]');
    pause?.addEventListener('click', () => {
      const paused = gallery.classList.toggle('is-paused');
      pause.textContent = paused ? 'Play' : 'Pause';
      pause.setAttribute('aria-pressed', String(paused));
      for (const loader of gallery.querySelectorAll('[data-paused]')) loader.dataset.paused = String(paused);
      if (paused) stopCounters(); else runCounters();
      announce(paused ? 'Loader animations paused.' : 'Loader animations playing.');
    });
    gallery.querySelector('[data-gl-restart]')?.addEventListener('click', () => {
      gallery.classList.add('is-restarting');
      void gallery.offsetWidth;
      gallery.classList.remove('is-restarting');
      stopCounters();
      for (const node of counters) { node.dataset.value = '0'; node.textContent = '0'; }
      runCounters();
      announce('Loader animations restarted.');
    });
  }
}
