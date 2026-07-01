import Link from "next/link";
import { notFound } from "next/navigation";
import { feedById, feeds, type BuilderItem, type BuilderSignal } from "@/lib/builder-feeds";

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
  if (!href || href === "N/A") return null;

  return (
    <a className="source-link" href={href}>
      Source
    </a>
  );
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
          <h3>{item.title}</h3>
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

  const receipts = Array.from(
    new Set(
      [
        ...feed.signals.map((item) => item.source),
        ...feed.xNotes.map((item) => item.source),
        ...feed.repos.map((item) => item.source),
        ...feed.launches.map((item) => item.source),
      ].filter((source) => source && source !== "N/A"),
    ),
  );

  return (
    <main className="shell feed-page">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">GB</span>
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
        <div className="section-heading">
          <span>{feed.date}</span>
          <h1>{feed.title.replace("George's Builder Radar - ", "")}</h1>
        </div>
        <p>{feed.summary}</p>
        <div className="quick-stats" aria-label="Feed contents">
          <span>{feed.signals.length} top signals</span>
          <span>{feed.repos.length} repos</span>
          <span>{feed.launches.length} launches</span>
        </div>
      </section>

      {feed.signals.length > 0 && (
        <section className="feed-section" aria-labelledby="top-signals-title">
          <div className="section-heading">
            <span>Top Signals</span>
            <h2 id="top-signals-title">What moved today</h2>
          </div>
          <SignalList signals={feed.signals} />
        </section>
      )}

      {feed.xNotes.length > 0 && (
        <section className="feed-section" aria-labelledby="x-notes-title">
          <div className="section-heading">
            <span>X Builder Notes</span>
            <h2 id="x-notes-title">Public conversation signals</h2>
          </div>
          <ItemList items={feed.xNotes} />
        </section>
      )}

      {feed.repos.length > 0 && (
        <section className="feed-section" aria-labelledby="repos-title">
          <div className="section-heading">
            <span>GitHub / Repo Radar</span>
            <h2 id="repos-title">Repos worth studying</h2>
          </div>
          <ItemList items={feed.repos} />
        </section>
      )}

      {feed.launches.length > 0 && (
        <section className="feed-section" aria-labelledby="launches-title">
          <div className="section-heading">
            <span>Launch Radar</span>
            <h2 id="launches-title">Products and wedges</h2>
          </div>
          <ItemList items={feed.launches} />
        </section>
      )}

      {feed.takeaways.length > 0 && (
        <section className="feed-section" aria-labelledby="takeaways-title">
          <div className="section-heading">
            <span>Builder Takeaways</span>
            <h2 id="takeaways-title">Operator notes</h2>
          </div>
          <ul className="takeaway-list">
            {feed.takeaways.map((takeaway) => (
              <li key={takeaway}>{takeaway}</li>
            ))}
          </ul>
        </section>
      )}

      {receipts.length > 0 && (
        <section className="feed-section" aria-labelledby="receipts-title">
          <div className="section-heading">
            <span>Source Receipts</span>
            <h2 id="receipts-title">Original links</h2>
          </div>
          <div className="receipt-list">
            {receipts.map((receipt) => (
              <a href={receipt} key={receipt}>
                {receipt}
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
