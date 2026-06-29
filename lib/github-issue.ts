import type { BuilderSubmission } from "./submission-schema";

const sourceRepo = "george-builder-radar";

const typeLabels: Record<BuilderSubmission["submissionType"], string> = {
  "submit-signal": "type:submit-signal",
  "request-source": "type:request-source",
  "improve-feed": "type:improve-feed",
};

const typeTitles: Record<BuilderSubmission["submissionType"], string> = {
  "submit-signal": "Submit signal",
  "request-source": "Request source",
  "improve-feed": "Improve feed",
};

function compactTitle(input: string) {
  const singleLine = input.replace(/\s+/g, " ").trim();
  return singleLine.length > 78 ? `${singleLine.slice(0, 75)}...` : singleLine;
}

export function issueTitle(submission: BuilderSubmission) {
  return `[george-builder-radar:${submission.submissionType}] ${compactTitle(submission.title)}`;
}

export function issueLabels(submission: BuilderSubmission) {
  return [
    sourceRepo,
    `source-repo:${sourceRepo}`,
    "status:needs-triage",
    typeLabels[submission.submissionType],
    `visibility:${submission.visibility}`,
  ];
}

export function issueBody(submission: BuilderSubmission) {
  const handle = submission.handle || "_Anonymous / not provided_";
  const context = submission.context || "_Not provided_";
  const visibility =
    submission.visibility === "private" ? "Private review issue" : "Public GitHub issue";

  return [
    "## George's Builder Radar submission",
    "",
    `**Type:** ${typeTitles[submission.submissionType]}`,
    `**Source repo:** ${sourceRepo}`,
    `**Visibility:** ${visibility}`,
    `**Handle:** ${handle}`,
    "",
    "## Signal or source",
    "",
    submission.title,
    "",
    "## Why this belongs",
    "",
    submission.outcome,
    "",
    "## Rough note or context",
    "",
    submission.notes,
    "",
    "## Link or source",
    "",
    context,
    "",
    "## Triage checklist",
    "",
    "- [ ] Check whether this is already in the public feed archive",
    "- [ ] Verify the source link and public-safe framing",
    "- [ ] Decide whether it belongs in X notes, repo radar, launch radar, or takeaways",
    "- [ ] Add source receipts before publishing",
  ].join("\n");
}

export async function createGitHubIssue(submission: BuilderSubmission) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo =
    submission.visibility === "private"
      ? process.env.GITHUB_PRIVATE_REPO
      : process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error("Missing GitHub issue environment configuration.");
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": process.env.GITHUB_API_VERSION || "2022-11-28",
      },
      body: JSON.stringify({
        title: issueTitle(submission),
        body: issueBody(submission),
        labels: issueLabels(submission),
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub issue creation failed: ${response.status} ${body}`);
  }

  return (await response.json()) as { html_url: string; number: number };
}
