# Club membership and the noticeboard

The static Join page calls one same-origin Vercel Function, `/api/club`. A visitor chooses a nickname and confirms the age requirement and rules. The browser creates a 160-bit random member pass. Returning members paste this pass to sign in. The database keeps a SHA-256 digest of the pass and of each session token. Sessions use a secure HTTP-only cookie and expire after 30 days. Members should save their pass in a password manager. There is no email-based account recovery.

New notes go to an editorial queue. Guests can read the latest 20 approved notes. Signed-in members can see their own 10 most recent pending notes. Avoid posting contact details or material you do not have permission to share. The account handle credits a contributor. A memory can be published as a recollection. A proposed correction to a hall or atlas entry still needs a source and an editorial change to that entry.

## Preview setup

Use the Vercel project with `site/` as its root and a separate Postgres database for each environment. In the preview database, run `db/001-club.sql` once as the owner, create a dedicated login named `club_web` with a generated secret, then apply `db/web-grants.sql`. The web login has no privilege to approve a note. Put its Neon connection string in the sensitive Vercel variable `CLUB_DATABASE_URL` scoped to the appropriate preview. Redeploy the preview after setting it. Production needs its own database and environment value before merging or announcing signup. No secrets belong in source control.

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
