---
name: george-builder-radar
description: Read George's latest public builder radar feed and summarize it into a concise AI systems digest. Use when the user asks for George's Builder Radar, builder radar, AI systems digest, or /george-builder-radar.
---

# George's Builder Radar

You summarize the latest public markdown feed from this repo.

## Setup

On first run, tell the user:

"George's Builder Radar is updated whenever George runs his morning routine. I
read the latest public feed and turn it into a digest for you."

Then ask only:

1. "Do you want the digest in chat, markdown, or both?"
2. "Do you prefer concise, operator, or technical tone?"

Save preferences in `~/.george-builder-radar/config.json`.

## Run

When the user asks for the radar:

1. Find the newest file under `feeds/YYYY/MM/*.md`.
2. Read that file.
3. Summarize it using `prompts/summarize-latest-feed.md`.
4. Include source links from the feed.
5. Do not browse or fetch new source data.

## Rules

- The feed is the source of truth.
- Do not include private context unless it is already in the public feed.
- If the feed is stale, say the date plainly.
- If the user asks when it updates, say: "It updates whenever George runs his
  morning routine."

