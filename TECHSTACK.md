# Tech Stack — Modern SaaS (Solo Founder)

## Framework
- **Next.js (App Router) + TypeScript** — full-stack, frontend + API routes in one codebase

## Database & Auth
- **Supabase** — Postgres + auth (email/password + OAuth) + file storage + real-time
  - Enable Row Level Security (RLS) from day one
  - Design full schema upfront even if V1 uses a subset

## Deployment
- **Vercel** — zero-config Next.js deployment, auto preview deploys, free SSL

## Payments
- **Stripe** — billing, subscriptions, one-time purchases

## AI
- **Anthropic Claude API** (Sonnet model) — best cost/quality tradeoff for generative features
  - Store prompts in a config layer, never hardcoded — iterate without redeploying

## Email (Transactional)
- **Resend** — simplest Next.js integration for confirmation/notification emails

## Analytics
- **PostHog** — user behavior, funnel tracking, feature flags; free tier sufficient for early stages

## UI
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — accessible component primitives, no lock-in

## Scaffolding
- **v0.dev** — AI-generated component scaffolds; deploy before touching code

---

## Prototype / Early Auth Backend (pre-Next.js)
If validating before committing to Next.js:

| Layer | Tech |
|---|---|
| Runtime | Node.js ≥22.5 |
| Framework | Express 4 |
| Database | SQLite (`node:sqlite` built-in) |
| Auth | bcryptjs + jsonwebtoken |
| Email | Nodemailer |

---

## Key Principles
- **No throwaway code** — V1 stack should evolve into V3, not get rewritten
- **RLS in DB layer** — not in app code
- **Mobile-first** — 50%+ traffic from phones on social-driven products
- **AI prompts as config** — decouple prompt iteration from deploys
