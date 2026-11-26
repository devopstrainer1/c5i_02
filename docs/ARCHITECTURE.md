# Architecture Overview

PipelineFlow is a small kanban board built with Next.js. In the training framing
(see `CLAUDE.md`) each card is a loan or claims case moving through a pipeline.
The code still uses generic "issue" naming.

| Status key    | Label       | Training-framing meaning |
|---------------|-------------|--------------------------|
| `backlog`     | Backlog     | Submitted                |
| `todo`        | Todo        | Document Review          |
| `in_progress` | In Progress | Underwriting             |
| `done`        | Done        | Decisioned               |

## Technology

- Next.js 15 (App Router) serves both the UI and the REST API.
- React 19 (client components), TypeScript (`strict`), path alias `@/*` -> repo root.
- `@dnd-kit` (core, sortable, utilities) for drag and drop.
- Plain CSS in `app/globals.css`.
- Storage: an in-memory `Map` (`lib/store.ts`). Data resets on server restart.
  There is no database and none should be added.

## Dependencies

- Runtime: `next`, `react`, `react-dom`, `@dnd-kit/core`, `@dnd-kit/sortable`,
  `@dnd-kit/utilities`.
- Dev: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`.
- Scripts: `dev`, `build`, `start`, `typecheck`.
- No test runner or linter is configured. `CLAUDE.md` says to set up vitest when
  a task needs verification, and to call out new dependencies in the PR.

## Layout

```
app/
  layout.tsx, page.tsx, globals.css
  api/issues/route.ts                    GET list, POST create
  api/issues/[id]/route.ts               GET, PATCH, DELETE
  api/columns/[status]/reorder/route.ts  PUT reorder (also moves between columns)
components/
  Board.tsx      stateful container: fetching, drag handlers, add form
  Column.tsx     droppable column with a sortable list
  IssueCard.tsx  draggable card with a status <select>
lib/
  types.ts       Status, Issue, STATUSES (single source of truth for statuses)
  store.ts       IssueStore singleton (Map<string, Issue>)
```

## Request flow

```
Board.tsx --fetch--> app/api/**/route.ts --> lib/store.ts (in-memory Map)
```

Route handlers are thin: parse JSON, call the store, return JSON.
The store is cached on `globalThis` so dev hot-reloads keep the data.

## Data model

`Issue`: `id` (UUID), `title`, `description`, `status`, `order`, `createdAt`.
Cards are sorted by `order` and grouped by `status` on the client.

## Business logic

- **Create:** requires a string `title`. Default status is `backlog`. The new card
  gets `order = max(order in column) + 1`. The UI always creates in `backlog`.
- **Status change via dropdown:** `PATCH /api/issues/:id {status}`. If the status
  changes and no `order` is sent, the card goes to the end of the new column.
- **Drag and drop:** `handleDragOver` optimistically moves the card between
  columns. `handleDragEnd` computes the final order and calls
  `PUT /api/columns/:status/reorder {orderedIds}`. The server sets `status` and
  `order = index` for each id.
- No workflow rules: any card can move to any status. No auth, users, or audit trail.

## Known gaps

1. Status is not validated on the server. `CLAUDE.md` says never to write or
   accept a status outside `STATUSES`, but `POST`, `PATCH` and the reorder route
   accept arbitrary values.
2. `PATCH` applies the whole request body to the issue, so `id` and `createdAt`
   can be overwritten.
3. Malformed JSON is not handled, and `title` is not trimmed or length-limited.
4. Client `fetch` failures are not caught, and updates are optimistic, so the UI
   can drift from the server.
5. The in-memory store only works for a single server instance.
6. `README.md` still says "Issue Tracker" and recommends bun, but the repo uses
   `package-lock.json` (npm).

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
```
