const fs = require("node:fs");
const file = "components/home/home.module.css";
const source = fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, " ");
let output = "";
let quote = null;
let escaped = false;
let depth = 0;
let pendingSpace = false;
for (let i = 0; i < source.length; i += 1) {
  const c = source[i];
  if (quote) {
    output += c;
    if (escaped) escaped = false;
    else if (c === "\\") escaped = true;
    else if (c === quote) quote = null;
    continue;
  }
  if (c === "'" || c === '"') { if (pendingSpace && output && !/[\s([{,:;]/.test(output.at(-1))) output += " "; pendingSpace = false; quote = c; output += c; continue; }
  if (/\s/.test(c)) { pendingSpace = true; continue; }
  if (c === "{") {
    output = output.trimEnd();
    if (pendingSpace && output && !/[\s([{,:;]/.test(output.at(-1))) output += " ";
    output += "{";
    depth += 1;
    pendingSpace = false;
    continue;
  }
  if (c === "}") {
    output = output.trimEnd() + "}";
    depth -= 1;
    if (depth === 0) output += "\n";
    else output += " ";
    pendingSpace = false;
    continue;
  }
  if (c === ";") { output = output.trimEnd() + ";"; output += depth ? " " : "\n"; pendingSpace = false; continue; }
  if (pendingSpace && output && !/[\s([{,:;]/.test(output.at(-1)) && !/[),}]/.test(c)) output += " ";
  pendingSpace = false;
  output += c;
}
output = output.replace(/[ \t]+\n/g, "\n").replace(/\n{2,}/g, "\n").trim() + "\n";
output = output.replace(/(^|[;{])\s*min-height\s*:[^;]*(?:vh|svh)[^;]*;/gi, "$1");
fs.writeFileSync(file, output);
console.log(`CSS home comprimido a ${output.split(/\r?\n/).length - 1} reglas/lineas.`);
