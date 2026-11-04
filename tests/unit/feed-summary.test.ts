import { describe, expect, test } from "vitest";
import type { BuilderFeed } from "@/lib/builder-feeds";
import { feedSearchText, summarizeFeed, summarySearchText } from "@/lib/feed-summary";

const feed: BuilderFeed = {
  id: "2026-11-03",
  title: "Builder Radar",
  date: "2026-11-03",
  status: "latest",
  summary: "Agents Ship",
  sourcePath: "feeds/2026/11/2026-11-03.md",
  markdown: "# full markdown that must not reach the home page",
  signals: [{ title: "Signal A", why: "Because MEMORY", source: "" }],
  xNotes: [],
  repos: [{ title: "repo-x", description: "Repo Desc", source: "" }],
  launches: [],
  takeaways: ["Takeaway T"],
  context: [{ title: "ctx", paragraphs: ["context paragraph"], sources: [] }],
};

describe("feed summaries for the home page", () => {
  test("carry only list fields, counts and lane flags", () => {
    expect(summarizeFeed(feed)).toEqual({
      id: "2026-11-03",
      title: "Builder Radar",
      date: "2026-11-03",
      status: "latest",
      summary: "Agents Ship",
      signalCount: 1,
      hasRepos: true,
      hasLaunches: false,
      hasXNotes: false,
    });
  });

  test("search text covers signals, items and takeaways, lowercased, but not markdown or context", () => {
    const text = feedSearchText(feed);
    for (const part of ["signal a because memory", "repo-x repo desc", "takeaway t", "agents ship"]) {
      expect(text).toContain(part);
    }
    expect(text).not.toContain("full markdown");
    expect(text).not.toContain("context paragraph");
  });

  test("before the index loads, search falls back to title, date and summary", () => {
    expect(summarySearchText(summarizeFeed(feed))).toBe("builder radar 2026-11-03 agents ship");
  });
});
