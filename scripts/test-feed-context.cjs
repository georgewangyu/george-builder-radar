const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "lib/builder-feeds.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
}).outputText;
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "builder-feed-context-"));
const previous = process.cwd();

try {
  const feeds = path.join(temporary, "feeds/2026/10");
  fs.mkdirSync(feeds, { recursive: true });
  fs.writeFileSync(path.join(feeds, "2026-10-12.md"), `# Example feed

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
`);
  process.chdir(temporary);
  const loaded = new Module(path.join(root, "lib/builder-feeds-test.cjs"), module);
  loaded.filename = path.join(root, "lib/builder-feeds-test.cjs");
  loaded.paths = Module._nodeModulePaths(root);
  loaded._compile(compiled, loaded.filename);
  const feed = loaded.exports.feedById("2026-10-12");
  assert.equal(feed.signals.length, 3);
  assert.equal(feed.signals[0].title, "Model access");
  assert.match(feed.signals[0].why, /Quota claims have not been independently tested/);
  assert.match(feed.summary, /Keep this signal/);
  const context = feed.context.map((entry) => entry.paragraphs.join(" ")).join(" ");
  assert.match(context, /Counters are not adoption/);
  assert.match(context, /Coverage is incomplete/);
  assert.match(context, /evaluator compute is excluded/);
  assert.match(context, /denominator proxies/);
  assert.match(context, /No independent runtime validation was performed/);
  assert.match(context, /Interval growth does not establish acceleration/);
  assert(feed.signals.some((signal) => signal.why.includes("Preserve the structured item")));
  assert(feed.context.flatMap((entry) => entry.sources).includes("https://example.com/research"));
  assert(!context.includes("Keep this signal"));
  console.log("Feed paragraph, snapshot, qualification and official-update tests passed.");
} finally {
  process.chdir(previous);
  fs.rmSync(temporary, { recursive: true, force: true });
}
