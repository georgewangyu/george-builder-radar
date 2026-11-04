const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "feed-publication-"));
const file = path.join(directory, "feed.md");
const script = path.resolve(__dirname, "validate-feed.js");
const headings = ["Top Signals", "X Builder Notes", "GitHub / Repo Radar", "Launch Radar", "Official AI / Devtool Updates", "Podcasts / Longform", "Builder Takeaways", "Source Receipts"];
const clean = headings.map((heading) => `## ${heading}\n`).join("\n") + "Provider model scores and Product Hunt ranking scores are not adoption. HN70/65 is a dated discussion count.\n";
const invoke = () => spawnSync(process.execPath, [script, file], { encoding: "utf8" });
try {
  fs.writeFileSync(file, clean);
  assert.equal(invoke().status, 0);
  for (const scaffold of ["attention_heat75", "single segment", "specialist override", "Omission audit", "40 attention / 86 fit", "default heat threshold", "56.5/75.25,watch/mention", "remains mention (64/84)"]) {
    fs.writeFileSync(file, clean + scaffold);
    const result = invoke();
    assert.equal(result.status, 1, scaffold);
    assert.match(result.stderr, /internal scoring or selection instructions/);
  }
  fs.writeFileSync(file, clean.replace("## Source Receipts", "Source Receipts"));
  assert.equal(invoke().status, 1);
  const archive = fs.mkdtempSync(path.join(os.tmpdir(), "feed-archive-"));
  try {
    const feedDir = path.join(archive, "feeds/2026/07");
    fs.mkdirSync(path.join(archive, "config"), { recursive: true });
    fs.mkdirSync(path.join(archive, "scripts"), { recursive: true });
    fs.mkdirSync(feedDir, { recursive: true });
    fs.copyFileSync(script, path.join(archive, "scripts/validate-feed.js"));
    fs.writeFileSync(path.join(feedDir, "2026-07-10.md"), clean + "attention_heat 88");
    const archiveRun = () => spawnSync(process.execPath, [path.join(archive, "scripts/validate-feed.js")], { encoding: "utf8" });
    fs.writeFileSync(path.join(archive, "config/rubric-legacy-allowlist.txt"), "# legacy\nfeeds/2026/07/2026-07-10.md\n");
    assert.equal(archiveRun().status, 0, "allowlisted legacy feed passes the full-archive run");
    const explicitRun = spawnSync(process.execPath, [path.join(archive, "scripts/validate-feed.js"), path.join(feedDir, "2026-07-10.md")], { encoding: "utf8" });
    assert.equal(explicitRun.status, 1, "an explicit path is always rubric-checked, even if allowlisted");
    fs.writeFileSync(path.join(archive, "config/rubric-legacy-allowlist.txt"), "# legacy\n");
    const leaked = archiveRun();
    assert.equal(leaked.status, 1, "a non-allowlisted feed with scoring text fails the full-archive run");
    assert.match(leaked.stderr, /internal scoring or selection instructions/);
  } finally {
    fs.rmSync(archive, { recursive: true, force: true });
  }
  console.log("Explicit feed selection and public editorial-boundary tests passed.");
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
