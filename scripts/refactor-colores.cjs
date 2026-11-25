const fs = require("node:fs");
const path = require("node:path");
const palette = [
  ["coral", "F0443A"], ["coral-texto", "C2362D"], ["navy", "0D1B2A"], ["sage", "A7C4A0"],
  ["fondo", "F7F8F6"], ["surface", "FFFFFF"], ["surface-alt", "F4F5F4"], ["ink", "18232D"],
  ["muted", "5B6670"], ["border", "D5D9DC"], ["border-field", "8A949C"],
  ["success", "0E6B47"], ["success-bg", "EAF6EF"], ["warning", "7A4E0A"], ["warning-bg", "FFF4DE"],
  ["danger", "A32828"], ["danger-bg", "FDECEC"], ["info", "1F5486"], ["info-bg", "EAF1F8"],
];
const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
function tokenFor(hex, text) {
  const forbidden = text ? new Set(["coral", "sage"]) : new Set();
  const target = rgb(hex);
  return palette.filter(([name]) => !forbidden.has(name)).map(([name, value]) => ({
    name,
    distance: rgb(value).reduce((sum, channel, i) => sum + (channel - target[i]) ** 2, 0),
  })).sort((a, b) => a.distance - b.distance)[0].name;
}
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(file);
    return /\.(tsx|css)$/.test(entry.name) && !entry.name.endsWith(".module.css.map") ? [file] : [];
  });
}
for (const file of [...walk("app"), ...walk("components")]) {
  let source = fs.readFileSync(file, "utf8");
  source = source.replace(/var\(--color-reference-([a-f\d]{6})\)/gi, (whole, hex, offset) => {
    const context = source.slice(Math.max(0, offset - 100), offset).split(/[;{}]/).pop();
    return `var(--color-${tokenFor(hex, /\bcolor\s*:|\btext-\[/i.test(context))})`;
  });
  source = source.replace(/#([a-f\d]{6})/gi, (whole, hex, offset) => {
    const context = source.slice(Math.max(0, offset - 100), offset).split(/[;{}]/).pop();
    const text = /\bcolor\s*:|\btext-\[/i.test(context);
    return `var(--color-${tokenFor(hex, text)})`;
  });
  source = source.replace(/var\(--color-(?:gris-claro|surface-hover)\)/g, "var(--color-surface-alt)")
    .replace(/var\(--color-muted-strong\)/g, "var(--color-muted)")
    .replace(/^\s*--color-(?:reference-[a-f\d]{6}|gris-claro|surface-hover|muted-strong)\s*:[^;]+;\s*$/gim, "");
  fs.writeFileSync(file, source);
}
console.log("Colores literales y referencias antiguas migrados a tokens semánticos.");
