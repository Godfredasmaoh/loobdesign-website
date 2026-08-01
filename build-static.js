const fs = require("fs");
const path = require("path");

const root = __dirname;
const out = path.join(root, "dist");
const skip = new Set([
  "dist",
  "node_modules",
  ".git",
  "build-static.js",
  "package.json",
  "package-lock.json",
]);

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);

for (const name of fs.readdirSync(root)) {
  if (skip.has(name) || name.startsWith(".")) continue;
  fs.cpSync(path.join(root, name), path.join(out, name), { recursive: true });
}

console.log("Built static site into dist/");
