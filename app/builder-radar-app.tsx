"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { BuilderFeed } from "@/lib/builder-feeds";

type Props = {
  feeds: BuilderFeed[];
};

type SortMode = "latest" | "signals" | "title";
type Notice = "idle" | "copied" | "subscribed" | "submitted";
type FormStatus = "idle" | "submitting" | "success" | "error";

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
  const [selectedId, setSelectedId] = useState(latestFeed?.id || feeds[0]?.id);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [submissionType, setSubmissionType] = useState("submit-signal");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice>("idle");
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [leadStatus, setLeadStatus] = useState<FormStatus>("idle");
  const [leadUnlocked, setLeadUnlocked] = useState(false);
  const [leadError, setLeadError] = useState("");

  const selectedFeed =
    feeds.find((feed) => feed.id === selectedId) || latestFeed || feeds[0];

  const filteredFeeds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return feeds.filter((feed) => {
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

      return !normalizedQuery || haystack.includes(normalizedQuery);
    });
  }, [feeds, query]);

  const sortedFeeds = useMemo(
    () => sortFeeds(filteredFeeds, sortMode),
    [filteredFeeds, sortMode],
  );

  useEffect(() => {
    setLeadUnlocked(window.localStorage.getItem(leadStorageKey) === "true");
  }, []);

  function flash(nextNotice: Notice) {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice("idle"), 1800);
  }

  async function copyFeed(feed: BuilderFeed) {
    await navigator.clipboard.writeText(feed.markdown);
    flash("copied");
  }

  async function copySetupCommand() {
    await navigator.clipboard.writeText(skillInstallCommand);
    setCopiedCommand(true);
    window.setTimeout(() => setCopiedCommand(false), 1400);
  }

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    flash("subscribed");
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
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">GB</span>
          <span>Builder Radar</span>
        </a>
        <nav className="nav-links" aria-label="Page navigation">
          <a href="#today">Today</a>
          <a href="#signals">Signals</a>
          <a href="#archive">Archive</a>
          <a href="#skill">Skill</a>
          <a href="#submit">Submit</a>
        </nav>
        <a className="primary nav-cta" href="#subscribe">
          Get the digest
        </a>
      </header>

      <section className="hero" id="today" aria-labelledby="page-title">
        <div className="hero-copy">
          <h1 id="page-title">George's Builder Radar</h1>
          <p className="hero-line">
            Public builder signals from George's morning sweep of agents, repos,
            launches, tools, and workflows.
          </p>
          <form className="subscribe-form" id="subscribe" onSubmit={handleSubscribe}>
            <label className="sr-only" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" placeholder="you@example.com" type="email" required />
            <button className="primary" type="submit">
              <SendIcon />
              Send me the digest
            </button>
          </form>
          <div className="quick-stats" aria-label="Radar contents">
            <span>{feeds.length} public feeds</span>
            <span>X / GitHub / PH / YC / blogs</span>
            <span>Agent systems and devtools</span>
          </div>
        </div>

        <section className="daily-board" id="signals" aria-labelledby="signals-title">
          <div className="section-heading">
            <span>{selectedFeed.date}</span>
            <h2 id="signals-title">Top signals</h2>
          </div>
          <div className="top-five-list">
            {selectedFeed.signals.slice(0, 5).map((signal, index) => (
              <button
                className="top-five-row is-active"
                key={`${selectedFeed.id}-${signal.title}`}
                type="button"
              >
                <span className="rank">{index + 1}</span>
                <span className="thumb-cell" aria-hidden="true">
                  SIG
                </span>
                <span className="row-main">
                  <strong>{signal.title}</strong>
                  <small>{signal.why}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      </section>

      <section className="feature-detail" aria-label="Selected builder feed">
        <div className="poster-tile">
          <span>Feed</span>
          <strong>{selectedFeed.date.slice(8)}</strong>
          <small>{selectedFeed.status}</small>
        </div>
        <article className="detail-copy">
          <div className="detail-meta">
            <span>{selectedFeed.date}</span>
            <span>{selectedFeed.status}</span>
            <span>{selectedFeed.signals.length} signals</span>
          </div>
          <h2>{selectedFeed.title.replace("George's Builder Radar - ", "")}</h2>
          <p>{selectedFeed.summary}</p>
          <blockquote>
            {selectedFeed.takeaways[0] ||
              selectedFeed.signals[0]?.title ||
              "Follow builders who ship."}
          </blockquote>
          <div className="why-box">
            <span>Why builders should care</span>
            <p>
              The feed turns public launch noise into a compact operating read:
              what is moving, what is reusable, and which workflows deserve a closer look.
            </p>
          </div>
          <div className="tag-row">
            <span>agents</span>
            <span>repos</span>
            <span>launches</span>
            <span>workflow receipts</span>
          </div>
        </article>
        <div className="detail-actions">
          <button className="icon-button" onClick={() => copyFeed(selectedFeed)} type="button">
            <CopyIcon />
            <span>Copy</span>
          </button>
          <a className="icon-button" href="#submit">
            <SendIcon />
            <span>Send a signal</span>
          </a>
        </div>
      </section>

      <section className="agent-setup" id="skill" aria-labelledby="skill-title">
        <div>
          <div className="section-heading">
            <span>Agent skill</span>
            <h2 id="skill-title">Use George's Builder Radar in your agent.</h2>
          </div>
          <p>
            Install the skill to summarize the latest feed, set up scheduled delivery,
            or turn the archive into an operator-style digest.
          </p>
        </div>
        {leadUnlocked ? (
          <div className="setup-command">
            <code>{skillInstallCommand}</code>
            <div className="setup-actions">
              <button className="primary" onClick={copySetupCommand} type="button">
                {copiedCommand ? "Copied" : "Copy command"}
              </button>
              <a href={skillRepoUrl}>Star the repo</a>
            </div>
            <p>Star Builder Radar to save it and support the project.</p>
          </div>
        ) : (
          <form className="unlock-form" onSubmit={submitLead}>
            <label>
              Name
              <input name="name" autoComplete="name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="honeypot" />
            <button className="primary" disabled={leadStatus === "submitting"} type="submit">
              <SendIcon />
              {leadStatus === "submitting" ? "Unlocking..." : "Unlock install command"}
            </button>
            <p>Unlocks the skill command and occasional updates. No spam.</p>
            {leadStatus === "error" && <p className="error">{leadError}</p>}
          </form>
        )}
      </section>

      <section className="archive-section" id="archive" aria-labelledby="archive-title">
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

        <div className="archive-table" role="list">
          {sortedFeeds.map((feed) => (
            <button
              className="archive-row"
              key={feed.id}
              onClick={() => setSelectedId(feed.id)}
              role="listitem"
              type="button"
            >
              <span className="rank mini">{feed.date.slice(8)}</span>
              <span className="archive-main">
                <strong>{feed.date}</strong>
                <small>{feed.summary}</small>
              </span>
              <span className="archive-chip">{feed.status}</span>
              <span className="heat">{feed.signals.length} signals</span>
            </button>
          ))}
        </div>
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
        {notice === "subscribed" && "You are on the Builder Radar digest list."}
        {notice === "submitted" && "Signal submitted for review."}
      </div>
    </main>
  );
}
