import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";

export type BuilderSignal = {
  title: string;
  why: string;
  source: string;
};

export type BuilderItem = {
  title: string;
  description: string;
  source: string;
};

export type BuilderFeed = {
  id: string;
  title: string;
  date: string;
  status: "latest" | "archive";
  summary: string;
  sourcePath: string;
  markdown: string;
  signals: BuilderSignal[];
  xNotes: BuilderItem[];
  repos: BuilderItem[];
  launches: BuilderItem[];
  takeaways: string[];
};

const feedsRoot = path.join(process.cwd(), "feeds");

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function firstLineFor(markdown: string, prefix: string) {
  return markdown
    .split("\n")
    .find((line) => line.trim().startsWith(prefix))
    ?.trim()
    .replace(prefix, "")
    .trim();
}

function section(markdown: string, heading: string) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);

  if (start === -1) return "";

  const sectionLines: string[] = [];

  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    sectionLines.push(line);
  }

  return sectionLines.join("\n").trim();
}

function bulletBlocks(sectionText: string) {
  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of sectionText.split("\n")) {
    if (line.startsWith("- ")) {
      if (current.length > 0) blocks.push(current.join("\n"));
      current = [line];
    } else if (current.length > 0 && (line.startsWith("  ") || line.trim() === "")) {
      current.push(line);
    }
  }

  if (current.length > 0) blocks.push(current.join("\n"));
  return blocks;
}

function valueFrom(block: string, label: string) {
  const pattern = new RegExp(`^\\s*- ${label}:\\s*(.+)$`, "m");
  return block.match(pattern)?.[1]?.trim() || "";
}

function parseSignals(markdown: string) {
  return bulletBlocks(section(markdown, "Top Signals"))
    .map((block) => ({
      title: valueFrom(block, "Signal"),
      why: valueFrom(block, "Why it matters"),
      source: valueFrom(block, "Source"),
    }))
    .filter((item) => item.title);
}

function parseItems(markdown: string, heading: string, titleLabel: string, descriptionLabels: string[]) {
  return bulletBlocks(section(markdown, heading))
    .map((block) => {
      const title = valueFrom(block, titleLabel) || block.split("\n")[0]?.replace(/^- /, "").trim();
      const description =
        descriptionLabels.map((label) => valueFrom(block, label)).find(Boolean) || "";
      const source = valueFrom(block, "Source");

      return { title, description, source };
    })
    .filter((item) => item.title);
}

function parseTakeaways(markdown: string) {
  return bulletBlocks(section(markdown, "Builder Takeaways"))
    .map((block) => block.replace(/^- /, "").replace(/\n\s+/g, " ").trim())
    .filter(Boolean);
}

function feedPaths() {
  if (!existsSync(feedsRoot)) return [];

  return readdirSync(feedsRoot, { recursive: true, encoding: "utf8" })
    .filter(
      (entry): entry is string =>
        /^\d{4}\/\d{2}\/\d{4}-\d{2}-\d{2}\.md$/.test(entry),
    )
    .map((entry) => path.join(feedsRoot, entry))
    .sort();
}

function parseFeed(filePath: string): BuilderFeed {
  const markdown = readFileSync(filePath, "utf8");
  const fileName = path.basename(filePath, ".md");
  const title = markdown.match(/^# (.+)$/m)?.[1]?.trim() || "George's Builder Radar";
  const signals = parseSignals(markdown);
  const date = fileName.match(/\d{4}-\d{2}-\d{2}/)?.[0] || fileName;
  const summary =
    signals[0]?.why ||
    firstLineFor(markdown, "Updated") ||
    "A public-safe builder digest from George's morning routine.";

  return {
    id: slugify(fileName),
    title,
    date,
    status: "archive",
    summary,
    sourcePath: path.relative(process.cwd(), filePath),
    markdown,
    signals,
    xNotes: parseItems(markdown, "X Builder Notes", "Account / post", [
      "Public-safe read",
    ]),
    repos: parseItems(markdown, "GitHub / Repo Radar", "Repo", [
      "Why builders should care",
      "What it does",
    ]),
    launches: parseItems(markdown, "Launch Radar", "Product / launch", [
      "Signal",
      "Wedge",
    ]),
    takeaways: parseTakeaways(markdown),
  };
}

export const feeds = feedPaths()
  .map(parseFeed)
  .sort((left, right) => right.date.localeCompare(left.date))
  .map((feed, index) => ({
    ...feed,
    status: index === 0 ? "latest" as const : "archive" as const,
  }));

export const latestFeed = feeds[0];

export function feedById(id: string) {
  return feeds.find((feed) => feed.id === id);
}

export const allSources = Array.from(
  new Set(
    feeds.flatMap((feed) => [
      ...feed.signals.map((item) => item.source),
      ...feed.xNotes.map((item) => item.source),
      ...feed.repos.map((item) => item.source),
      ...feed.launches.map((item) => item.source),
    ]).filter(Boolean),
  ),
);
