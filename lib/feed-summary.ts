import type { BuilderFeed } from "./builder-feeds";

export type FeedSummary = Pick<BuilderFeed, "id" | "title" | "date" | "status" | "summary"> & {
  signalCount: number;
  hasRepos: boolean;
  hasLaunches: boolean;
  hasXNotes: boolean;
};

export type SearchIndex = Record<string, string>;

export function feedSearchText(feed: BuilderFeed): string {
  return [
    feed.title,
    feed.date,
    feed.summary,
    feed.signals.map((signal) => `${signal.title} ${signal.why}`).join(" "),
    feed.xNotes.map((item) => `${item.title} ${item.description}`).join(" "),
    feed.repos.map((item) => `${item.title} ${item.description}`).join(" "),
    feed.launches.map((item) => `${item.title} ${item.description}`).join(" "),
    feed.takeaways.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

export function summarySearchText(feed: FeedSummary): string {
  return [feed.title, feed.date, feed.summary].join(" ").toLowerCase();
}

export function summarizeFeed(feed: BuilderFeed): FeedSummary {
  return {
    id: feed.id,
    title: feed.title,
    date: feed.date,
    status: feed.status,
    summary: feed.summary,
    signalCount: feed.signals.length,
    hasRepos: feed.repos.length > 0,
    hasLaunches: feed.launches.length > 0,
    hasXNotes: feed.xNotes.length > 0,
  };
}
