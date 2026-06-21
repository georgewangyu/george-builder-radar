#!/usr/bin/env node

import { readdir, readFile } from "fs/promises";
import { join } from "path";
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
for (const file of await walk(join(root, "feeds"))) {
  if (file.endsWith("README.md")) continue;
  const text = await readFile(file, "utf8");
  for (const heading of required) {
    if (!text.includes(heading)) {
      console.error(`${file}: missing ${heading}`);
      ok = false;
    }
  }
}

if (!ok) process.exit(1);
console.log("george-builder-radar feed validation ok");

