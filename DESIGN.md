---
version: "alpha"
name: "George Builder Radar"
description: "Public builder-signal feed using George Design Language research-desk mode."
mode: "research-desk"
source: "../george-design-language/modes/research-desk.DESIGN.md"
colors:
  primary: "#6B5CE7"
  primary_strong: "#5147A9"
  primary_soft: "#EEE9FF"
  ink: "#161615"
  muted: "#5F625C"
  page: "#ECE9DF"
  paper: "#FFFDF7"
  surface: "#FFFFFF"
  line: "#D6CEBD"
  signal: "#D6B95A"
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
- compact install/request affordances
- a source-to-signal-to-receipt proof path

The first screen should not be a large marketing hero. The feed and proof
surface are the hero. The title must stay compact enough that visitors can see
current signals without scrolling on normal desktop viewports.

## Layout

- Feed items should preserve source, date, why it matters, and next action.
- Detail pages should make individual sources easy to inspect without
  overwhelming the feed.
- Search/archive views should feel dense but calm.
- Lead capture belongs near the installable-skill pitch, not as an oversized
  newsletter form in the hero.
- Use URL-driven visual samples for review when needed:
  - `/` for compact signal desk
  - `/?design=proof` for operator proof board
  - `/?design=editorial` for editorial reference desk

## Typography And Color

- Use George Research Desk tokens as the baseline.
- Use the SnackVoice purple-blue family for primary actions and active states.
- Brass signal yellow is reserved for small highlights.
- Avoid all-dark or all-beige treatments.

## Do

- Keep source links visible.
- Make public/private boundaries explicit.
- Preserve the daily/weekly digest path.
- Explain that email unlocks the install command, while automated delivery
  happens through the skill and the user's agent/runtime.

## Do Not

- Leak morning-routine private context.
- Turn the page into a launch-news clone.
- Use generic AI gradients or decorative glow.
- Let cards nest inside other cards.
- Present email delivery as the main product until the email digest workflow is
  implemented and verified.
