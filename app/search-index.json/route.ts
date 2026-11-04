import { feeds } from "@/lib/builder-feeds";
import { feedSearchText } from "@/lib/feed-summary";

export const dynamic = "force-static";

export function GET() {
  return Response.json(Object.fromEntries(feeds.map((feed) => [feed.id, feedSearchText(feed)])));
}
