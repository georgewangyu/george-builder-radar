#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const date = process.argv[2] || new Date().toISOString().slice(0, 10);
const [year, month] = date.split("-");
const outPath = join(root, "feeds", year, month, `${date}.md`);
const templatePath = join(root, "examples", "feed-template.md");

if (existsSync(outPath)) {
  console.error(`${outPath} already exists`);
  process.exit(1);
}

let template = await readFile(templatePath, "utf8");
template = template
  .replace("YYYY-MM-DD", date)
  .replace("Updated when George ran his morning routine.", `Updated when George ran his morning routine on ${date}.`);

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, template);
console.log(outPath);

