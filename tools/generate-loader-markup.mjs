/*
 * Regenerates the static Generative Loaders gallery in ui/index.html.
 *
 * The loaders themselves are MIT-licensed work by Kasturi Khanke and
 * Generative Loaders contributors (c) 2026; this script ports their React DOM
 * (packages/generative-loaders/src/components.tsx) to static markup so the
 * no-framework /ui page renders the same elements the upstream CSS targets.
 * Full license: /ui/GENERATIVE_LOADERS_LICENSE.md
 *
 * Run: node tools/generate-loader-markup.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  scrambleGlyphs, particleOffsets, dissolveParticles, fragmentOffsets,
  matrixDots, vortexDots, imageTiles, resolutionCells, coalesceParticles, diffusionParticles,
} from './loader-geometry.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SAMPLE_TEXT = 'Thinking through the details.';

const TITLES = {
  text: { decode: 'Decode', typewriter: 'Typewriter', skeleton: 'Skeleton', cascade: 'Cascade', focus: 'Focus', wipe: 'Wipe', flip: 'Flip', redact: 'Redact', line: 'Line by line', terminal: 'Terminal', wave: 'Wave', dissolve: 'Dissolve', slice: 'Slice', tracking: 'Tracking', coalesce: 'Coalesce', fragments: 'Fragments' },
  inline: { glyph: 'Glyph', matrix: 'Matrix', orbit: 'Orbit', ripple: 'Ripple', signal: 'Signal', spark: 'Spark', rotor: 'Rotor', 'pixel-drift': 'Pixel drift', chomp: 'Chomp', snake: 'Snake', fold: 'Fold', gravity: 'Gravity', domino: 'Domino', aperture: 'Aperture', 'dot-pulse': 'Dot pulse', vortex: 'Vortex', halo: 'Halo', 'count-up': 'Count up' },
  image: { skeleton: 'Skeleton', bands: 'Bands', tiles: 'Tiles', scan: 'Scan', 'pixel-grid': 'Pixel grid', resolution: 'Resolution', coalesce: 'Coalesce', diffusion: 'Diffusion', raster: 'Raster', bloom: 'Bloom', focus: 'Focus', shutter: 'Shutter' },
};

const pad = (n) => String(n + 1).padStart(2, '0');
const esc = (char) => char === '&' ? '&amp;' : char === '<' ? '&lt;' : char === '>' ? '&gt;' : char;
const glyph = (char) => char === ' ' ? '&nbsp;' : esc(char);

/* --- text loaders: upstream charNodes() word/space grouping --- */

function charNodes(text, render) {
  let offset = 0;
  return text.split(/(\s+)/).filter(Boolean).map((token) => {
    const start = offset;
    offset += Array.from(token).length;
    if (/^\s+$/.test(token)) {
      return `<span class="tl-space">${Array.from(token).map((_, i) => render(' ', start + i)).join('')}</span>`;
    }
    return `<span class="tl-word">${Array.from(token).map((char, i) => render(char, start + i)).join('')}</span>`;
  }).join('');
}

/* Every reveal is driven by the shared CSS loop keyed on --gl-i, standing in
   for the per-character framer-motion transitions upstream runs on a stream. */
const plainChar = (char, index) =>
  `<span class="tl-char gl-text-char" style="--gl-i:${index}">${glyph(char)}</span>`;

const decodeChar = (char, index) => char === ' '
  ? `<span class="tl-decode-char" style="--gl-i:${index}"><b>${glyph(char)}</b></span>`
  : `<span class="tl-decode-char" style="--gl-i:${index}"><b>${glyph(char)}</b><i>${esc(scrambleGlyphs[index % scrambleGlyphs.length])}</i></span>`;

const dissolveChar = (char, index) => {
  const particles = char === ' ' ? '' : dissolveParticles
    .map(([x, y], p) => `<i aria-hidden="true" style="--gl-px:${x}px;--gl-py:${y}px;--gl-p:${p}"></i>`)
    .join('');
  return `<span class="tl-dissolve-char" style="--gl-i:${index}"><b>${glyph(char)}</b>${particles}</span>`;
};

const coalesceChar = (char, index) => {
  const particles = char === ' ' ? '' : particleOffsets.slice(0, 3)
    .map(([x, y], p) => `<i aria-hidden="true" style="--gl-px:${x * .55}px;--gl-py:${y * .55}px;--gl-p:${p}"></i>`)
    .join('');
  return `<span class="tl-coalesce-char" style="--gl-i:${index}"><b>${glyph(char)}</b>${particles}</span>`;
};

const sliceChar = (char, index) =>
  `<span class="tl-slice-char" style="--gl-i:${index}">${[0, 1, 2]
    .map((part) => `<i class="tl-slice-part tl-slice-part-${part + 1}">${glyph(char)}</i>`).join('')}</span>`;

const fragmentChar = (char, index) =>
  `<span class="tl-fragment-char" style="--gl-i:${index}">${fragmentOffsets
    .map(([x, y], f) => `<i class="tl-fragment tl-fragment-${f + 1}" style="--gl-px:${x}px;--gl-py:${y}px">${glyph(char)}</i>`).join('')}</span>`;

function textVisual(variant, text) {
  if (variant === 'skeleton') return `<span class="tl-copy tl-skeleton-wrap"><span class="tl-skeleton"><i></i><i></i></span></span>`;
  if (variant === 'decode') return `<span class="tl-copy tl-decode">${charNodes(text, decodeChar)}</span>`;
  if (variant === 'dissolve') return `<span class="tl-copy tl-dissolve">${charNodes(text, dissolveChar)}</span>`;
  if (variant === 'coalesce') return `<span class="tl-copy tl-coalesce">${charNodes(text, coalesceChar)}</span>`;
  if (variant === 'slice') return `<span class="tl-copy tl-slice">${charNodes(text, sliceChar)}</span>`;
  if (variant === 'fragments') return `<span class="tl-copy tl-fragments">${charNodes(text, fragmentChar)}</span>`;
  if (variant === 'typewriter') return `<span class="tl-copy tl-typewriter">${charNodes(text, plainChar)}<i class="tl-cursor"></i></span>`;
  if (variant === 'terminal') return `<span class="tl-copy tl-terminal"><b aria-hidden="true">&rsaquo;</b><span>${charNodes(text, plainChar)}</span><i class="tl-terminal-cursor"></i></span>`;
  if (variant === 'redact') return `<span class="tl-copy tl-redact">${text.split(/(\s+)/).filter(Boolean).map((token, i, all) => {
    if (/^\s+$/.test(token)) return `<span class="tl-space">&nbsp;</span>`;
    const start = all.slice(0, i).reduce((n, t) => n + Array.from(t).length, 0);
    return `<span class="tl-redact-word" style="--gl-i:${start}"><span>${Array.from(token).map(esc).join('')}</span><i></i></span>`;
  }).join('')}</span>`;
  return `<span class="tl-copy tl-${variant}">${charNodes(text, plainChar)}</span>`;
}

/* --- inline loaders --- */

function inlineVisual(variant) {
  const i = (n, style) => Array.from({ length: n }, (_, index) => `<i${style ? ` style="${style(index)}"` : ''}></i>`).join('');
  if (variant === 'glyph') return `<span class="il-glyph">${i(9, (n) => `--il-i:${n};--il-delay:${n * -.11}s`)}</span>`;
  if (variant === 'matrix') return `<span class="il-matrix">${matrixDots.map(({ index, distance }) => `<i style="--il-i:${index};--il-distance:${distance};--il-delay:${distance * -.13 - index * .008}s"></i>`).join('')}</span>`;
  if (variant === 'orbit') return `<span class="il-orbit"><i></i><i></i><i></i><b></b></span>`;
  if (variant === 'ripple') return `<span class="il-ripple"><i></i><i></i><i></i><b></b></span>`;
  if (variant === 'signal') return `<span class="il-signal">${i(5, (n) => `--il-i:${n};--il-delay:${n * -.12}s`)}</span>`;
  if (variant === 'spark') return `<span class="il-spark"><i></i><i></i><i></i></span>`;
  if (variant === 'rotor') return `<span class="il-rotor"><svg aria-hidden="true" viewBox="0 0 100 100"><path class="il-rotor-spokes" d="M50 56 L50 22 M50 56 L79.45 73 M50 56 L20.55 73"></path><circle class="il-rotor-ring il-rotor-ring-top" cx="50" cy="18" r="13"></circle><circle class="il-rotor-ring il-rotor-ring-right" cx="82.91" cy="75" r="13"></circle><circle class="il-rotor-ring il-rotor-ring-left" cx="17.09" cy="75" r="13"></circle><circle class="il-rotor-hub-glow" cx="50" cy="56" r="12"></circle><circle class="il-rotor-hub" cx="50" cy="56" r="8.5"></circle></svg></span>`;
  if (variant === 'pixel-drift') return `<span class="il-pixel-drift">${i(16, (n) => `--il-i:${n};--il-delay:${((n % 4) + Math.floor(n / 4)) * -.1}s`)}</span>`;
  if (variant === 'chomp') return `<span class="il-chomp"><b></b>${i(4, (n) => `--il-delay:${n * -.24}s`)}</span>`;
  if (variant === 'snake') return `<span class="il-snake">${i(7, (n) => `--il-i:${n};--il-scale:${1 - n * .075}`)}<b></b></span>`;
  if (variant === 'fold') return `<span class="il-fold">${i(4, (n) => `--il-delay:${n * -.18}s`)}</span>`;
  if (variant === 'gravity') return `<span class="il-gravity">${i(5, (n) => `--il-angle:${n * 72}deg;--il-delay:${n * -.19}s`)}<b></b></span>`;
  if (variant === 'domino') return `<span class="il-domino">${i(4, (n) => `--il-delay:calc(var(--il-duration) * ${(3 - n) * -.115})`)}</span>`;
  if (variant === 'aperture') return `<span class="il-aperture">${i(6, (n) => `--il-angle:${n * 60}deg;--il-delay:${n * -.08}s`)}<b></b></span>`;
  if (variant === 'dot-pulse') return `<span class="il-dot-pulse">${i(4, (n) => `--il-i:${3 - n}`)}</span>`;
  if (variant === 'vortex') return `<span class="il-vortex">${vortexDots.map((d) => `<i style="--il-x:${d.x}%;--il-y:${d.y}%;--il-delay:${d.delay}s;--il-scale:${d.scale}"></i>`).join('')}<b></b></span>`;
  if (variant === 'halo') return `<span class="il-halo">${i(8, (n) => `--il-angle:${n * 45}deg;--il-i:${n}`)}</span>`;
  /* count-up ticks 0 to 100 in generative-loaders.js; 0 is the no-JS resting frame. */
  return `<span class="il-count-up" data-gl-count-up data-value="0">0</span>`;
}

/* --- image loaders --- */

function imageVisual(variant) {
  if (variant === 'skeleton') return `<span class="iml-skeleton"><i></i><b></b></span>`;
  if (variant === 'bands') return `<span class="iml-bands"><i></i><i></i><i></i><b></b></span>`;
  if (variant === 'tiles') return `<span class="iml-tiles">${imageTiles.map(({ index, x, y }) => `<i style="--iml-i:${index};--iml-delay:${(Math.abs(x - 1.5) + Math.abs(y - 1.5) - 4) * .12}s"></i>`).join('')}</span>`;
  if (variant === 'scan') return `<span class="iml-scan"><i></i><b></b><em></em></span>`;
  if (variant === 'pixel-grid') return `<span class="iml-pixel-grid">${imageTiles.map(({ x, y }) => `<i style="--iml-x:${x};--iml-y:${y};--iml-delay:${(x + y - 6) * .09}s"></i>`).join('')}</span>`;
  if (variant === 'resolution') return `<span class="iml-resolution">${resolutionCells.map(({ distance, tone }) => `<i style="--iml-delay:${(distance - 6) * .055}s;--iml-tone:${tone}%"></i>`).join('')}</span>`;
  if (variant === 'coalesce') return `<span class="iml-coalesce">${coalesceParticles.map((p) => `<i style="--iml-start-x:${p.startX}%;--iml-start-y:${p.startY}%;--iml-mid-x:${p.midX}%;--iml-mid-y:${p.midY}%;--iml-end-x:${p.endX}%;--iml-end-y:${p.endY}%;--iml-particle-size:${p.size}%;--iml-delay:calc(var(--iml-duration) * ${p.delay});--iml-particle-opacity:${p.opacity}"></i>`).join('')}<b></b></span>`;
  if (variant === 'diffusion') return `<span class="iml-diffusion">${diffusionParticles.map((p) => `<i style="--iml-x:${p.x}%;--iml-y:${p.y}%;--iml-dot-size:${p.size}%;--iml-delay:calc(var(--iml-duration) * ${p.delay})"></i>`).join('')}</span>`;
  if (variant === 'raster') return `<span class="iml-raster">${Array.from({ length: 8 }, (_, n) => `<i style="--iml-i:${n};--iml-delay:calc(var(--iml-duration) * ${n * -.035})"></i>`).join('')}</span>`;
  if (variant === 'bloom') return `<span class="iml-bloom"><i></i><b></b><em></em></span>`;
  if (variant === 'focus') return `<span class="iml-focus"><i></i><i></i><i></i><b></b></span>`;
  return `<span class="iml-shutter"><i></i><i></i><b></b><em></em></span>`;
}

/* --- cards ---
   Upstream marks the loader itself as the live region and hides the decorative
   visual from assistive tech; the static gallery keeps that split. */

function card(collection, variant, index) {
  const title = TITLES[collection][variant];
  const label = `${title} loading demonstration`;
  let loader;
  if (collection === 'text') {
    loader = `<span class="tl-loader gl-text-loader" data-variant="${variant}" role="status" aria-label="${label}"><span class="tl-visual" aria-hidden="true">${textVisual(variant, SAMPLE_TEXT)}</span></span>`;
  } else if (collection === 'inline') {
    loader = `<span class="il-loader" data-variant="${variant}" role="status" aria-label="${label}">${inlineVisual(variant)}</span>`;
  } else {
    loader = `<span class="iml-loader" data-variant="${variant}" role="status" aria-label="${label}"><span class="iml-visual" aria-hidden="true">${imageVisual(variant)}</span></span>`;
  }
  return `<article class="gl-card gl-card--${collection}" data-gl-loader="${collection}-${variant}">\n`
    + `  <span class="gl-card-n">${pad(index)}</span>\n`
    + `  <span class="gl-demo gl-demo--${collection}">${loader}</span>\n`
    + `  <h4>${title}</h4>\n`
    + `</article>`;
}

export function buildCollections(inventory) {
  const heads = { text: 'Text loaders', inline: 'Inline loaders', image: 'Image loaders' };
  return Object.entries(inventory).map(([collection, variants]) =>
    `          <section class="gl-collection" aria-labelledby="gl-${collection}-h">`
    + `<div class="gl-collection-head"><h3 id="gl-${collection}-h">${heads[collection]}</h3><span>${variants.length}</span></div>`
    + `<div class="gl-grid gl-grid--${collection}">`
    + variants.map((variant, index) => card(collection, variant, index)).join('\n')
    + `</div></section>`
  ).join('\n');
}

const START = '          <!-- gl:collections:start -->';
const END = '          <!-- gl:collections:end -->';

export function renderInto(html, block) {
  const from = html.indexOf(START);
  const to = html.indexOf(END);
  if (from < 0 || to < 0) throw new Error('gl:collections markers missing from ui/index.html');
  return html.slice(0, from) + START + '\n' + block + '\n' + html.slice(to);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { GENERATIVE_LOADERS } = await import(new URL('../ui/generative-loaders.js', import.meta.url));
  const file = join(root, 'ui/index.html');
  const html = readFileSync(file, 'utf8');
  writeFileSync(file, renderInto(html, buildCollections(GENERATIVE_LOADERS)));
  console.log('ui/index.html: regenerated 46 loader cards');
}
