export const submissionTypes = [
  "submit-signal",
  "request-source",
  "improve-feed",
] as const;

export const visibilityModes = ["public", "private"] as const;

export type BuilderSubmissionType = (typeof submissionTypes)[number];
export type VisibilityMode = (typeof visibilityModes)[number];

export type BuilderSubmission = {
  submissionType: BuilderSubmissionType;
  visibility: VisibilityMode;
  title: string;
  outcome: string;
  notes: string;
  context: string;
  handle: string;
  website: string;
};

export type BuilderSubmissionIssues = Partial<
  Record<keyof BuilderSubmission, string[]>
>;

type ParseResult =
  | { success: true; data: BuilderSubmission }
  | { success: false; issues: BuilderSubmissionIssues };

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function choice<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
): T[number] {
  return allowed.includes(value as T[number]) ? (value as T[number]) : fallback;
}

function addIssue(
  issues: BuilderSubmissionIssues,
  field: keyof BuilderSubmission,
  message: string,
) {
  issues[field] = [...(issues[field] || []), message];
}

export function parseBuilderSubmission(payload: unknown): ParseResult {
  const input =
    typeof payload === "object" && payload !== null
      ? payload as Record<string, unknown>
      : {};
  const data: BuilderSubmission = {
    submissionType: choice(input.submissionType, submissionTypes, "submit-signal"),
    visibility: choice(input.visibility, visibilityModes, "public"),
    title: text(input.title),
    outcome: text(input.outcome),
    notes: text(input.notes),
    context: text(input.context),
    handle: text(input.handle),
    website: text(input.website),
  };
  const issues: BuilderSubmissionIssues = {};

  if (data.title.length < 4) {
    addIssue(issues, "title", "Write at least 4 characters for the title.");
  }
  if (data.title.length > 140) {
    addIssue(issues, "title", "Keep the title under 140 characters.");
  }
  if (data.outcome.length < 10) {
    addIssue(issues, "outcome", "Write at least 10 characters for why this belongs on Builder Radar.");
  }
  if (data.outcome.length > 1200) {
    addIssue(issues, "outcome", "Keep the reason under 1200 characters.");
  }
  if (data.notes.length < 10) {
    addIssue(issues, "notes", "Write at least 10 characters for the rough note.");
  }
  if (data.notes.length > 2500) {
    addIssue(issues, "notes", "Keep the note under 2500 characters.");
  }
  if (data.context.length > 1000) {
    addIssue(issues, "context", "Keep the context under 1000 characters.");
  }
  if (data.handle.length > 120) {
    addIssue(issues, "handle", "Keep the handle under 120 characters.");
  }
  if (data.website.length > 0) {
    addIssue(issues, "website", "Leave this field empty.");
  }

  return Object.keys(issues).length > 0
    ? { success: false, issues }
    : { success: true, data };
}
