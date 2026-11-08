# Paradict

Paradict is a multilingual dictionary organized around language-neutral concepts. A concept groups entries in different languages that express the same meaning.

The database is seeded with PanLex dataset and supports continued crowdsourcing. Registered users can submit proposals to create or update a concept, and editors review and merge them in the database.

The current implementation includes a Next.js web application under Turborepo.

## Getting Started

### Workspace Structure

The workspace is initialized as a Turborepo monorepo including the subfolders:

```text
apps/
  web/                 Next.js web app
scripts/
  panlex/              Python and DuckDB scripts for processing the PanLex dataset
  schema.sql           complete database schema with functions and RLS policies
data/                  locally processed PanLex dataset files
```

### Requirements

- Python and DuckDB for loading and processing PanLex dataset
- Node.js with npm for local dev and build
- A Supabase project for database connection and authentication

### Supabase Setup

1. Create a Supabase project.
2. Run [`scripts/schema.sql`](scripts/schema.sql) in the Supabase SQL Editor. The `idx_entries_expr_trgm` index statement is commented out for bulk import; create it after importing the dataset.
3. Copy [`apps/web/.env.example`](apps/web/.env.example) to `apps/web/.env.local`.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the project values. Replace the `LEGAL_INFO_*` examples with current operator and project details before launch.
5. Run `npx supabase gen types typescript --project-id "the-project-id" --schema public > database.types.ts` then copy the generated file to `apps/web/lib/database.types.ts`.
6. Optionally run `ALTER ROLE anon SET statement_timeout = '30s'; ALTER ROLE authenticated SET statement_timeout = '30s'; NOTIFY pgrst, 'reload config';` to increase the query timeout.

### PanLex Dataset Process

(See [`scripts/panlex/README.md`](scripts/panlex/README.md) for instructions)

### Daily Backup

The [Daily backup workflow](.github/workflows/backup.yml) exports `public.concepts`, `public.languages`, and `public.entries` as TSV files inside one dated `.tar.gz` archive each day at 01:00 UTC. Artifacts are retained for 10 days. The workflow also displays row counts in the summary, and can be started manually from the Actions tab.

Add a repository Actions secret named `SUPABASE_DB_URL` containing the Supabase PostgreSQL connection string (with SSL enabled) for the project.

### Local Development

```sh
npm install
npm run dev
```

## Design

### Database Schema (See [`scripts/schema.sql`](scripts/schema.sql) for reference)

The core tables:
- `concepts`: identity `id` for a language-neutral meaning.
- `languages`: identity `id` and unique ISO language code.
- `entries`: identity `id` for a unique `(concept, lang, expr)` tuple.

The `users` and `submissions` tables:
- `users`: one row per Supabase Auth user, with `member`, `editor`, or `admin` role and username/display name.
- `submissions`: authenticated community proposals for concept create/update/delete operations, with JSON payload, status, and timestamps.

### User Roles

- **Member** can sign in and view and submit proposals.
- **Editor** can commit changes directly or review and atomically apply submissions.
- **Admin** can delete submissions and change user roles.

### Submissions

Possible proposals can contain a list of:
- concept creation
- concept updates with entry creations/removals
- concept deletion

Proposals are stored as JSON payloads. Reviewers can commit or reject a submission. Creators can update their own pending submissions. A reviewer can also commit a submission after edit, which creates a replacement submission and rejects the original in one transaction.

### API

All endpoints are served by Next.js under `/api` and return JSON. They can be used by brower extension or other clients.

#### `GET /api/languages`

Get list of all languages as language code strings.

### Pages

#### `/explore`

Displays daily random concepts.

Home page `/` redirects to `/explore`.

#### `/search?q=&lang=`

Displays search result of a query text filtered by given languages.

#### `/concept/[id]`

Displays a concept's entries grouped by languages, filtered by the language view mode. In edit mode, displays parallel concept panels for creating, updating, or deleting concepts.

#### `/concept/create`

Creates a new concept.

#### `/login`

Sign-in and sign-up form.

#### `/account`

Edits profile fields and deletes the current account.

#### `/user/[username]`

Public profile view and admin role editor.

#### `/submissions`

The queue of submitted proposals.

### UI Components

#### `LanguageSelector`

Displays all available languages, chooses and reorders selected languages, and toggles active languages for displaying and searching.

A page including `LanguageSelector` updates the active languages the same list as the search parameter `lang`.

#### `ConceptCard`

Displays a concept with its entries grouped by languages.

#### `ConceptEdit`

Displays a concept with editable entries and submits the edits.

#### `SubmissionList`

Displays proposals and exposes editor/admin review/delete actions.

#### `SelectionSearch`

A pop up button next to current selection that searches the selected text.

#### `AuthStatus`

Shows sign-in, sign-up, account, and sign-out controls.

#### `CookieConsent`

Displays the session-cookie notice.
