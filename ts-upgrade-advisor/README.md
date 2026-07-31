# TS Upgrade Advisor

AI-powered upgrade impact analyzer for ThoughtSpot Embedded (TSE) customers.

Detects breaking changes, deprecated SDK properties, and CSS variable impacts between cluster versions — based on **your actual embed code**, not generic changelogs.

## What it does

1. You paste embed code, upload a file, or point it at a GitHub URL
2. You select your current cluster version and upgrade target
3. It fetches the live ThoughtSpot SDK changelog and release notes
4. Claude analyses your specific code and identifies **only what affects your implementation**
5. You get a prioritised impact report + a ready-to-send email for your dev team

### Three analysis layers
- 🔴 **Breaking changes** — things that will stop working immediately
- 🟡 **Deprecations** — things that still work but need fixing before the next upgrade  
- 🔵 **CSS variable changes** — critical for white-label / custom-styled embeds

## Getting started

### Prerequisites
- Node.js 18+
- An Anthropic API key ([get one here](https://console.anthropic.com/settings/keys))

### Local development

```bash
git clone https://github.com/charlie-lennox-ts/ts-upgrade-advisor
cd ts-upgrade-advisor
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/charlie-lennox-ts/ts-upgrade-advisor)

No environment variables needed — users bring their own Anthropic API key via the Settings panel.

## Architecture

- **Next.js 14** (App Router)
- **API route** (`/api/analyze`) — fetches live TS docs, calls Claude with customer's own API key
- **No backend database** (Phase 1) — API key stored in browser localStorage only
- **Customer's API key** is sent directly to Anthropic, never logged or stored server-side

## Privacy

Embed code is sent directly to Anthropic's API using the customer's own key. This service does not log, store, or transmit embed code to any third party.

## Roadmap

- [ ] Phase 2: Supabase auth + analysis history
- [ ] Phase 2: Issue resolution tracking (resolved analyses become AI context)
- [ ] Multi-file analysis
- [ ] REST API changelog analysis (not just SDK)
- [ ] Slack notification integration

## Contributing

Built for ThoughtSpot TSE customers. Issues and PRs welcome.
