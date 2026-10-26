<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Punchcard

See README.md for what this is and the layout. Rules that matter:

- Domain logic lives in `src/server/loyalty.ts` as plain functions; server actions in `src/server/actions/` only check the session and call it.
- Look up business data from the session (`requireBusiness`), never from an id sent by the client.
- QR tokens are single-use: keep the conditional update inside the transaction, and cover changes with a test in `loyalty.test.ts`.
- Schema changes: edit `src/db/schema.ts`, then `pnpm db:generate --name <name>`. Never edit a committed migration.
- Before pushing: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`.
