import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

const feedMarkdown = `# Example feed

Snapshot: October 12 at 09:00 PDT. Counters are not adoption.

## Late-Breaking AI Signal

[Model access](https://example.com/model) opened at 17:00.

Quota claims have not been independently tested.

## Late-Breaking AI Signal Mixed

No independent runtime validation was performed.

- **Second update**
  - Why it matters: Preserve the structured item.
  - Source: https://example.com/second

Interval growth does not establish acceleration.

## Top Signals

- **Existing signal**
  - Why it matters: Keep this signal.
  - Source: https://example.com/existing

Coverage is incomplete; missing data is not zero.

## Official AI / Devtool Updates

- [Research](https://example.com/research): evaluator compute is excluded.

## Source Receipts

- Current follower counts are denominator proxies.
`;

let workspace = "";
let previousCwd = "";

beforeAll(() => {
  previousCwd = process.cwd();
  workspace = mkdtempSync(path.join(tmpdir(), "builder-feed-context-"));
  mkdirSync(path.join(workspace, "feeds/2026/10"), { recursive: true });
  writeFileSync(path.join(workspace, "feeds/2026/10/2026-10-12.md"), feedMarkdown);
  process.chdir(workspace);
});

afterAll(() => {
  process.chdir(previousCwd);
  rmSync(workspace, { recursive: true, force: true });
});

describe("builder feed parsing", () => {
  test("keeps late-breaking signals, snapshot and qualification paragraphs", async () => {
    vi.resetModules();
    const { feedById } = await import("@/lib/builder-feeds");
    const feed = feedById("2026-10-12");
    if (!feed) throw new Error("feed not found");
    expect(feed.signals.length).toBe(3);
    expect(feed.signals[0].title).toBe("Model access");
    expect(feed.signals[0].why).toMatch(/Quota claims have not been independently tested/);
    expect(feed.summary).toMatch(/Keep this signal/);
    const context = feed.context.map((entry) => entry.paragraphs.join(" ")).join(" ");
    expect(context).toMatch(/Counters are not adoption/);
    expect(context).toMatch(/Coverage is incomplete/);
    expect(context).toMatch(/evaluator compute is excluded/);
    expect(context).toMatch(/denominator proxies/);
    expect(context).toMatch(/No independent runtime validation was performed/);
    expect(context).toMatch(/Interval growth does not establish acceleration/);
    expect(feed.signals.some((signal) => signal.why.includes("Preserve the structured item"))).toBe(true);
    expect(feed.context.flatMap((entry) => entry.sources).includes("https://example.com/research")).toBe(true);
    expect(context.includes("Keep this signal")).toBe(false);
  });
});
