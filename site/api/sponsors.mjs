import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { campaigns, contactEmail } from '../lib/sponsor-config.mjs';
import { placements, selectCampaign, validEmail } from '../lib/sponsors.mjs';

const sign = body => createHmac('sha256', process.env.CLUB_DATABASE_URL).update('sponsor-impression:' + body).digest('base64url');
const metricsEnabled = () => process.env.SPONSOR_METRICS_ENABLED === 'true' && Boolean(process.env.CLUB_DATABASE_URL);

function issueToken(campaign, placement, now) {
  const body = Buffer.from(JSON.stringify({ campaign, placement, id: randomUUID(), expires: now + 10 * 60 * 1000 })).toString('base64url');
  return body + '.' + sign(body);
}

function readToken(token, now) {
  if (typeof token !== 'string' || token.length > 1024) return null;
  const [body, mac, extra] = token.split('.');
  if (!body || !mac || extra) return null;
  const expected = Buffer.from(sign(body));
  const provided = Buffer.from(mac);
  if (provided.length !== expected.length || !timingSafeEqual(expected, provided)) return null;
  try {
    const value = JSON.parse(Buffer.from(body, 'base64url').toString());
    return Number.isFinite(value.expires) && value.expires > now ? value : null;
  } catch { return null; }
}

// Exported factory lets integration tests use dated fixtures without editing live campaigns.
export function createSponsorHandler({ inventory = campaigns, email = contactEmail, clock = Date.now } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const now = clock();
    if (req.method === 'GET') {
      const placement = new URL(req.url, 'https://club.invalid').searchParams.get('placement');
      if (!placements.includes(placement)) return res.status(400).json({ error: 'Unknown placement.' });
      const result = selectCampaign(inventory, placement, now);
      return res.json({ ...result, contactEmail: validEmail(email) ? email : null,
        token: result.campaign && metricsEnabled() ? issueToken(result.campaign.id, placement, now) : null });
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Use GET or POST.' });
    }
    const host = req.headers.host;
    const loopback = !process.env.VERCEL && /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host || '');
    if (!host || (req.headers.origin !== 'https://' + host && !(loopback && req.headers.origin === 'http://' + host))) {
      return res.status(403).json({ error: 'Same-origin requests only.' });
    }
    if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') return res.status(415).json({ error: 'Use JSON.' });
    if (!metricsEnabled()) return res.status(204).end();
    const token = readToken(req.body?.token, now);
    if (!token || selectCampaign(inventory, token.placement, now).campaign?.id !== token.campaign) {
      return res.status(400).json({ error: 'Expired or invalid impression.' });
    }
    // No raw IP, member identity, user agent, referrer or browsing history is stored.
    const hour = new Date(now).toISOString().slice(0, 13);
    const ip = String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const bucket = createHmac('sha256', process.env.CLUB_DATABASE_URL).update(['sponsor-quota', hour, ip].join('|')).digest('hex');
    const day = new Date(now).toISOString().slice(0, 10);
    try {
      const sql = neon(process.env.CLUB_DATABASE_URL);
      const [, , rows] = await sql.transaction([
        sql`DELETE FROM sponsor_impression_seen WHERE expires_at <= now()`,
        sql`DELETE FROM sponsor_quota WHERE expires_at <= now()`,
        sql`WITH quota AS (
          INSERT INTO sponsor_quota (bucket, hits, expires_at) VALUES (${bucket}, 1, now() + interval '2 hours')
          ON CONFLICT (bucket) DO UPDATE SET hits = sponsor_quota.hits + 1
          WHERE sponsor_quota.hits < 120 RETURNING bucket
        ), accepted AS (
          INSERT INTO sponsor_impression_seen (id, expires_at)
          SELECT ${token.id}::uuid, now() + interval '1 day' FROM quota
          ON CONFLICT (id) DO NOTHING RETURNING id
        )
        INSERT INTO sponsor_daily (day, campaign_id, placement, impressions)
        SELECT ${day}::date, ${token.campaign}, ${token.placement}, 1 FROM accepted
        ON CONFLICT (day, campaign_id, placement) DO UPDATE SET impressions = sponsor_daily.impressions + 1
        RETURNING impressions`
      ]);
      return res.status(rows.length ? 201 : 204).end();
    } catch {
      // A metrics outage never removes a valid sponsor from the page.
      return res.status(503).json({ error: 'Impression reporting is unavailable.' });
    }
  };
}

export default createSponsorHandler();
