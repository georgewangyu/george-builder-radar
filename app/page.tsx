import { BuilderRadarApp } from "./builder-radar-app";
import { feeds } from "@/lib/builder-feeds";
import { summarizeFeed } from "@/lib/feed-summary";

export default function Home() {
  return <BuilderRadarApp latestFeed={feeds[0]} archive={feeds.map(summarizeFeed)} />;
}
