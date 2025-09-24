// update-api-urls.js
const fs = require("fs");
const path = require("path");

const NEW_BASE = process.argv[2];
if (!NEW_BASE) {
  console.error("Uso: node update-api-urls.js https://sua-api");
  process.exit(1);
}
const DIST = path.join(process.cwd(), "dist");

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p);
    else if (/\.(html|js|css|json)$/i.test(name)) {
      let content = fs.readFileSync(p, "utf8");
      const before = content;
      content = content
        .replace(/http:\/\/localhost:3333/gi, NEW_BASE)
        .replace(/https?:\/\/127\.0\.0\.1:3333/gi, NEW_BASE);
      if (content !== before) {
        fs.writeFileSync(p, content);
        console.log("Atualizado:", p);
      }
    }
  }
}
if (!fs.existsSync(DIST)) {
  console.error("Pasta dist/ não encontrada. Rode `npm run build` antes.");
  process.exit(1);
}
walk(DIST);
console.log("✅ URLs atualizadas para:", NEW_BASE);
