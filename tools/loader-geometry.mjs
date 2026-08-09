/*
 * Geometry ported verbatim from Generative Loaders by Kasturi Khanke and
 * Generative Loaders contributors (c) 2026, licensed under MIT.
 * Source: packages/generative-loaders/src/components.tsx
 * Full license: /ui/GENERATIVE_LOADERS_LICENSE.md
 *
 * These are the exact constants and formulas the upstream React components use
 * to place every particle, dot and cell. The static gallery is generated from
 * them so the markup cannot drift from the canonical loaders again.
 */

export const scrambleGlyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789()[]{}:;?/";
export const particleOffsets = [[-16, -9], [13, -13], [-9, 12], [17, 7], [1, -18]];
export const dissolveParticles = [[30, -11], [21, -6], [36, -1], [16, 4], [28, 9], [12, 13]];
export const fragmentOffsets = [[-8, -6], [8, -5], [-7, 7], [7, 6]];

/* --- inline loaders --- */

export const matrixDots = Array.from({ length: 25 }, (_, index) => {
  const x = index % 5;
  const y = Math.floor(index / 5);
  return { index, distance: Math.abs(x - 2) + Math.abs(y - 2) };
});

export const vortexDots = [8, 12, 16].flatMap((count, ring) => Array.from({ length: count }, (_, index) => ({
  id: `${ring}-${index}`,
  x: 50 + Math.sin((index * (360 / count) + ring * 11) * Math.PI / 180) * (18 + ring * 14),
  y: 50 - Math.cos((index * (360 / count) + ring * 11) * Math.PI / 180) * (18 + ring * 14),
  delay: -(ring * .12 + index / count),
  scale: 1 - ring * .12,
})));

/* --- image loaders --- */

export const imageTiles = Array.from({ length: 16 }, (_, index) => ({
  index,
  x: index % 4,
  y: Math.floor(index / 4),
}));

export const resolutionCells = Array.from({ length: 36 }, (_, index) => {
  const x = index % 6;
  const y = Math.floor(index / 6);
  return { index, distance: Math.abs(x - 2.5) + Math.abs(y - 2.5), tone: 28 + ((x * 13 + y * 9) % 34) };
});

export const coalesceParticles = Array.from({ length: 24 }, (_, index) => {
  const angle = index * 137.508 * Math.PI / 180;
  const radiusX = 42 + ((index * 7) % 8);
  const radiusY = 38 + ((index * 11) % 10);
  const startX = 50 + Math.cos(angle) * radiusX;
  const startY = 50 + Math.sin(angle) * radiusY;
  const bend = ((index % 5) - 2) * 1.8;
  return {
    index,
    startX,
    startY,
    midX: startX * .46 + 50 * .54 - Math.sin(angle) * bend,
    midY: startY * .46 + 50 * .54 + Math.cos(angle) * bend,
    endX: 50 + Math.cos(angle * 1.7) * (1.2 + index % 3 * .55),
    endY: 50 + Math.sin(angle * 1.7) * (1.2 + index % 3 * .55),
    size: 1.35 + ((index * 7) % 5) * .32,
    delay: -((index * 11) % 24) / 24,
    opacity: .42 + (index % 4) * .12,
  };
});

export const diffusionParticles = Array.from({ length: 28 }, (_, index) => ({
  index,
  x: 8 + ((index * 37) % 84),
  y: 8 + ((index * 53) % 84),
  size: 1.8 + ((index * 7) % 5) * .7,
  delay: -((index * 13) % 28) / 28,
}));

/* Upstream emits raw JS numbers into inline styles; matching that keeps the
   generated markup byte-comparable with a recomputation of the formulas. */
export const num = (value) => String(value);
