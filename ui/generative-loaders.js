/* Gallery controls for the static HTML adaptation of Generative Loaders. */
export const GENERATIVE_LOADERS = {
  text: ["decode", "typewriter", "skeleton", "cascade", "focus", "wipe", "flip", "redact", "line", "terminal", "wave", "dissolve", "slice", "tracking", "coalesce", "fragments"],
  inline: ["glyph", "matrix", "orbit", "ripple", "signal", "spark", "rotor", "pixel-drift", "chomp", "snake", "fold", "gravity", "domino", "aperture", "dot-pulse", "vortex", "halo", "count-up"],
  image: ["skeleton", "bands", "tiles", "scan", "pixel-grid", "resolution", "coalesce", "diffusion", "raster", "bloom", "focus", "shutter"]
};

if (typeof document !== 'undefined') {
  const gallery = document.querySelector('[data-generative-loaders]');
  if (gallery) {
    const status = gallery.closest('.spec')?.querySelector('[data-status]');
    const announce = (message) => { if (status) status.textContent = message; };
    const setSpeed = (speed) => {
      gallery.style.setProperty('--gl-text-duration', `${1.2 / speed}s`);
      for (const loader of gallery.querySelectorAll('.il-loader')) loader.style.setProperty('--il-duration', `${1.2 / speed}s`);
      for (const loader of gallery.querySelectorAll('.iml-loader')) loader.style.setProperty('--iml-duration', `${2.35 / speed}s`);
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
      announce(paused ? 'Loader animations paused.' : 'Loader animations playing.');
    });
    gallery.querySelector('[data-gl-restart]')?.addEventListener('click', () => {
      gallery.classList.add('is-restarting');
      void gallery.offsetWidth;
      gallery.classList.remove('is-restarting');
      announce('Loader animations restarted.');
    });
  }
}
