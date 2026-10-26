# ☕ Punchcard

Digital stamp cards for small businesses. The shop shows a QR code at the counter, the customer scans it with their phone camera and gets a stamp. Fill the card, get the reward.

Built in about an hour with Claude Code as a take-home exercise. It's a deliberately minimal take on an idea I'm working on separately.

## How it works

1. **Owner** signs up, creates a stamp card ("10 stamps for a free coffee") and leaves the *My business* page open on a tablet at the counter. It shows a QR code.
2. **Customer** scans it, signs in (or signs up), and taps *Collect my stamp*.
3. The code is now used up and the counter shows a new one within ~2 seconds, so a photo of the QR code can't be reused.
4. When a card fills up, the customer gets a reward. The owner sees it in the customer list and taps *Redeem* when handing it over.

## Run it

Requires Node 24 and pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

No database, Docker or accounts needed: SQLite lives in `data/punchcard.db` and is migrated on startup. To try the scan flow alone, open the QR link under the code in a private window and sign up as a second user.

| Command | |
| --- | --- |
| `pnpm lint` / `pnpm typecheck` | ESLint, TypeScript |
| `pnpm test` | Vitest: domain logic against an in-memory SQLite |
| `pnpm test:e2e` | Builds, then Playwright runs the full owner + customer flow on port 3100 with its own database |
| `pnpm db:generate --name <name>` | New migration after editing `src/db/schema.ts` |

Configuration is in [.env.example](.env.example). In production, `BETTER_AUTH_SECRET` is required; the app refuses to serve auth without it.

## Layout

```
src/
  db/              schema.ts (Drizzle) and the connection, which runs migrations
  server/
    loyalty.ts     all domain logic: plain functions, tested directly
    session.ts     requireUser / requireBusiness
    actions/       thin server actions: check the session, call loyalty.ts
  app/             pages: / , /login, /business, /scan/[token], /cards, /api/qr
e2e/               Playwright spec
drizzle/           SQL migrations
```

## Choices

- **Next.js App Router + server actions.** One deployable, no separate API to keep in sync, and it's the stack I'm fastest in.
- **SQLite via Drizzle.** Zero setup locally and in CI. Typed queries and generated migrations, so moving to Postgres later is a dialect change and not a rewrite.
- **Better Auth, email + password.** Real sessions and password hashing without writing them myself. OAuth was skipped because it needs provider accounts just to run the app.
- **Single-use tokens are the core rule**, so that's where the care went. A claim is a conditional `UPDATE … WHERE used_at IS NULL` inside a transaction. Collecting needs a button tap, so link previews and prefetchers can't burn a token. Owners can't stamp their own card.
- **Business data is always looked up from the session** (owner → business), never from an id the client sends. Redeeming checks the reward belongs to the owner's business.
- **Tests where the risk is.** Vitest covers the rules (single use, rewards, redemption scoping, open-redirect guard). One Playwright test covers the whole two-user flow. No component unit tests.
- **CI/CD (GitHub Actions):** lint, typecheck, unit tests, build and e2e on every push and PR. On `main`, a Docker image is published to GHCR.
- **Prerendering turned off** (`cacheComponents: false`). Every page depends on the signed-in user, so a static shell gains little.

## Deliberately left out

- **Anonymous first scan.** The ideal flow gives a stamp with no sign-up at all. That means guest accounts and merging them later, which is more than an hour's work.
- **Deployment.** The image is built and published; running it needs a host, a persistent volume and a secret. Next step: Fly.io or Railway with a volume, or Postgres for multiple instances.
- **Staff accounts, multiple locations, token expiry, rate limiting and fraud alerts.** Token expiry and per-customer cooldowns are what I'd add first.
- **Live updates.** The counter polls every 2s. SSE would be nicer; polling is plenty for one counter.
- **Email verification and password reset.** Both need an email provider.
- **i18n, dark mode, accessibility audit, analytics.**

## How AI was used

Built with Claude Code in one session; the commit history is that session. I set the scope and constraints up front (stack, SQLite for zero-setup CI, password auth instead of OAuth, single-use tokens as the critical rule). Claude wrote most of the code and tests, and I reviewed each step. Places where the plan changed along the way:

- The Next 16.4 scaffold enables `cacheComponents`, which failed the build as soon as pages read the session. Rather than wrapping every page in `<Suspense>`, we turned it off: per-user pages gain nothing from a static shell.
- `output: "standalone"` for a slimmer image conflicted with `next start` in the e2e run. Dropped it: a bigger image is fine at this size.
- Domain tests were written before the implementation and cover the token rules. The e2e test caught an ambiguous form label.
