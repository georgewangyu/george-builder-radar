# George's Builder Radar

Follow builders who ship.

George's Builder Radar is a public AI systems digest from George's morning
routine. It tracks builders, repos, launches, official AI/devtool updates, and
podcasts, then publishes a polished markdown feed that your agent can summarize
or deliver.

It updates whenever George runs his morning routine. Private health, calendar,
journal, email, and raw planning context stay out.

## What You Get

A daily or weekly digest, delivered in chat or to your preferred channel, with:

- high-signal posts from curated X builder accounts
- GitHub repo trends and agent-system infrastructure
- Product Hunt, Launch YC, and Hacker News launch patterns
- official AI/devtool blog updates
- selected podcast and longform episodes
- source links for every item

## Quick Start

Install the skill:

```bash
mkdir -p ~/.codex/skills && git clone https://github.com/georgewangyu/george-builder-radar.git ~/.codex/skills/george-builder-radar
```

Then tell your agent:

```text
set up George's Builder Radar
```

The agent walks you through:

- daily or weekly schedule
- delivery time and timezone
- language: English, Chinese, or bilingual
- delivery: current chat, Telegram, email, or an OpenClaw channel

No X, GitHub, Product Hunt, YC, blog, or podcast API keys are required from
users. The public feed is already generated centrally. Users only need delivery
credentials if they choose Telegram or email outside OpenClaw.

## Delivery Options

### OpenClaw

OpenClaw can deliver to its configured channels:

- Telegram
- Telegram forum topics
- Feishu
- Discord
- Slack
- WhatsApp
- Signal

The skill creates an `openclaw cron add` job with an explicit `--channel` and
`--to` target.

### Claude Code, Codex, Cursor, or Other Agents

Without OpenClaw or another persistent runtime, automatic delivery is limited
to:

- Telegram through a user-owned Telegram bot
- email through a user-owned Resend API key
- on-demand in the current chat

For scheduled Telegram/email delivery, the skill installs a local `crontab`
entry that sends the latest public markdown feed. For a fully agent-remixed
digest, ask the skill in chat or use a persistent agent runtime.

## Changing Settings

Just tell your agent:

- "Switch to weekly digests on Monday mornings"
- "Change language to bilingual"
- "Send this to Telegram instead"
- "Make the digest shorter"
- "Show me my current settings"

Settings are saved locally in `~/.george-builder-radar/config.json`.
Delivery keys, if used, are saved locally in `~/.george-builder-radar/.env`.

## Customizing Summaries

The skill uses plain markdown prompts:

- [summarize-latest-feed.md](prompts/summarize-latest-feed.md)

Ask your agent to make the digest shorter, more technical, more operator-style,
or more action-oriented. It can copy prompts into
`~/.george-builder-radar/prompts/` for local customization.

## Sources

### X Accounts

People:
[George Wang](https://x.com/georgewangyu),
[Andrej Karpathy](https://x.com/karpathy),
[Peter Steinberger](https://x.com/steipete),
[Boris Cherny](https://x.com/bcherny),
[Gergely Orosz](https://x.com/GergelyOrosz),
[Henry Shi](https://x.com/henrythe9ths),
[Peter Yang](https://x.com/petergyang),
[Swyx](https://x.com/swyx),
[Pieter Levels](https://x.com/levelsio),
[Farza](https://x.com/farzatv),
[Paul Graham](https://x.com/paulg),
[Garry Tan](https://x.com/garrytan),
[Amjad Masad](https://x.com/amasad),
[Dan Shipper](https://x.com/danshipper),
[Cat Wu](https://x.com/_catwu),
[Nikunj Kothari](https://x.com/nikunj),
[Ryo Lu](https://x.com/ryolu_),
[Alex Albert](https://x.com/alexalbert__),
[Aakash Gupta](https://x.com/aakashgupta),
[Deedy Das](https://x.com/deedydas),
[Theo](https://x.com/theo),
[Rohan Paul](https://x.com/rohanpaul_ai).

Official/product accounts:
[OpenAI Developers](https://x.com/OpenAIDevs),
[Claude Developers](https://x.com/ClaudeDevs),
[Claude](https://x.com/claudeai),
[GitHub](https://x.com/github),
[GitHub Copilot](https://x.com/GitHubCopilot),
[Cursor](https://x.com/cursor_ai),
[AI SDK](https://x.com/aisdk),
[Replit](https://x.com/Replit).

See [sources/x-accounts.md](sources/x-accounts.md).

### Official Blogs

- [Anthropic Engineering](https://www.anthropic.com/engineering)
- [Claude Blog](https://claude.com/blog)
- [OpenAI News / Developers](https://openai.com/news/)
- [GitHub Blog / Copilot](https://github.blog/)
- [Cursor Blog](https://cursor.com/blog)
- [Vercel AI SDK](https://vercel.com/blog)
- [LangChain Blog](https://blog.langchain.com/)

See [sources/blogs.md](sources/blogs.md).

### Podcasts / Longform

- [The Pragmatic Engineer Podcast](https://newsletter.pragmaticengineer.com/podcast)
- [Latent Space](https://www.latent.space/podcast)
- [AI Engineer Podcast](https://www.aiengineeringpodcast.com/)
- [The Cognitive Revolution](https://www.cognitiverevolution.ai/latest/)
- [No Priors](https://www.nopriors.com/)
- [Lenny's Podcast](https://www.lennysnewsletter.com/podcast)

See [sources/podcasts.md](sources/podcasts.md).

### Launch Sources

- [Product Hunt](https://www.producthunt.com/)
- [Launch YC](https://www.ycombinator.com/launches)
- [Hacker News Launches](https://news.ycombinator.com/launches)
- [Hacker News Show HN](https://news.ycombinator.com/show)

See [sources/launches.md](sources/launches.md).

## How It Works

1. George runs his morning routine.
2. The public-safe Builder Radar feed is written to `feeds/YYYY/MM/YYYY-MM-DD.md`.
3. Your agent reads the latest feed and summarizes it using your preferences.
4. The digest is shown in chat or delivered to your configured channel.

## Privacy

- The repo contains only public-safe feed content.
- User delivery credentials stay local.
- The skill does not ask users for X, Product Hunt, GitHub, YC, blog, or podcast
  API keys.
- The skill does not read private George context.
