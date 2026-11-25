const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

const files = execFileSync("rg", ["-l", "var\\(--font-inter\\)", "app", "components"], { encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, source.replaceAll("var(--font-inter)", "var(--font-poppins)"));
}

console.log(`Actualizados ${files.length} archivos para usar Poppins.`);
