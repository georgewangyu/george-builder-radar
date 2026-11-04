import { expect, test } from "vitest";
import { GET } from "@/app/search-index.json/route";
import { feeds } from "@/lib/builder-feeds";
import { feedSearchText } from "@/lib/feed-summary";

test("the search index has one entry per published feed", async () => {
  const index = (await GET().json()) as Record<string, string>;
  expect(Object.keys(index).sort()).toEqual(feeds.map((feed) => feed.id).sort());
  expect(index[feeds[0].id]).toBe(feedSearchText(feeds[0]));
});
