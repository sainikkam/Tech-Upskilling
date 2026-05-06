# AI Engineer Upskilling Platform — Full Project Context

## What this is

A full-stack web application that takes you from zero to industry-grade AI engineer through AI-powered quizzes, spaced repetition, and weakness analysis. The focus is deep **conceptual understanding** — not syntax — across four tracks:

- 🧮 Data Structures & Algorithms
- 🧠 Machine Learning
- ⚡ AI Engineering (LLMs, RAG, Agents)
- 🏗️ System Design

Built to evolve from V1 to V3 without rewriting — no throwaway code.

---

## How to run locally

### Prerequisites
- Node.js (installed via Homebrew: `brew install node`)
- A Supabase account and project
- A Google AI Studio API key

### One-time setup

**1. Get your Google AI key**
- Go to **aistudio.google.com/app/apikey**
- Click "Create API key" → copy it (starts with `AIza...`)

**2. Set up Supabase**
- Go to **supabase.com** → New project → wait ~2 min
- Click "SQL Editor" in the left sidebar
- Open `supabase/schema.sql` in this folder, copy all text, paste into SQL Editor, click Run
- Go to **Project Settings → Data API** → copy:
  - **Project URL** → looks like `https://xxxx.supabase.co` *(not the browser URL)*
  - **anon public** key → long string starting with `eyJ...`

**3. Create `.env.local`**
```
cd /Users/sainikkam/Tech-Upskilling
cp .env.example .env.local
open -e .env.local
```
Fill in and save:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
GOOGLE_API_KEY=AIza...
```

**4. Install dependencies and run**
```
cd /Users/sainikkam/Tech-Upskilling
npm install
npm run dev
```
Open **http://localhost:3000**

### Starting the app on future sessions
```
cd /Users/sainikkam/Tech-Upskilling
npm run dev
```
Then go to **http://localhost:3000** — stop with `Control + C`.

### Common errors
| Error | Cause | Fix |
|---|---|---|
| "Failed to fetch" on sign up | Supabase URL is wrong | Check `.env.local` — URL must be `https://xxxx.supabase.co`, not the dashboard browser URL |
| Policy already exists (SQL Editor) | Schema run twice | Safe — `schema.sql` uses `DROP POLICY IF EXISTS` so just re-run |
| `npm: command not found` | Terminal lost PATH | Close and reopen Terminal |
| Quiz/explanation fails | Google API key wrong | Check `GOOGLE_API_KEY` in `.env.local` |

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16 App Router + TypeScript | Full-stack in one codebase, API routes + React |
| Database + Auth | Supabase (Postgres) | Auth, database, row-level security out of the box |
| AI | Google Gemini 2.5 Flash | Built-in thinking = better quiz reasoning, cheap |
| Styling | Tailwind CSS v4 | Utility-first, no separate CSS files |
| Components | Custom (Radix UI primitives) | shadcn-style, no lock-in |
| Charts | Recharts | Radar chart for skills overview |
| Deployment | Vercel (not yet configured) | Zero-config Next.js deployment |

---

## Project structure

```
Tech-Upskilling/
├── src/
│   ├── app/                          # All pages and API routes (Next.js App Router)
│   │   ├── page.tsx                  # Landing page + sign in/sign up form
│   │   ├── layout.tsx                # Root HTML layout
│   │   ├── globals.css               # Global styles + prose styles for markdown
│   │   ├── (auth)/
│   │   │   └── callback/route.ts     # Supabase OAuth redirect handler
│   │   ├── (platform)/               # All authenticated pages (redirects to / if not logged in)
│   │   │   ├── layout.tsx            # Sidebar + main content layout
│   │   │   ├── dashboard/page.tsx    # Home screen with stats and recommendations
│   │   │   ├── learn/
│   │   │   │   ├── page.tsx          # All 4 tracks overview
│   │   │   │   └── [trackId]/
│   │   │   │       ├── page.tsx      # Topics + concepts list for a track
│   │   │   │       └── [conceptId]/page.tsx  # Concept lesson + AI explanation
│   │   │   ├── quiz/
│   │   │   │   ├── page.tsx          # Browse all quizzable concepts
│   │   │   │   └── [conceptId]/page.tsx     # Interactive quiz session
│   │   │   ├── review/page.tsx       # Spaced repetition review queue
│   │   │   └── analytics/page.tsx   # Radar chart + strengths/weaknesses
│   │   └── api/                      # Server-side API endpoints
│   │       ├── concepts/[conceptId]/explain/route.ts  # Generate + cache concept explanation
│   │       ├── quiz/
│   │       │   ├── generate/route.ts # Generate quiz questions via Gemini
│   │       │   └── submit/route.ts   # Score quiz, update mastery, schedule review
│   │       └── analytics/route.ts    # Aggregate mastery stats for analytics page
│   ├── components/
│   │   ├── ui/                       # Reusable UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── progress.tsx
│   │   │   └── tabs.tsx
│   │   └── layout/
│   │       └── sidebar.tsx           # Left nav with links + sign out
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── client.ts             # Gemini API wrapper (generateText, generateJSON)
│   │   │   └── prompts.ts            # All AI prompts stored as config — edit here, not in routes
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser-side Supabase client
│   │   │   └── server.ts             # Server-side Supabase client (for API routes + server components)
│   │   ├── curriculum/
│   │   │   └── index.ts              # Full curriculum data — all 40+ concepts live here
│   │   └── utils.ts                  # cn(), mastery labels, spaced repetition math
│   ├── types/
│   │   └── index.ts                  # All TypeScript types (Concept, QuizQuestion, etc.)
│   └── proxy.ts                      # Next.js 16 session refresh on every request
├── supabase/
│   └── schema.sql                    # Full database schema — run this in Supabase SQL Editor
├── .env.example                      # Template for environment variables (safe to commit)
├── .env.local                        # Your actual secrets (never committed to GitHub)
└── TECHSTACK.md                      # Original tech stack decision document
```

---

## How the key features were built

### Authentication
Supabase handles all of it. The landing page (`app/page.tsx`) calls `supabase.auth.signUp()` or `supabase.auth.signInWithPassword()` directly from the browser. After login, Supabase sets a cookie. Every protected page (`(platform)/layout.tsx`) calls `supabase.auth.getUser()` on the server — if no user, it redirects to `/`. The `proxy.ts` file refreshes the session cookie on every request so it never expires mid-session.

### Curriculum
Everything is static data in `src/lib/curriculum/index.ts`. No database table for concepts — they're just TypeScript objects. Each concept has: `id`, `title`, `description`, `difficulty`, `keyPoints[]`, and optional `prerequisites[]` (array of other concept IDs). The prerequisite system locks concepts until you've hit 40% mastery on all prerequisites.

### AI quiz generation
When you start a quiz (`api/quiz/generate/route.ts`):
1. It fetches your current mastery score for that concept from Supabase
2. Passes that score + the concept's key points to Gemini via `generateJSON()`
3. The prompt in `lib/ai/prompts.ts` tells Gemini to adjust difficulty based on mastery (beginner → test fundamentals, advanced → test edge cases)
4. Gemini returns structured JSON with 5 questions, 4 options each, correct answer index, and explanation
5. A quiz session row is created in Supabase and the questions are returned to the browser

### Quiz scoring + mastery update
When you submit answers (`api/quiz/submit/route.ts`):
1. Score is calculated (correct / total × 100)
2. New mastery = `score × 0.6 + previous_mastery × 0.4` — weighted toward recent performance
3. Next review date is calculated via spaced repetition (see below)
4. Gemini generates a short personalized feedback paragraph
5. All of this is written to `user_concept_progress` and `quiz_responses` in Supabase

### Spaced repetition
Implemented in `src/lib/utils.ts` (`calcNextReviewDate`):
- Score ≥ 80%: next review doubles each time (1 day → 2 → 4 → 8 → up to 30 days)
- Score 60–79%: review in 1 day
- Score < 60%: review in 4 hours
The review page reads `next_review_at` from Supabase and sorts by urgency.

### Concept explanations
When you open a concept page (`api/concepts/[conceptId]/explain/route.ts`):
1. Checks `concept_explanations` table in Supabase for a cached explanation
2. If found, returns it immediately (no API call)
3. If not, generates via Gemini using the structured prompt in `prompts.ts`
4. Caches the result so every subsequent view is instant
This means each concept only ever costs one Gemini API call total, ever.

### Analytics
`api/analytics/route.ts` reads all your progress rows and aggregates:
- Per-track average mastery
- Strong concepts (mastery ≥ 80)
- Weak concepts (mastery < 50 but studied)
- Day streak (consecutive days with completed quizzes)
The analytics page renders this with a Recharts radar chart.

### AI prompts as config
All prompts live in `src/lib/ai/prompts.ts` as a `PROMPTS` object. This is a deliberate architectural choice from the TECHSTACK.md — prompts should be editable without touching business logic or redeploying. To improve quiz quality, change `PROMPTS.GENERATE_QUIZ`. To change how explanations are structured, change `PROMPTS.EXPLAIN_CONCEPT`. Nothing else needs to touch.

---

## Database schema (what's stored and where)

All data lives in your Supabase project (Postgres database). Row Level Security (RLS) is enabled on all tables — users can only ever read/write their own data.

### `user_concept_progress`
One row per user per concept. Tracks mastery over time.
| Column | What it stores |
|---|---|
| `user_id` | Links to Supabase Auth user |
| `concept_id` | e.g. `"big-o-notation"` |
| `mastery_score` | 0–100, weighted average of quiz scores |
| `attempts` | Total number of quizzes taken on this concept |
| `last_attempted_at` | Timestamp of most recent quiz |
| `next_review_at` | When spaced repetition schedules next review |

### `quiz_sessions`
One row per quiz attempt.
| Column | What it stores |
|---|---|
| `user_id` | Who took it |
| `concept_id` | Which concept |
| `score` | Final percentage (0–100) |
| `correct_answers` | Count of correct answers |
| `completed_at` | When it was finished |

### `quiz_responses`
One row per question per quiz. Stores the full history of every question ever answered.
| Column | What it stores |
|---|---|
| `session_id` | Links to `quiz_sessions` |
| `question_text` | The full question string |
| `user_answer` | What you selected |
| `correct_answer` | What the right answer was |
| `is_correct` | Boolean |
| `explanation` | Gemini's explanation for that question |

### `concept_explanations`
One row per concept. Cache of AI-generated explanations.
| Column | What it stores |
|---|---|
| `concept_id` | e.g. `"attention-mechanism"` |
| `explanation` | Full markdown explanation from Gemini |
| `generated_at` | When it was first generated |

---

## Where your account data lives

Everything is permanently saved in **your Supabase project**. Nothing is stored locally — so your progress is safe even if you wipe your machine, as long as your Supabase project exists.

| What | Where in Supabase |
|---|---|
| Your login (email + password) | **Authentication → Users** — password is hashed, never plain text |
| Mastery score per concept | **Table Editor → user_concept_progress** |
| Every quiz you've taken | **Table Editor → quiz_sessions** |
| Every question you've answered | **Table Editor → quiz_responses** |
| AI-generated explanations (cached) | **Table Editor → concept_explanations** |

**To browse your data:**
1. Go to **supabase.com** → open your project
2. Click **"Table Editor"** in the left sidebar
3. Click any table to see your rows

**Note:** Right after creating your account, only Authentication → Users will have an entry. The other tables populate as you take quizzes and study concepts.

**Row Level Security (RLS)** is enabled on every table — meaning even if someone else had access to your Supabase project, the database enforces at the query level that each user can only ever read and write their own rows. This is not just app-level protection — it's enforced by the database itself.

---

## How to add a new concept

Open `src/lib/curriculum/index.ts`, find the right track and topic, and add an object to the `concepts` array:

```typescript
{
  id: 'your-concept-id',           // kebab-case, unique across all concepts
  topicId: 'parent-topic-id',
  trackId: 'dsa',                  // 'dsa' | 'ml' | 'ai-engineering' | 'system-design'
  title: 'Your Concept Title',
  description: 'One sentence description.',
  difficulty: 'intermediate',      // 'beginner' | 'intermediate' | 'advanced'
  order: 6,                        // position within the topic
  keyPoints: [
    'First key thing to understand',
    'Second key thing',
  ],
  prerequisites: ['other-concept-id'],  // optional
}
```

No database changes needed — concepts are static. The quiz system, explanations, and progress tracking all work automatically for any concept in this file.

---

## How to improve AI quality

Edit `src/lib/ai/prompts.ts`. The four prompts are:
- `PROMPTS.EXPLAIN_CONCEPT` — structure of concept explanation pages
- `PROMPTS.GENERATE_QUIZ` — how quiz questions are generated and calibrated
- `PROMPTS.QUIZ_FEEDBACK` — personalized feedback after a quiz
- `PROMPTS.ANALYZE_STRENGTHS` — strengths/weaknesses analysis

Changes take effect immediately on the next request — no restart needed (though cached explanations in Supabase won't regenerate unless you delete them from the `concept_explanations` table).

---

## Deployment (not yet done)

To deploy to Vercel:
1. Push to GitHub (already set up at `github.com/sainikkam/Tech-Upskilling`)
2. Go to **vercel.com** → "Add New Project" → import the repo
3. Add the three environment variables from `.env.local` in Vercel's project settings
4. Deploy — Vercel auto-deploys on every push to `main`
