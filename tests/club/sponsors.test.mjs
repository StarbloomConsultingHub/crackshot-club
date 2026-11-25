import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSponsorHandler } from '../../site/api/sponsors.mjs';
import { campaigns, contactEmail } from '../../site/lib/sponsor-config.mjs';
import { selectCampaign, validCampaign, validEmail } from '../../site/lib/sponsors.mjs';
import { openLocalDatabase } from './local-database.mjs';

const start = Date.parse('2026-12-01T00:00:00Z');
let now = start;
const campaign = { id: 'test-community', enabled: true, name: 'Community partner', headline: 'Support a shared collection',
  description: 'An approved message.', url: 'https://example.org/about', linkLabel: 'About the supporter',
  startsAt: '2026-12-01T00:00:00Z', endsAt: '2026-12-02T00:00:00Z', priority: 10, placements: ['home'] };
const handler = createSponsorHandler({ inventory: [campaign], email: 'club@example.org', clock: () => now });
let db;

before(async () => {
  db = await openLocalDatabase();
  await db.exec(await readFile(new URL('../../db/002-sponsors.sql', import.meta.url), 'utf8'));
  process.env.SPONSOR_METRICS_ENABLED = 'true';
});
after(async () => { delete process.env.SPONSOR_METRICS_ENABLED; await db?.close(); });

async function call(body, options = {}) {
  const req = { method: body ? 'POST' : 'GET', url: '/api/sponsors?placement=home',
    headers: { host: 'club.example', origin: 'https://club.example', 'content-type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.45', ...options.headers }, body,
    ...Object.fromEntries(Object.entries(options).filter(([key]) => key !== 'headers')) };
  const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; },
    json(data) { this.data = data; }, end() { this.ended = true; } };
  await handler(req, res);
  return res;
}

test('checked-in campaigns have unique IDs, valid fields and existing local artwork', async () => {
  assert.equal(new Set(campaigns.map(c => c.id)).size, campaigns.length);
  assert(!contactEmail || validEmail(contactEmail));
  for (const item of campaigns) {
    assert(validCampaign(item), item.id);
    if (item.image) assert((await readFile(new URL('../../site' + item.image, import.meta.url))).length > 0);
  }
});

test('bookings honor exact boundaries, priorities, invalid inputs and future starts', () => {
  assert.equal(selectCampaign([campaign], 'home', start - 1).campaign, null);
  assert.equal(selectCampaign([campaign], 'home', start - 1).refreshAfterMs, 1);
  assert.equal(selectCampaign([campaign], 'home', start).campaign.id, campaign.id);
  assert.equal(selectCampaign([campaign], 'home', Date.parse(campaign.endsAt)).campaign, null);
  assert.equal(selectCampaign([campaign], 'gallery-hall', start).campaign, null);
  for (const change of [{ id: 42 }, { enabled: false }, { url: 'javascript:alert(1)' }, { image: '//outside.example/banner.jpg' },
    { startsAt: '2026-12-01' }, { endsAt: 'invalid' }, { priority: 'high' }, { placements: ['unknown'] }]) {
    assert.equal(selectCampaign([{ ...campaign, ...change }], 'home', start).campaign, null);
  }
  assert.equal(selectCampaign([campaign, { ...campaign, id: 'higher', priority: 20 }], 'home', start).campaign.id, 'higher');
  assert.equal(selectCampaign([campaign, { ...campaign, id: 'alphabetical' }], 'home', start).campaign.id, 'alphabetical');
  assert.equal(validEmail('hello@example.org\r\nBcc:other@example.org'), false);
});

test('display works without metrics or database access and rejects unsupported requests', async () => {
  delete process.env.SPONSOR_METRICS_ENABLED;
  const result = await call();
  assert.equal(result.data.campaign.id, campaign.id);
  assert.equal(result.data.contactEmail, 'club@example.org');
  assert.equal(result.data.token, null);
  assert.equal(result.headers['Cache-Control'], 'private, no-store');
  assert.equal((await call({ token: 'ignored' })).code, 204);
  assert.equal((await call(null, { method: 'DELETE' })).code, 405);
  assert.equal((await call(null, { url: '/api/sponsors?placement=unknown' })).code, 400);
  process.env.SPONSOR_METRICS_ENABLED = 'true';
});

test('real SQL counts a signed impression once and never exposes aggregate reports', async () => {
  const { token } = (await call()).data;
  assert.equal((await call({ token })).code, 201);
  assert.equal((await call({ token })).code, 204);
  const rows = await db.query('SELECT campaign_id, placement, impressions FROM sponsor_daily');
  assert.equal(rows.rows.length, 1);
  assert.equal(Number(rows.rows[0].impressions), 1);
  assert.equal(rows.rows[0].campaign_id, campaign.id);
  assert.equal((await call()).data.impressions, undefined);
  assert.equal((await db.query('SELECT id FROM sponsor_impression_seen')).rows.length, 1);
  await assert.rejects(db.transaction(async tx => {
    await tx.exec('SET LOCAL ROLE club_web');
    await tx.query('DELETE FROM sponsor_daily');
  }), /permission denied/);
});

test('untrusted origins, malformed/tampered tokens and expired bookings cannot increment', async () => {
  const { token } = (await call()).data;
  assert.equal((await call({ token }, { headers: { origin: 'https://elsewhere.example' } })).code, 403);
  assert.equal((await call({ token }, { headers: { 'content-type': 'text/plain' } })).code, 415);
  assert.equal((await call({ token: token + 'changed' })).code, 400);
  assert.equal((await call({ token: null })).code, 400);
  now += 10 * 60 * 1000;
  assert.equal((await call({ token })).code, 400);
  now = Date.parse(campaign.endsAt) - 1;
  const last = (await call()).data.token;
  now++;
  assert.equal((await call({ token: last })).code, 400);
  assert.equal((await call()).data.campaign, null);
  now = start;
});

test('hourly quota, expired-row cleanup and database failures behave predictably', async () => {
  const headers = { 'x-vercel-forwarded-for': '203.0.113.99' };
  const { token } = (await call()).data;
  assert.equal((await call({ token }, { headers })).code, 201);
  await db.exec('UPDATE sponsor_quota SET hits = 120');
  const fresh = (await call()).data.token;
  assert.equal((await call({ token: fresh }, { headers })).code, 204);
  await db.exec("UPDATE sponsor_quota SET expires_at = now() - interval '1 day'; UPDATE sponsor_impression_seen SET expires_at = now() - interval '1 day'");
  assert.equal((await call({ token: fresh }, { headers })).code, 201);
  assert.equal((await db.query('SELECT id FROM sponsor_impression_seen')).rows.length, 1);
  await db.exec('ALTER TABLE sponsor_daily RENAME TO sponsor_daily_unavailable');
  assert.equal((await call({ token: (await call()).data.token })).code, 503);
  assert.equal((await call()).data.campaign.id, campaign.id);
  await db.exec('ALTER TABLE sponsor_daily_unavailable RENAME TO sponsor_daily');
});
