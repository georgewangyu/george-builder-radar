"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BrandMark } from "./brand-mark";
import type { BuilderFeed } from "@/lib/builder-feeds";
import { displaySourceLabel, firstUrl } from "@/lib/source-links";

type Props = {
  feeds: BuilderFeed[];
};

type SortMode = "latest" | "signals" | "title";
type Notice = "idle" | "copied" | "submitted";
type FormStatus = "idle" | "submitting" | "success" | "error";
type DesignVariant = "compact" | "proof" | "editorial";
type LaneFilter = "latest" | "repos" | "launches" | "x";

type ErrorResponse = {
  error?: string;
  issues?: Record<string, string[] | undefined>;
};

const submissionTypes = [
  ["submit-signal", "Submit signal"],
  ["request-source", "Request source"],
  ["improve-feed", "Improve feed"],
] as const;

const sortOptions: Array<[SortMode, string]> = [
  ["latest", "Newest"],
  ["signals", "Most signals"],
  ["title", "A-Z"],
];

const laneFilters: Array<[LaneFilter, string]> = [
  ["latest", "Latest"],
  ["repos", "Repos"],
  ["launches", "Launches"],
  ["x", "X notes"],
];

const issueLabels: Record<string, string> = {
  title: "Signal or source",
  outcome: "Why this belongs",
  notes: "Rough note",
  context: "Link or source",
  handle: "Handle",
};

const leadLabels: Record<string, string> = {
  email: "Email",
  name: "Name",
  website: "Website",
};

const skillInstallCommand =
  "npx skills add georgewangyu/george-builder-radar --skill george-builder-radar -g";
const skillRepoUrl = "https://github.com/georgewangyu/george-builder-radar";
const leadStorageKey = "george-builder-radar-install-unlocked";
const pageSize = 12;

function LinkedItemTitle({ title, source }: { title: string; source: string }) {
  const href = firstUrl(title, source);
  const label = href && title === href ? displaySourceLabel(href) : title;

  if (!href) return <strong>{label}</strong>;

  return (
    <a className="inline-source-link" href={href}>
      {label}
    </a>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">
      <path d="m21 21-4.3-4.3" />
      <circle cx="10.8" cy="10.8" r="6.6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">
      <rect height="12" rx="2" width="12" x="8" y="8" />
      <path d="M4 16.2V5.8C4 4.8 4.8 4 5.8 4h10.4" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
    </svg>
  );
}

function sortFeeds(items: BuilderFeed[], sortMode: SortMode) {
  if (sortMode === "signals") {
    return [...items].sort(
      (left, right) =>
        right.signals.length - left.signals.length ||
        right.date.localeCompare(left.date),
    );
  }

  if (sortMode === "title") {
    return [...items].sort((left, right) =>
      left.title.localeCompare(right.title, undefined, { sensitivity: "base" }),
    );
  }

  return [...items].sort((left, right) => right.date.localeCompare(left.date));
}

async function errorMessageFor(response: Response) {
  if (response.status !== 400) {
    return "Something went wrong. Try again or send the signal another way.";
  }

  const body = (await response.json().catch(() => null)) as ErrorResponse | null;
  const fieldMessages = Object.entries(body?.issues || {}).flatMap(
    ([field, messages]) =>
      (messages || []).map((message) => `${issueLabels[field] || field}: ${message}`),
  );

  return fieldMessages.length > 0
    ? fieldMessages.join(" ")
    : body?.error || "Please check the form and try again.";
}

async function leadErrorMessageFor(response: Response) {
  if (response.status !== 400) {
    return "Could not unlock the install command. Try again in a moment.";
  }

  const body = (await response.json().catch(() => null)) as ErrorResponse | null;
  const fieldMessages = Object.entries(body?.issues || {}).flatMap(
    ([field, messages]) =>
      (messages || []).map((message) => `${leadLabels[field] || field}: ${message}`),
  );

  return fieldMessages.length > 0
    ? fieldMessages.join(" ")
    : body?.error || "Please check your email and try again.";
}

export function BuilderRadarApp({ feeds }: Props) {
  const latestFeed = feeds[0];
  const [designVariant, setDesignVariant] = useState<DesignVariant>("compact");
  const [selectedId, setSelectedId] = useState(latestFeed?.id || feeds[0]?.id);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [laneFilter, setLaneFilter] = useState<LaneFilter>("latest");
  const [submissionType, setSubmissionType] = useState("submit-signal");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice>("idle");
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [leadStatus, setLeadStatus] = useState<FormStatus>("idle");
  const [leadUnlocked, setLeadUnlocked] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [page, setPage] = useState(1);

  const selectedFeed =
    feeds.find((feed) => feed.id === selectedId) || latestFeed || feeds[0];

  const filteredFeeds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return feeds.filter((feed) => {
      const laneMatches =
        laneFilter === "latest" ||
        (laneFilter === "repos" && feed.repos.length > 0) ||
        (laneFilter === "launches" && feed.launches.length > 0) ||
        (laneFilter === "x" && feed.xNotes.length > 0);

      const haystack = [
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

      return laneMatches && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [feeds, laneFilter, query]);

  const sortedFeeds = useMemo(
    () => sortFeeds(filteredFeeds, sortMode),
    [filteredFeeds, sortMode],
  );
  const pageCount = Math.max(1, Math.ceil(sortedFeeds.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, sortedFeeds.length);
  const visibleFeeds = sortedFeeds.slice(pageStart, pageEnd);

  useEffect(() => {
    setLeadUnlocked(window.localStorage.getItem(leadStorageKey) === "true");

    const design = new URLSearchParams(window.location.search).get("design");
    if (design === "proof" || design === "editorial") {
      setDesignVariant(design);
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [laneFilter, query, sortMode]);

  function flash(nextNotice: Notice) {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice("idle"), 1800);
  }

  async function copyFeed(feed: BuilderFeed) {
    await navigator.clipboard.writeText(feed.markdown).catch(() => undefined);
    flash("copied");
  }

  async function copySetupCommand() {
    await navigator.clipboard.writeText(skillInstallCommand).catch(() => undefined);
    setCopiedCommand(true);
    window.setTimeout(() => setCopiedCommand(false), 1400);
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const payload = Object.fromEntries(new FormData(formElement).entries());

    setLeadStatus("submitting");
    setLeadError("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setLeadStatus("error");
        setLeadError(await leadErrorMessageFor(response));
        return;
      }

      window.localStorage.setItem(leadStorageKey, "true");
      setLeadUnlocked(true);
      setLeadStatus("success");
      formElement.reset();
    } catch {
      setLeadStatus("error");
      setLeadError("Could not unlock the install command. Try again in a moment.");
    }
  }

  async function handleSubmitSignal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setFormStatus("submitting");
    setError("");

    const form = new FormData(formElement);
    const payload = {
      submissionType: String(form.get("submissionType") || submissionType),
      visibility: String(form.get("visibility") || "public"),
      title: String(form.get("title") || ""),
      outcome: String(form.get("outcome") || ""),
      notes: String(form.get("notes") || ""),
      context: String(form.get("context") || ""),
      handle: String(form.get("handle") || ""),
      website: String(form.get("website") || ""),
    };

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setFormStatus("error");
        setError(await errorMessageFor(response));
        return;
      }

      formElement.reset();
      setSubmissionType("submit-signal");
      setFormStatus("success");
      flash("submitted");
    } catch {
      setFormStatus("error");
      setError("Something went wrong. Try again or send the signal another way.");
    }
  }

  if (!selectedFeed) {
    return (
      <main className="shell">
        <section className="empty-state">
          <h1>George's Builder Radar</h1>
          <p>No public feeds are available yet.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={`shell design-${designVariant}`}>
      <header className="topbar">
        <a className="brand" href="#">
          <BrandMark />
          <span>Builder Radar</span>
        </a>
        <nav className="nav-links" aria-label="Page navigation">
          <a href="#today">Today</a>
          <a href="#signals">Signals</a>
          <a href="#full-archive">Archive</a>
          <a href="#skill">Skill</a>
          <a href="#submit">Submit</a>
        </nav>
        <a className="primary nav-cta" href="#skill">
          Install skill
        </a>
      </header>

      <section className="desk" id="today" aria-labelledby="page-title">
        <div className="main-board">
          <div className="board-head">
            <div>
              <div className="eyebrow">Public builder-signal feed</div>
              <h1 id="page-title">George's Builder Radar</h1>
              <p className="lede">
                A dense read on agents, repos, launches, and workflows that show
                proof. The feed comes first; the pitch stays small.
              </p>
            </div>
            <div className="mini-metrics" aria-label="Radar stats">
              <div className="metric">
                <strong>{feeds.length}</strong>
                <span>public feeds</span>
              </div>
              <div className="metric">
                <strong>5</strong>
                <span>source lanes</span>
              </div>
              <div className="metric">
                <strong>{selectedFeed.signals.length}</strong>
                <span>top signals today</span>
              </div>
            </div>
          </div>

          <div className="feed-grid">
            <aside className="catalog" id="catalog" aria-label="Feed catalog">
              <div className="catalog-head">
                <label className="search-control compact-search">
                  <SearchIcon />
                  <input
                    className="search"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search feeds"
                    type="search"
                    value={query}
                  />
                </label>
                <div className="filters compact-chips" aria-label="Catalog filters">
                  {laneFilters.map(([value, label]) => (
                    <button
                      aria-pressed={laneFilter === value}
                      className={`chip ${laneFilter === value ? "active" : ""}`}
                      key={value}
                      onClick={() => setLaneFilter(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="archive-list">
                {sortedFeeds.slice(0, 6).map((feed) => (
                  <a
                    className={`catalog-row ${feed.id === selectedFeed.id ? "active" : ""}`}
                    href={`/feeds/${feed.id}`}
                    key={feed.id}
                  >
                    <span className="date-tile">{feed.date.slice(8)}</span>
                    <span className="catalog-main">
                      <strong>{feed.date}</strong>
                      <small>{feed.summary}</small>
                    </span>
                  </a>
                ))}
              </div>
            </aside>

            <section className="feed-detail" id="signals" aria-labelledby="signals-title">
              <div className="detail-topline">
                <div>
                  <div className="eyebrow">{selectedFeed.date} latest feed</div>
                  <h2 id="signals-title">
                    {selectedFeed.title.replace("George's Builder Radar - ", "")}
                  </h2>
                </div>
                <div className="actions">
                  <a className="btn primary" href={`/feeds/${selectedFeed.id}`}>
                    Open feed
                  </a>
                  <button className="btn" onClick={() => copyFeed(selectedFeed)} type="button">
                    Copy markdown
                  </button>
                </div>
              </div>

              <div className="signals">
                {selectedFeed.signals.slice(0, 3).map((signal, index) => (
                  <article className="signal-row" key={`${selectedFeed.id}-${signal.title}`}>
                    <span className="rank">{index + 1}</span>
                    <div>
                      <h3>{signal.title}</h3>
                      <p>{signal.why}</p>
                    </div>
                    <div className="source-box">
                      <strong>Source</strong>
                      {firstUrl(signal.source) ? (
                        <a href={firstUrl(signal.source)}>Open receipt</a>
                      ) : (
                        "Source receipt in feed"
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="three-up">
                <section className="mini-panel">
                  <h3>X builder notes</h3>
                  <ul>
                    {selectedFeed.xNotes.slice(0, 2).map((item) => (
                      <li key={item.title}>
                        <LinkedItemTitle title={item.title} source={item.source} />
                        {item.description && <>: {item.description}</>}
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="mini-panel">
                  <h3>Repo radar</h3>
                  <ul>
                    {selectedFeed.repos.slice(0, 2).map((item) => (
                      <li key={item.title}>
                        <LinkedItemTitle title={item.title} source={item.source} />
                        {item.description && <>: {item.description}</>}
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="mini-panel">
                  <h3>Builder takeaways</h3>
                  <ul>
                    {selectedFeed.takeaways.slice(0, 2).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </section>
          </div>
        </div>

        <aside
          className="rail"
          id="skill"
          role="region"
          aria-label="Install and delivery utility rail"
        >
          <section className="utility-card" aria-labelledby="skill-title">
            <div className="eyebrow">Installable agent skill</div>
            <h2 id="skill-title">Use the radar inside your agent.</h2>
            <p>
              Unlock the install command, then ask your agent for a daily or weekly digest.
            </p>
            {leadUnlocked ? (
              <>
                <div className="command">{skillInstallCommand}</div>
                <div className="utility-actions">
                  <button className="btn primary" onClick={copySetupCommand} type="button">
                    {copiedCommand ? "Copied" : "Copy command"}
                  </button>
                  <a className="btn" href={skillRepoUrl}>
                    Star the repo
                  </a>
                </div>
              </>
            ) : (
              <form className="compact-form" onSubmit={submitLead}>
                <input name="name" aria-label="Name" autoComplete="name" placeholder="Name" required />
                <input
                  name="email"
                  type="email"
                  aria-label="Email"
                  autoComplete="email"
                  placeholder="Email"
                  required
                />
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="honeypot"
                />
                <button className="btn primary" disabled={leadStatus === "submitting"} type="submit">
                  {leadStatus === "submitting" ? "Unlocking..." : "Unlock command"}
                </button>
                {leadStatus === "error" && <p className="error">{leadError}</p>}
              </form>
            )}
          </section>

          <section className="utility-card">
            <div className="eyebrow">Digest shape</div>
            <h3>Delivery stays compact.</h3>
            <p>
              After install, ask your agent for a daily read, weekly rollup, or
              operator-tone summary. This choice belongs inside the skill, not on
              the public page.
            </p>
          </section>

          <section className="utility-card" id="sources">
            <div className="eyebrow">Source lanes</div>
            <div className="source-map">
              <div>
                <strong>X notes</strong>
                <span>builder posts</span>
              </div>
              <div>
                <strong>GitHub</strong>
                <span>repos and skills</span>
              </div>
              <div>
                <strong>Launches</strong>
                <span>PH and HN</span>
              </div>
              <div>
                <strong>Longform</strong>
                <span>queued context</span>
              </div>
            </div>
          </section>

          <section className="utility-card boundary">
            <h3>Public boundary</h3>
            <p>
              The archive shows public-safe feed content only. Private planning,
              journal, email, health, and calendar context stay out.
            </p>
          </section>
        </aside>
      </section>

      <section className="archive-section" id="full-archive" aria-labelledby="archive-title">
        <div className="archive-head">
          <div className="section-heading">
            <span>Archive</span>
            <h2 id="archive-title">Search the builder file</h2>
          </div>
          <p>
            Browse the public feed history from the morning routine without exposing
            private planning, journal, email, or health context.
          </p>
        </div>

        <div className="filters" aria-label="Archive filters">
          <label className="search-control">
            <SearchIcon />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search memory, MCP, agents, launch patterns..."
              type="search"
              value={query}
            />
          </label>
          <label>
            <span>Sort</span>
            <select
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              value={sortMode}
            >
              {sortOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="archive-meta">
          <span>
            {sortedFeeds.length} matching feeds
            {sortedFeeds.length > 0 ? ` / showing ${pageStart + 1}-${pageEnd}` : ""}
          </span>
        </div>

        <div className="archive-table" role="list">
          {visibleFeeds.map((feed) => (
            <a
              className="archive-row"
              href={`/feeds/${feed.id}`}
              key={feed.id}
            >
              <span className="rank mini">{feed.date.slice(8)}</span>
              <span className="archive-main">
                <strong>{feed.date}</strong>
                <small>{feed.summary}</small>
              </span>
              <span className="archive-chip">{feed.status}</span>
              <span className="heat">{feed.signals.length} signals</span>
            </a>
          ))}
        </div>
        {sortedFeeds.length > pageSize ? (
          <nav className="pagination" aria-label="Builder feed pagination">
            <button
              className="page-button"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              type="button"
            >
              Previous
            </button>
            <span className="page-status">
              Page {currentPage} of {pageCount}
            </span>
            <button
              className="page-button"
              disabled={currentPage === pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              type="button"
            >
              Next
            </button>
          </nav>
        ) : null}
      </section>

      <section className="submit-section" id="submit" aria-labelledby="submit-title">
        <div>
          <div className="section-heading">
            <span>Submit</span>
            <h2 id="submit-title">Found a builder signal worth tracking?</h2>
          </div>
          <p>
            Send a repo, launch, post, podcast, or source request. Public submissions
            go to the shared public queue; private notes go to George's private intake.
          </p>
        </div>
        <form className="submit-form" onSubmit={handleSubmitSignal}>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="honeypot" />
          <div className="segmented" role="group" aria-label="Submission type">
            {submissionTypes.map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="submissionType"
                  value={value}
                  checked={submissionType === value}
                  onChange={() => setSubmissionType(value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <input name="title" placeholder="Short title" required />
          <textarea
            name="outcome"
            placeholder="Why does this belong on Builder Radar?"
            required
            rows={3}
          />
          <textarea
            name="notes"
            placeholder="Drop the signal, context, source notes, or rough explanation."
            required
            rows={4}
          />
          <input name="context" placeholder="Link or source" />
          <input name="handle" placeholder="Your handle, optional" />
          <fieldset>
            <legend>Visibility</legend>
            <label>
              <input type="radio" name="visibility" value="public" defaultChecked />
              Public issue
            </label>
            <label>
              <input type="radio" name="visibility" value="private" />
              Private review
            </label>
          </fieldset>
          <button className="primary" type="submit" disabled={formStatus === "submitting"}>
            <SendIcon />
            {formStatus === "submitting" ? "Sending..." : "Submit signal"}
          </button>
          {formStatus === "success" && <p className="success">Signal sent for review.</p>}
          {formStatus === "error" && <p className="error">{error}</p>}
        </form>
      </section>

      <footer className="footer">
        <span>George's Builder Radar</span>
        <span>Public builder signals, edited for agents and humans.</span>
      </footer>

      <div className={`toast ${notice !== "idle" ? "is-visible" : ""}`} role="status">
        {notice === "copied" && "Feed copied."}
        {notice === "submitted" && "Signal submitted for review."}
      </div>
    </main>
  );
}
