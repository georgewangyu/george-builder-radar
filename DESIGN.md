---
version: "alpha"
name: "George Builder Radar"
description: "Public builder-signal feed using George Design Language research-desk mode."
mode: "research-desk"
source: "../george-design-language/modes/research-desk.DESIGN.md"
colors:
  primary: "#1457FF"
  ink: "#141414"
  muted: "#64615A"
  page: "#E9E4DC"
  paper: "#FBFAF6"
  surface: "#FFFFFF"
  line: "#D7D0C1"
  signal: "#D7FF55"
  green: "#176E45"
---

# George Builder Radar Design Contract

George Builder Radar should feel like a public signal desk for builders,
repos, launches, official updates, and longform sources from George's morning
routine. It is not a private daily journal or generic tech-news feed.

## First Screen

The first viewport should show:

- the Builder Radar name and builder-signal promise
- latest public feed items or feed-detail path
- source categories
- install/request affordances

## Layout

- Feed items should preserve source, date, why it matters, and next action.
- Detail pages should make individual sources easy to inspect without
  overwhelming the feed.
- Search/archive views should feel dense but calm.

## Typography And Color

- Use George Research Desk tokens as the baseline.
- Blue is the primary action/accent color.
- Signal yellow-green is reserved for small highlights.
- Avoid all-dark or all-beige treatments.

## Do

- Keep source links visible.
- Make public/private boundaries explicit.
- Preserve the daily/weekly digest path.

## Do Not

- Leak morning-routine private context.
- Turn the page into a launch-news clone.
- Use generic AI gradients or decorative glow.
- Let cards nest inside other cards.
