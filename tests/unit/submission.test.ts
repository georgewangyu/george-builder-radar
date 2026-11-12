import { describe, expect, test } from "vitest";
import { issueBody, issueLabels, issueTitle } from "@/lib/github-issue";
import { parseBuilderSubmission, type BuilderSubmission } from "@/lib/submission-schema";

const valid = {
  submissionType: "request-source",
  visibility: "private",
  title: "  Track the Foo repo  ",
  outcome: "It ships agent tooling weekly.",
  notes: "Rough note about why it matters.",
  context: "https://github.com/example/foo",
  handle: "@builder",
};

function parsed(overrides: Record<string, unknown> = {}): BuilderSubmission {
  const result = parseBuilderSubmission({ ...valid, ...overrides });
  if (!result.success) throw new Error(JSON.stringify(result.issues));
  return result.data;
}

describe("parseBuilderSubmission", () => {
  test("trims fields and keeps known choices", () => {
    expect(parsed()).toEqual({
      submissionType: "request-source",
      visibility: "private",
      title: "Track the Foo repo",
      outcome: "It ships agent tooling weekly.",
      notes: "Rough note about why it matters.",
      context: "https://github.com/example/foo",
      handle: "@builder",
      website: "",
    });
  });

  test("unknown type and visibility fall back to submit-signal and public", () => {
    const data = parsed({ submissionType: "hack", visibility: "secret" });
    expect([data.submissionType, data.visibility]).toEqual(["submit-signal", "public"]);
  });

  test("reports every length violation by field", () => {
    const result = parseBuilderSubmission({
      title: "abc",
      outcome: "short",
      notes: "x".repeat(2501),
      context: "c".repeat(1001),
      handle: "h".repeat(121),
      website: "bot",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(result.issues).sort()).toEqual(
      ["context", "handle", "notes", "outcome", "title", "website"],
    );
  });

  test("a non-object payload is invalid, not a crash", () => {
    expect(parseBuilderSubmission(null).success).toBe(false);
  });
});

describe("issue formatting", () => {
  test("title is prefixed by type and compacted to 78 chars", () => {
    const data = parsed({ title: "word ".repeat(20) });
    const title = issueTitle(data);
    expect(title.startsWith("[george-builder-radar:request-source] ")).toBe(true);
    expect(title.endsWith("...")).toBe(true);
    expect(title.length).toBe("[george-builder-radar:request-source] ".length + 78);
  });

  test("labels carry repo, triage, type and visibility", () => {
    expect(issueLabels(parsed())).toEqual([
      "george-builder-radar",
      "source-repo:george-builder-radar",
      "status:needs-triage",
      "type:request-source",
      "visibility:private",
    ]);
  });

  test("body shows placeholders for missing handle and context", () => {
    const body = issueBody(parsed({ handle: "", context: "", visibility: "public" }));
    expect(body).toContain("**Handle:** _Anonymous / not provided_");
    expect(body).toContain("## Link or source\n\n_Not provided_");
    expect(body).toContain("**Visibility:** Public GitHub issue");
    expect(body).toContain("## Signal or source\n\nTrack the Foo repo");
  });
});
