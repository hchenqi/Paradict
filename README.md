# Paradict

Paradict is a multilingual dictionary organized around language-neutral concepts. A concept groups entries that express the same meaning in different languages.

The database is seeded with PanLex dataset and supports crowdsourcing. Registered users can submit edit proposals, and admins/editors review and apply them to the database.

The current implementation includes a Next.js web application and a browser extension bundled by Turborepo.

## Getting Started

### Workspace Structure

The workspace is initialized as a Turborepo monorepo including the subfolders:

```text
apps/
  web/                 Next.js web app
  extension/           browser extension
scripts/
  panlex/              Python and DuckDB scripts for processing the PanLex dataset
  schema.sql           complete database schema with functions and RLS policies
data/                  processed PanLex dataset files
```

### Requirements

- Python and DuckDB for loading and processing PanLex dataset
- Node.js with npm for local dev and build
- A Supabase project for database connection and authentication

### Supabase Setup

1. Create a Supabase project.
2. Run [`scripts/schema.sql`](scripts/schema.sql) in the Supabase SQL Editor.
3. Copy [`apps/web/.env.example`](apps/web/.env.example) to `apps/web/.env.local`.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the project values.

### PanLex Dataset

1. Generate importable tables from the PanLex dataset. (See [`scripts/panlex/README.md`](scripts/panlex/README.md) for instructions)
2. Import the generated `*_final.tsv` in Supabase.

### Local Development

```sh
npm install
npm run dev
```

### Browser Extension

1. Start the web app
2. Load [`apps/extension`](apps/extension) as an unpacked extension in Chrome or another Chromium browser.

## Design

### Database Schema

The following tables are defined: (See [`scripts/schema.sql`](scripts/schema.sql) for reference)
- `languages`: identity `id` and unique ISO language code.
- `concepts`: identity `id` for a language-neutral meaning.
- `entries`: a unique row per (concept, language, text) with an `indexed` flag and timestamps.
- `users`: one row per Supabase Auth user, with `member`, `editor`, or `admin` role, username/display name, and selected language IDs.
- `submissions`: authenticated community proposals for language and concept changes, with JSON payload, status, and timestamps.

### User Roles

- **Member** can sign in, save language preferences and submit proposals.
- **Editor** can review and apply submissions.
- **Admin** can delete submissions and change user roles.

### Submissions

Possible proposals can be:
- concept creation
- concept updates with entry additions/updates/deletions
- concept merges

Proposals are stored as JSON edit payloads with reviewer and timestamp. Direct dictionary writes are not exposed as a public API.

### API

All endpoints are served by Next.js under `/api` and return JSON.

| Method and path                                   | Purpose                                                    | Access |
| ------------------------------------------------- | ---------------------------------------------------------- | ------ |
| `GET /api/languages`                              | List available languages.                                  | Public |
| `GET /api/dictionary/search?q=&languages=&limit=` | Search concepts from text filtered by selected languages.  | Public |
| `GET /api/concepts/:id?languages=`                | Return one concept filtered by selected languages.         | Public |
| `GET /api/me`                                     | Return the current user profile.                           | Member |
| `PATCH /api/me`                                   | Update display name, username, and selected language IDs.  | Member |
| `DELETE /api/me`                                  | Delete the current Auth account and profile.               | Member |
| `GET /api/submissions?page=&pageSize=&status=`    | Paginate submissions.                                      | Member |
| `POST /api/submissions`                           | Create a submission.                                       | Member |
| `POST /api/submissions/:id/review`                | Approve or reject a submission and apply approved changes. | Editor |
| `DELETE /api/submissions/:id`                     | Delete a submission.                                       | Admin  |
| `PATCH /api/users/:username/role`                 | Change a user's role.                                      | Admin  |

### Pages

- `/`: home page with dictionary search and concept cards.
- `/concepts`: concept detail.
- `/submissions`: authenticated proposal editors plus the public moderation queue.
- `/account`: edits profile fields and deletes the current account.
- `/users/:username`: public profile view and admin role editor.
- `/login`: Supabase password sign-in and sign-up form.
- `/about`, `/contact`, and `/impressum`: informational and legal pages.

### UI Components

- `LanguageSelector`: chooses available languages, reorders selected languages, and toggles active search languages.
- `SelectionSearch`: a pop up next to current selection that searches for selected text.
- `AuthStatus`: shows sign-in, sign-up, account, and sign-out controls.
- `ConceptEditor` and `LanguageEditor`: build validated concept and language proposal payloads.
- `SubmissionList`: paginates proposals, shows previews/raw JSON, and exposes editor/admin review/delete actions.
- `CookieConsent`: displays the session-cookie notice.
