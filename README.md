# PipelineFlow

A minimal kanban board built with Next.js. In the training framing (see
[`CLAUDE.md`](CLAUDE.md)) every card is a **loan or claims case** moving through
a pipeline, and case data is treated as regulated. The code still uses the
generic name "issue" for a case.

Data is stored in memory only and **resets whenever the server restarts**.

## Statuses

| Status key    | Label       | Training-framing meaning |
|---------------|-------------|--------------------------|
| `backlog`     | Backlog     | Submitted                |
| `todo`        | Todo        | Document Review          |
| `in_progress` | In Progress | Underwriting             |
| `done`        | Done        | Decisioned               |

`STATUSES` in [`lib/types.ts`](lib/types.ts) is the single source of truth. Never
write or accept any other `status` value.

## Quick start

Requires Node.js 18.18 or newer (the minimum for Next.js 15) and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| Script              | Purpose                    |
|---------------------|----------------------------|
| `npm run dev`       | Start the dev server       |
| `npm run build`     | Production build           |
| `npm start`         | Serve the production build |
| `npm run typecheck` | Run `tsc --noEmit`         |

## Project layout

```
app/          App Router pages and REST API routes (app/api/**)
components/   Board (state, drag and drop), Column, IssueCard
lib/          types.ts (Status, Issue, STATUSES) and store.ts (in-memory Map)
docs/         ARCHITECTURE.md
```

Request flow: `components/Board.tsx` calls `fetch` on `app/api/**/route.ts`,
which calls `lib/store.ts`. For the data model, business logic and known gaps,
read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## API

All bodies are JSON. Errors have the shape `{ "error": "message" }`.
`status` must be one of `backlog`, `todo`, `in_progress`, `done`.

| Method and path                     | Body                                          | Responses                         |
|-------------------------------------|-----------------------------------------------|-----------------------------------|
| `GET /api/issues`                   | none                                          | `200` list, sorted by `order`     |
| `POST /api/issues`                  | `{ title, description?, status? }`            | `201` created, `400` no title     |
| `GET /api/issues/:id`               | none                                          | `200`, `404`                      |
| `PATCH /api/issues/:id`             | `{ title?, description?, status?, order? }`   | `200`, `404`                      |
| `DELETE /api/issues/:id`            | none                                          | `204`, `404`                      |
| `PUT /api/columns/:status/reorder`  | `{ orderedIds: string[] }`                    | `200` column, `400` bad body      |

New cases default to `backlog`. Changing a case's status without sending `order`
puts it at the end of the new column. `PUT .../reorder` also moves the listed
cases into that column.

```bash
curl -X POST localhost:3000/api/issues \
  -H 'Content-Type: application/json' \
  -d '{"title":"Loan #1042"}'
```

## Contributor rules

- No database. Storage stays in the in-memory `Map` in `lib/store.ts`.
- Call out any new third-party dependency in the PR description.
- Only the four `STATUSES` keys are valid statuses.
- Run the test command before declaring a task complete.

## Testing

No test runner is configured yet. If a task needs verification, set up a minimal
vitest setup as part of that task and say so in the PR description. Until then,
use `npm run typecheck`.

## Known limitations

- Data is lost on restart, and the store works for a single server instance only.
- No authentication, users or audit trail, and no workflow rules (any card can
  move to any status).
- The API does not yet validate `status` (despite the rule above). `PATCH` also
  lets a request overwrite `id` and `createdAt`, and malformed JSON is not
  handled. See "Known gaps" in `docs/ARCHITECTURE.md`.
