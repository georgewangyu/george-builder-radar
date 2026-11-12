import { describe, expect, test } from "vitest";
import { sourceTitle } from "@/lib/source-links";

describe("sourceTitle", () => {
  test("a bare url title is shown as its short source label", () => {
    expect(sourceTitle("https://github.com/owner/repo", "")).toEqual({
      href: "https://github.com/owner/repo",
      label: "owner/repo",
    });
  });

  test("a text title keeps its text and links the source url", () => {
    expect(sourceTitle("Great repo", "see https://x.com/dev/status/1")).toEqual({
      href: "https://x.com/dev/status/1",
      label: "Great repo",
    });
  });

  test("no url anywhere means no link", () => {
    expect(sourceTitle("Plain", "none")).toEqual({ href: "", label: "Plain" });
  });
});
