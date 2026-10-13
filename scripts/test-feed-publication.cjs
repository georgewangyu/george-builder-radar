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
  console.log("Explicit feed selection and public editorial-boundary tests passed.");
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
