# Club membership and the noticeboard

The static Join page calls one same-origin Vercel Function, `/api/club`. A visitor chooses a nickname and confirms the age requirement and rules. The browser creates a 160-bit random member pass. Returning members paste this pass to sign in. The database keeps a SHA-256 digest of the pass and of each session token. Sessions use a secure HTTP-only cookie and expire after 30 days. Members should save their pass in a password manager. There is no email-based account recovery.

New notes go to an editorial queue. Guests can read the latest 20 approved notes. Signed-in members can see their own 10 most recent pending notes. Avoid posting contact details or material you do not have permission to share. The account handle credits a contributor. A memory can be published as a recollection. A proposed correction to a hall or atlas entry still needs a source and an editorial change to that entry.

## Membership environments

| Environment | Neon project and branch | Vercel variable |
| --- | --- | --- |
| Preview | `22-crack-shot` / `preview` | `CLUB_DATABASE_URL`, Preview scope |
| Production | `22-crack-shot-production` / `production` | `CLUB_DATABASE_URL`, Production scope |

Both projects use database `club`. Each has its own `club_web` login and generated password. The application role can submit notes. An editor approves them separately. Vercel stores each connection as a sensitive value. Keep the credentials out of Git.

Both databases already have the initial schema. For a new empty environment, run `db/001-club.sql` once as the database owner, create a login named `club_web` with a generated secret, and apply `db/web-grants.sql`. The production database was initialized empty. The production credential was checked with a transaction that exercised member, session, note, and quota writes and rolled back its test records.

## Review notes

Use the database owner's SQL editor to read the queue.

```sql
SELECT n.id, n.topic, m.nickname, n.body, n.created_at
FROM club_note n JOIN club_member m ON m.id = n.member_id
WHERE n.approved_at IS NULL ORDER BY n.created_at;
```

Approve one reviewed note by replacing the placeholder with its UUID.

```sql
UPDATE club_note SET approved_at = now()
WHERE id = '<reviewed-note-uuid>' AND approved_at IS NULL;
```

A session-IP quota allows 10 signup or 80 sign-in attempts per UTC day. Notes have a separate five-per-member limit. The quota stores a keyed daily digest. Expired quota entries and sessions are pruned on the next quota check.

## Local verification

From the repository root, install both dependency sets and run the integration tests.

```sh
npm ci --prefix site
npm ci --prefix tests/club
npm test --prefix tests/club
```

These tests use an in-memory Postgres engine, the checked-in schema and grants, the production Neon driver, and the real HTTP handler. They do not require a hosted database or credentials.
