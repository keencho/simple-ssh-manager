// Font detection helpers shared between the settings modal and (potentially)
// future Svelte components. Caches probe-span and per-font results so repeat
// calls are cheap.

export const GENERIC_FONT_FAMILIES = new Set([
  "monospace", "sans-serif", "serif", "ui-monospace", "ui-sans-serif",
  "ui-serif", "system-ui", "cursive", "fantasy", "SFMono-Regular",
]);

export function parseFontStack(value: string): string[] {
  return value.split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
}

const FONT_PROBE_STRING = "mmMwWLlIi00O0!@#$%^&*()_+{}[]|:;<>,.?/~`";
const FONT_PROBE_GENERICS = ["monospace", "sans-serif", "serif"];
let _fontProbeSpan: HTMLSpanElement | null = null;
const _fontProbeBaseline = new Map<string, number>();
const _fontInstallCache = new Map<string, boolean>();

function measureFontWidth(family: string): number {
  if (!_fontProbeSpan) {
    const s = document.createElement("span");
    s.style.cssText = "position:absolute;left:-9999px;top:-9999px;visibility:hidden;font-size:72px;white-space:nowrap;";
    s.textContent = FONT_PROBE_STRING;
    document.body.appendChild(s);
    _fontProbeSpan = s;
  }
  _fontProbeSpan.style.fontFamily = family;
  return _fontProbeSpan.getBoundingClientRect().width;
}

export function isFontInstalled(name: string): boolean {
  if (_fontInstallCache.has(name)) return _fontInstallCache.get(name)!;
  for (const g of FONT_PROBE_GENERICS) {
    if (!_fontProbeBaseline.has(g)) _fontProbeBaseline.set(g, measureFontWidth(g));
    const baseline = _fontProbeBaseline.get(g)!;
    const actual = measureFontWidth(`"${name}", ${g}`);
    if (Math.abs(actual - baseline) > 0.5) {
      _fontInstallCache.set(name, true);
      return true;
    }
  }
  _fontInstallCache.set(name, false);
  return false;
}

export function resolveActualFont(value: string): { primary: string; actual: string | null } {
  const names = parseFontStack(value);
  const specifics = names.filter(n => !GENERIC_FONT_FAMILIES.has(n));
  const primary = specifics[0] ?? names[0];
  for (const n of names) {
    if (GENERIC_FONT_FAMILIES.has(n)) continue;
    if (isFontInstalled(n)) return { primary, actual: n };
  }
  return { primary, actual: null };
}
