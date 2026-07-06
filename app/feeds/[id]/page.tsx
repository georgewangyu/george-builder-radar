import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/app/brand-mark";
import { feedById, feeds, type BuilderItem, type BuilderSignal } from "@/lib/builder-feeds";
import { displaySourceLabel, extractUrls, firstUrl } from "@/lib/source-links";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return feeds.map((feed) => ({ id: feed.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const feed = feedById(id);

  if (!feed) {
    return {
      title: "Feed not found - George's Builder Radar",
    };
  }

  return {
    title: `${feed.date} - George's Builder Radar`,
    description: feed.summary,
  };
}

function SourceLink({ href }: { href: string }) {
  const url = firstUrl(href);
  if (!url) return null;

  return (
    <a className="source-link" href={url}>
      Source
    </a>
  );
}

function ItemTitle({ item }: { item: BuilderItem }) {
  const url = firstUrl(item.title, item.source);
  const label = url && item.title === url ? displaySourceLabel(url) : item.title;

  if (!url) return <h3>{label}</h3>;

  return (
    <h3>
      <a className="feed-title-link" href={url}>
        {label}
      </a>
    </h3>
  );
}

function displayFeedTitle(feed: NonNullable<ReturnType<typeof feedById>>) {
  const title = feed.title.replace("George's Builder Radar - ", "");

  if (title && title !== feed.date) return title;
  const signalTitle = feed.signals[0]?.title.split(":")[0]?.trim().replace(/\.$/, "");
  if (signalTitle) return signalTitle;
  return "Daily builder signal brief";
}

function SignalList({ signals }: { signals: BuilderSignal[] }) {
  return (
    <div className="feed-card-grid">
      {signals.map((signal, index) => (
        <article className="feed-card" key={`${signal.title}-${index}`}>
          <div className="feed-card-meta">Signal {index + 1}</div>
          <h3>{signal.title}</h3>
          <p>{signal.why}</p>
          <SourceLink href={signal.source} />
        </article>
      ))}
    </div>
  );
}

function ItemList({ items }: { items: BuilderItem[] }) {
  return (
    <div className="feed-card-grid">
      {items.map((item) => (
        <article className="feed-card" key={`${item.title}-${item.source}`}>
          <ItemTitle item={item} />
          {item.description && <p>{item.description}</p>}
          <SourceLink href={item.source} />
        </article>
      ))}
    </div>
  );
}

export default async function FeedPage({ params }: PageProps) {
  const { id } = await params;
  const feed = feedById(id);

  if (!feed) notFound();

  const displayTitle = displayFeedTitle(feed);
  const receipts = Array.from(
    new Set(
      [
        ...feed.signals.flatMap((item) => extractUrls(item.source)),
        ...feed.xNotes.flatMap((item) => extractUrls(`${item.title} ${item.source}`)),
        ...feed.repos.flatMap((item) => extractUrls(`${item.title} ${item.source}`)),
        ...feed.launches.flatMap((item) => extractUrls(`${item.title} ${item.source}`)),
      ].filter(Boolean),
    ),
  );

  return (
    <main className="shell feed-page">
      <header className="topbar">
        <Link className="brand" href="/">
          <BrandMark />
          <span>Builder Radar</span>
        </Link>
        <nav className="nav-links" aria-label="Feed navigation">
          <Link href="/">Home</Link>
          <Link href="/#archive">Archive</Link>
          <Link href="/#skill">Skill</Link>
          <Link href="/#submit">Submit</Link>
        </nav>
      </header>

      <section className="feed-hero">
        <div className="feed-date-tile" aria-label={`Feed date ${feed.date}`}>
          <span>{feed.date.slice(0, 4)}</span>
          <strong>{feed.date.slice(5)}</strong>
        </div>
        <div className="feed-brief-main">
          <div className="section-heading">
            <span>{feed.status === "latest" ? "Latest Feed" : "Archive Feed"} / {feed.date}</span>
            <h1>{displayTitle}</h1>
          </div>
          <p>{feed.summary}</p>
          <div className="quick-stats" aria-label="Feed contents">
            <span>{feed.signals.length} top signals</span>
            <span>{feed.repos.length} repos</span>
            <span>{feed.launches.length} launches</span>
            <span>{receipts.length} receipts</span>
          </div>
        </div>
      </section>

      {feed.signals.length > 0 && (
        <section className="feed-section" aria-labelledby="top-signals-title">
          <div className="section-heading feed-section-head">
            <span>Top Signals</span>
            <h2 id="top-signals-title">What moved today</h2>
            <p>Two concise reads that explain why this digest matters.</p>
          </div>
          <div className="feed-section-body">
            <SignalList signals={feed.signals} />
          </div>
        </section>
      )}

      {feed.xNotes.length > 0 && (
        <section className="feed-section" aria-labelledby="x-notes-title">
          <div className="section-heading feed-section-head">
            <span>X Builder Notes</span>
            <h2 id="x-notes-title">Public conversation signals</h2>
            <p>Posts worth preserving because they point at repeatable builder behavior.</p>
          </div>
          <div className="feed-section-body">
            <ItemList items={feed.xNotes} />
          </div>
        </section>
      )}

      {feed.repos.length > 0 && (
        <section className="feed-section" aria-labelledby="repos-title">
          <div className="section-heading feed-section-head">
            <span>GitHub / Repo Radar</span>
            <h2 id="repos-title">Repos worth studying</h2>
            <p>Open-source proof objects with reusable product or workflow patterns.</p>
          </div>
          <div className="feed-section-body">
            <ItemList items={feed.repos} />
          </div>
        </section>
      )}

      {feed.launches.length > 0 && (
        <section className="feed-section" aria-labelledby="launches-title">
          <div className="section-heading feed-section-head">
            <span>Launch Radar</span>
            <h2 id="launches-title">Products and wedges</h2>
            <p>Commercial surfaces that show where attention or buyer pain is collecting.</p>
          </div>
          <div className="feed-section-body">
            <ItemList items={feed.launches} />
          </div>
        </section>
      )}

      {feed.takeaways.length > 0 && (
        <section className="feed-section" aria-labelledby="takeaways-title">
          <div className="section-heading feed-section-head">
            <span>Builder Takeaways</span>
            <h2 id="takeaways-title">Operator notes</h2>
            <p>The short action layer from the feed.</p>
          </div>
          <div className="feed-section-body">
            <ul className="takeaway-list">
              {feed.takeaways.map((takeaway) => (
                <li key={takeaway}>{takeaway}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {receipts.length > 0 && (
        <section className="feed-section" aria-labelledby="receipts-title">
          <div className="section-heading feed-section-head">
            <span>Source Receipts</span>
            <h2 id="receipts-title">Original links</h2>
            <p>Direct public sources used by this digest.</p>
          </div>
          <div className="feed-section-body">
            <div className="receipt-list">
              {receipts.map((receipt) => (
                <a href={receipt} key={receipt}>
                  <strong>{displaySourceLabel(receipt)}</strong>
                  <span>{receipt}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
