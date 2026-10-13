#!/usr/bin/env node

import { readdir, readFile } from "fs/promises";
import { join, resolve } from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "## Top Signals",
  "## X Builder Notes",
  "## GitHub / Repo Radar",
  "## Launch Radar",
  "## Official AI / Devtool Updates",
  "## Podcasts / Longform",
  "## Builder Takeaways",
  "## Source Receipts"
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    if (entry.isFile() && entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

let ok = true;
const requested = process.argv.slice(2);
const files = requested.length ? requested.map((file) => resolve(file)) : await walk(join(root, "feeds"));
const internalRubric = /attention_heat|builder_fit|single[ -]segment|drop-everything|specialist override|omission audit|default heat threshold|\b\d+(?:\.\d+)?\s+attention\s*\/\s*\d+(?:\.\d+)?\s+fit\b|neutral\s*50\s+prior|\b\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?[,;]\s*(?:watch|hot|rising|peaking|cooling)\s*\/\s*(?:mention|ignore)|\bmention\s*\(\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?\)/i;
for (const file of files) {
  if (file.endsWith("README.md")) continue;
  const text = await readFile(file, "utf8");
  if (requested.length && internalRubric.test(text)) {
    console.error(`${file}: contains internal scoring or selection instructions`);
    ok = false;
  }
  for (const heading of required) {
    if (!text.includes(heading)) {
      console.error(`${file}: missing ${heading}`);
      ok = false;
    }
  }
}

if (!ok) process.exit(1);
console.log("george-builder-radar feed validation ok");

