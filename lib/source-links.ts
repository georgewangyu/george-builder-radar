const urlPattern = /https?:\/\/[^\s),]+/g;

export function extractUrls(input: string) {
  return Array.from(new Set(input.match(urlPattern) || []));
}

export function firstUrl(...inputs: string[]) {
  for (const input of inputs) {
    const [url] = extractUrls(input);
    if (url) return url;
  }

  return "";
}

export function displaySourceLabel(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "github.com") {
      const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
      return owner && repo ? `${owner}/${repo}` : parsed.hostname;
    }

    if (parsed.hostname === "x.com") {
      const [handle] = parsed.pathname.split("/").filter(Boolean);
      return handle ? `x.com/${handle}` : parsed.hostname;
    }

    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
