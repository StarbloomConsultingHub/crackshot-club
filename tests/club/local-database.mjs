import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const requireSite = createRequire(new URL('../../site/package.json', import.meta.url));
const driver = await import(pathToFileURL(requireSite.resolve('@neondatabase/serverless').replace(/index\.js$/, 'index.mjs')));

export async function openLocalDatabase() {
  const db = new PGlite();
  const schema = await readFile(new URL('../../db/001-club.sql', import.meta.url), 'utf8');
  const grants = await readFile(new URL('../../db/web-grants.sql', import.meta.url), 'utf8');
  await db.exec(schema);
  await db.exec('CREATE ROLE club_web LOGIN');
  await db.exec(grants);
  process.env.CLUB_DATABASE_URL = 'postgresql://test:test@preview.invalid/club';
  // Use the production driver and real SQL. Replace only its HTTPS transport.
  driver.neonConfig.fetchFunction = async (_url, options) => {
    const payload = JSON.parse(options.body);
    const batch = Boolean(payload.queries);
    try {
      const results = await db.transaction(async tx => {
        await tx.exec('SET LOCAL ROLE club_web');
        const output = [];
        for (const { query, params } of payload.queries || [payload]) {
          const result = await tx.query(query, params, { rowMode: 'array' });
          output.push({ fields: result.fields, rows: result.rows });
        }
        return output;
      });
      return Response.json(batch ? { results } : results[0]);
    } catch (error) {
      return Response.json({ message: error.message }, { status: 400 });
    }
  };
  return db;
}
