/**
 * Wikipedia markup hard-codes background colours inline on countless tables and
 * cells (`style="background:#f9f9f9"`, `bgcolor="#eee"`, or a MediaWiki custom
 * property with a light fallback) while leaving the text colour to inherit.
 * Rendered inside a dark theme those elements end up as light text on a light
 * background.
 *
 * The server does not know which theme the client uses, so instead of rewriting
 * colours we only classify how bright the pinned background is. The frontend
 * turns that classification into a readable text colour (see the `.kp-bg-light`
 * / `.kp-bg-dark` rules in `frontend/src/css/app.scss`).
 */

export const LIGHT_BACKGROUND_CLASS = 'kp-bg-light';
export const DARK_BACKGROUND_CLASS = 'kp-bg-dark';

export type BackgroundTone = 'light' | 'dark';

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * A background this translucent lets the page background show through, so the
 * inherited text colour still works and we must not touch it.
 */
const MIN_OPAQUE_ALPHA = 0.5;

const NAMED_COLORS: Record<string, string> = {
  aliceblue: '#f0f8ff',
  antiquewhite: '#faebd7',
  aqua: '#00ffff',
  aquamarine: '#7fffd4',
  azure: '#f0ffff',
  beige: '#f5f5dc',
  bisque: '#ffe4c4',
  black: '#000000',
  blanchedalmond: '#ffebcd',
  blue: '#0000ff',
  blueviolet: '#8a2be2',
  brown: '#a52a2a',
  burlywood: '#deb887',
  cadetblue: '#5f9ea0',
  chartreuse: '#7fff00',
  chocolate: '#d2691e',
  coral: '#ff7f50',
  cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc',
  crimson: '#dc143c',
  cyan: '#00ffff',
  darkblue: '#00008b',
  darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9',
  darkgreen: '#006400',
  darkgrey: '#a9a9a9',
  darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b',
  darkolivegreen: '#556b2f',
  darkorange: '#ff8c00',
  darkorchid: '#9932cc',
  darkred: '#8b0000',
  darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f',
  darkturquoise: '#00ced1',
  darkviolet: '#9400d3',
  deeppink: '#ff1493',
  deepskyblue: '#00bfff',
  dimgray: '#696969',
  dimgrey: '#696969',
  dodgerblue: '#1e90ff',
  firebrick: '#b22222',
  floralwhite: '#fffaf0',
  forestgreen: '#228b22',
  fuchsia: '#ff00ff',
  gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff',
  gold: '#ffd700',
  goldenrod: '#daa520',
  gray: '#808080',
  green: '#008000',
  greenyellow: '#adff2f',
  grey: '#808080',
  honeydew: '#f0fff0',
  hotpink: '#ff69b4',
  indianred: '#cd5c5c',
  indigo: '#4b0082',
  ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  lavenderblush: '#fff0f5',
  lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd',
  lightblue: '#add8e6',
  lightcoral: '#f08080',
  lightcyan: '#e0ffff',
  lightgoldenrodyellow: '#fafad2',
  lightgray: '#d3d3d3',
  lightgreen: '#90ee90',
  lightgrey: '#d3d3d3',
  lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a',
  lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa',
  lightslategray: '#778899',
  lightslategrey: '#778899',
  lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0',
  lime: '#00ff00',
  limegreen: '#32cd32',
  linen: '#faf0e6',
  magenta: '#ff00ff',
  maroon: '#800000',
  mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd',
  mediumorchid: '#ba55d3',
  mediumpurple: '#9370db',
  mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585',
  midnightblue: '#191970',
  mintcream: '#f5fffa',
  mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5',
  navajowhite: '#ffdead',
  navy: '#000080',
  oldlace: '#fdf5e6',
  olive: '#808000',
  olivedrab: '#6b8e23',
  orange: '#ffa500',
  orangered: '#ff4500',
  orchid: '#da70d6',
  palegoldenrod: '#eee8aa',
  palegreen: '#98fb98',
  paleturquoise: '#afeeee',
  palevioletred: '#db7093',
  papayawhip: '#ffefd5',
  peachpuff: '#ffdab9',
  peru: '#cd853f',
  pink: '#ffc0cb',
  plum: '#dda0dd',
  powderblue: '#b0e0e6',
  purple: '#800080',
  rebeccapurple: '#663399',
  red: '#ff0000',
  rosybrown: '#bc8f8f',
  royalblue: '#4169e1',
  saddlebrown: '#8b4513',
  salmon: '#fa8072',
  sandybrown: '#f4a460',
  seagreen: '#2e8b57',
  seashell: '#fff5ee',
  sienna: '#a0522d',
  silver: '#c0c0c0',
  skyblue: '#87ceeb',
  slateblue: '#6a5acd',
  slategray: '#708090',
  slategrey: '#708090',
  snow: '#fffafa',
  springgreen: '#00ff7f',
  steelblue: '#4682b4',
  tan: '#d2b48c',
  teal: '#008080',
  thistle: '#d8bfd8',
  tomato: '#ff6347',
  turquoise: '#40e0d0',
  violet: '#ee82ee',
  wheat: '#f5deb3',
  white: '#ffffff',
  whitesmoke: '#f5f5f5',
  yellow: '#ffff00',
  yellowgreen: '#9acd32',
};

/** Split on a single-character separator, ignoring separators inside parentheses. */
function splitTopLevel(value: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of value) {
    if (char === '(') depth++;
    else if (char === ')') depth = Math.max(0, depth - 1);
    if (char === separator && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
}

/** Split a property value into its whitespace-separated top-level tokens. */
function splitValueTokens(value: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of value) {
    if (char === '(') depth++;
    else if (char === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && /\s/.test(char)) {
      if (current) tokens.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}

function findClosingParen(value: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < value.length; i++) {
    if (value[i] === '(') depth++;
    else if (value[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Replace `var(--name, fallback)` with its fallback. MediaWiki templates use
 * this pattern for theme-aware colours, and the fallback is the light-theme
 * value the browser will actually apply here. A `var()` without a fallback is
 * unresolvable, so the whole value is treated as unknown.
 */
function resolveVarFallbacks(value: string): string | null {
  let result = value;
  for (let guard = 0; guard < 8 && /var\(/i.test(result); guard++) {
    const start = result.search(/var\(/i);
    const end = findClosingParen(result, start + 3);
    if (end === -1) return null;
    const args = result.slice(start + 4, end);
    const [, ...fallbackParts] = splitTopLevel(args, ',');
    if (fallbackParts.length === 0) return null;
    result =
      result.slice(0, start) +
      fallbackParts.join(',').trim() +
      result.slice(end + 1);
  }
  return /var\(/i.test(result) ? null : result;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseChannel(token: string): number | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith('%')) {
    const percent = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isFinite(percent) ? clamp(percent, 0, 100) * 2.55 : null;
  }
  const numeric = Number.parseFloat(trimmed);
  return Number.isFinite(numeric) ? clamp(numeric, 0, 255) : null;
}

function parseAlpha(token: string | undefined): number {
  if (token === undefined) return 1;
  const trimmed = token.trim();
  if (!trimmed) return 1;
  if (trimmed.endsWith('%')) {
    const percent = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isFinite(percent) ? clamp(percent / 100, 0, 1) : 1;
  }
  const numeric = Number.parseFloat(trimmed);
  return Number.isFinite(numeric) ? clamp(numeric, 0, 1) : 1;
}

function parseHex(token: string): Rgba | null {
  const hex = token.slice(1);
  if (!/^[0-9a-f]+$/i.test(hex)) return null;
  const expand = (part: string) => Number.parseInt(part.repeat(2), 16);
  if (hex.length === 3 || hex.length === 4) {
    return {
      r: expand(hex[0]),
      g: expand(hex[1]),
      b: expand(hex[2]),
      a: hex.length === 4 ? expand(hex[3]) / 255 : 1,
    };
  }
  if (hex.length === 6 || hex.length === 8) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
      a: hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1,
    };
  }
  return null;
}

/** Split `rgb()`/`hsl()` arguments written either comma- or space-separated. */
function parseFunctionArgs(args: string): string[] {
  const [main, alpha] = splitTopLevel(args, '/');
  const parts = args.includes(',')
    ? splitTopLevel(args, ',')
    : splitValueTokens(main ?? '');
  if (alpha !== undefined) parts.push(alpha);
  return parts.map((part) => part.trim());
}

function parseRgb(args: string): Rgba | null {
  const parts = parseFunctionArgs(args);
  if (parts.length < 3) return null;
  const r = parseChannel(parts[0]);
  const g = parseChannel(parts[1]);
  const b = parseChannel(parts[2]);
  if (r === null || g === null || b === null) return null;
  return { r, g, b, a: parseAlpha(parts[3]) };
}

function parseHsl(args: string): Rgba | null {
  const parts = parseFunctionArgs(args);
  if (parts.length < 3) return null;
  const hue = Number.parseFloat(parts[0].replace(/deg$/i, ''));
  const saturation = Number.parseFloat(parts[1]) / 100;
  const lightness = Number.parseFloat(parts[2]) / 100;
  if (![hue, saturation, lightness].every(Number.isFinite)) return null;

  const chroma = (1 - Math.abs(2 * lightness - 1)) * clamp(saturation, 0, 1);
  const sector = (((hue % 360) + 360) % 360) / 60;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));
  const base = clamp(lightness, 0, 1) - chroma / 2;
  const candidates: Array<[number, number, number]> = [
    [chroma, second, 0],
    [second, chroma, 0],
    [0, chroma, second],
    [0, second, chroma],
    [second, 0, chroma],
    [chroma, 0, second],
  ];
  const [r, g, b] = candidates[Math.floor(sector) % 6];
  return {
    r: (r + base) * 255,
    g: (g + base) * 255,
    b: (b + base) * 255,
    a: parseAlpha(parts[3]),
  };
}

function parseColor(token: string): Rgba | null {
  const value = token.trim().toLowerCase();
  if (!value) return null;
  if (value === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  const named = NAMED_COLORS[value];
  if (named) return parseHex(named);

  if (value.startsWith('#')) return parseHex(value);

  const functional = value.match(/^(rgba?|hsla?)\((.*)\)$/);
  if (!functional) return null;
  const args = functional[2] ?? '';
  return functional[1].startsWith('rgb') ? parseRgb(args) : parseHsl(args);
}

/** WCAG relative luminance. */
function relativeLuminance({ r, g, b }: Rgba): number {
  const channel = (value: number) => {
    const srgb = clamp(value, 0, 255) / 255;
    return srgb <= 0.03928
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Pick the tone of the text this background needs: `light` means the background
 * is bright and wants dark text, `dark` means the opposite. Returns `null` when
 * the value is not an opaque colour we can reason about (gradients, images,
 * unresolvable custom properties, translucent fills).
 */
export function classifyBackgroundValue(value: string): BackgroundTone | null {
  const resolved = resolveVarFallbacks(value.trim());
  if (!resolved) return null;

  for (const token of splitValueTokens(resolved)) {
    const color = parseColor(token);
    if (!color) continue;
    if (color.a < MIN_OPAQUE_ALPHA) return null;
    return relativeLuminance(color) > 0.179 ? 'light' : 'dark';
  }
  return null;
}

interface Declaration {
  property: string;
  value: string;
}

function parseDeclarations(style: string): Declaration[] {
  return splitTopLevel(style, ';').flatMap((declaration) => {
    const separator = declaration.indexOf(':');
    if (separator === -1) return [];
    return [
      {
        property: declaration.slice(0, separator).trim().toLowerCase(),
        value: declaration.slice(separator + 1).trim(),
      },
    ];
  });
}

/** The winning `background` / `background-color` value of an inline style. */
export function findBackgroundValue(style: string): string | undefined {
  return parseDeclarations(style)
    .filter(
      ({ property }) =>
        property === 'background' || property === 'background-color',
    )
    .pop()?.value;
}

/**
 * Whether the inline style already pins a text colour. `color: inherit` does
 * not count: Wikipedia uses it to opt out of MediaWiki's own rules, and it is
 * exactly what makes these elements adopt the app's light-on-dark text.
 */
export function hasExplicitTextColor(style: string): boolean {
  return parseDeclarations(style).some(
    ({ property, value }) =>
      property === 'color' &&
      !['inherit', 'unset', 'initial', 'currentcolor', ''].includes(
        value.toLowerCase(),
      ),
  );
}
