const fs = require("node:fs");
const path = require("node:path");
function archivos(directorio) {
  return fs.readdirSync(directorio, { withFileTypes: true }).flatMap((e) => {
    const file = path.join(directorio, e.name);
    if (e.isDirectory()) return archivos(file);
    return /\.(tsx|css)$/.test(e.name) ? [file] : [];
  });
}
function minFont(value) {
  const n = Number(value.replace(/^\./, "0."));
  return n > 0 && n < 0.875 ? "var(--spc-text-small)" : value;
}
function mediaValue(kind, value) {
  const n = Number(value);
  const points = [640, 768, 1024, 1280];
  if (kind === "min") return points.reduce((best, point) => Math.abs(point - n) < Math.abs(best - n) ? point : best, points[0]);
  const limits = [639.98, 767.98, 1023.98, 1279.98];
  return limits.reduce((best, point) => Math.abs(point - n) < Math.abs(best - n) ? point : best, limits[0]);
}
for (const file of [...archivos("app"), ...archivos("components")]) {
  let s = fs.readFileSync(file, "utf8");
  s = s.replace(/\btext-xs\b/g, "text-sm")
    .replace(/text-\[([0-9.]+)(px|rem)\]/g, (whole, raw, unit) => {
      const n = Number(raw);
      return n < (unit === "px" ? 14 : 0.875) ? "text-sm" : whole;
    })
    .replace(/font-size\s*:\s*(\.?\d+(?:\.\d+)?)(rem|em|px)\b/g, (whole, raw, unit) => {
      const n = Number(raw.startsWith(".") ? `0${raw}` : raw);
      return n < (unit === "px" ? 14 : 0.875) ? "font-size:var(--spc-text-small)" : whole;
    })
    .replace(/clamp\(\s*(\.?\d+(?:\.\d+)?)rem\s*,/g, (whole, raw) => Number(raw.startsWith(".") ? `0${raw}` : raw) < 0.875 ? whole.replace(raw + "rem", "var(--spc-text-small)") : whole)
    .replace(/@media\s*\(min-width:\s*(\d+)px\)/g, (_, n) => `@media (min-width: ${mediaValue("min", n)}px)`)
    .replace(/@media\s*\(max-width:\s*(\d+)px\)/g, (_, n) => `@media (max-width: ${mediaValue("max", n)}px)`)
    .replace(/\bmin-h-screen\b|\bmin-h-\[[^\]]*(?:svh|vh)[^\]]*\]/g, "")
    .replace(/font-weight\s*:\s*(?:800|900)\b/g, "font-weight:700")
    .replace(/font-extrabold\b|font-black\b/g, "font-bold");
  s = s.replace(/(^|[;{])\s*min-height\s*:[^;}]*(?:svh|vh)[^;}]*(;?)/gi, "$1");
  fs.writeFileSync(file, s);
}
console.log("Escala mínima de texto, breakpoints y alturas de viewport normalizados.");
