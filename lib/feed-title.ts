export function displayFeedTitle(title: string, date: string, fallback?: string) {
  const normalized = title
    .replace(/^George's Builder Radar -\s*/, "")
    .replace(/^George's Builder Radar\s*:\s*/, "")
    .trim();

  if (normalized && normalized !== date) return normalized;
  return fallback || "Daily builder signal brief";
}
