#!/usr/bin/env node

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const feedsDir = join(root, "feeds");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    if (entry.isFile() && /^\d{4}-\d{2}-\d{2}\.md$/.test(entry.name)) files.push(path);
  }
  return files;
}

const files = (await walk(feedsDir)).sort();
if (files.length === 0) {
  console.error("No George's Builder Radar feeds found.");
  process.exit(1);
}

const latest = files[files.length - 1];
const text = await readFile(latest, "utf8");
process.stdout.write(text);
