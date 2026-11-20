import { createHash, createHmac, randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const cookieName = '__Host-cs_session';
const topics = new Set(['Introduction', 'Gallery memory', 'Research lead']);
const digest = value => createHash('sha256').update(value).digest('hex');
const cookie = (token, seconds) =>
  `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${seconds}`;

function sessionHash(req) {
  const token = (req.headers.cookie || '').split(/;\s*/)
    .find(item => item.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? digest(token) : null;
}

async function claimQuota(sql, scope, identity, limit) {
  const day = new Date().toISOString().slice(0, 10);
  const key = createHmac('sha256', process.env.CLUB_DATABASE_URL)
    .update([day, scope, identity].join('|')).digest('hex');
  const [, , rows] = await sql.transaction([
    sql`DELETE FROM club_quota WHERE expires_at <= now()`,
    sql`DELETE FROM club_session WHERE expires_at <= now()`,
    sql`INSERT INTO club_quota (bucket, hits, expires_at)
        VALUES (${key}, 1, now() + interval '1 day')
        ON CONFLICT (bucket) DO UPDATE SET hits = club_quota.hits + 1
        WHERE club_quota.hits < ${limit} RETURNING hits`
  ]);
  return rows.length > 0;
}

async function memberFor(sql, hash) {
  if (!hash) return null;
  const [member] = await sql`SELECT m.id, m.nickname FROM club_session s
    JOIN club_member m ON m.id = s.member_id
    WHERE s.token_hash = ${hash} AND s.expires_at > now()`;
  return member || null;
}

async function readBoard(sql, req, res) {
  const member = await memberFor(sql, sessionHash(req));
  const [notes, pending] = await Promise.all([
    sql`SELECT m.nickname, n.topic, n.body, n.approved_at AS published
        FROM club_note n JOIN club_member m ON m.id = n.member_id
        WHERE n.approved_at IS NOT NULL ORDER BY n.approved_at DESC, n.id LIMIT 20`,
    member ? sql`SELECT topic, body FROM club_note WHERE member_id = ${member.id}
      AND approved_at IS NULL ORDER BY created_at DESC LIMIT 10` : []
  ]);
  return res.json({ member: member?.nickname ?? null, notes, pending });
}

async function enterClub(sql, req, res, data) {
  const joining = data.action === 'join';
  const pass = typeof data.pass === 'string' ? data.pass.trim().toUpperCase() : '';
  if (!/^CS(?:-[0-9A-F]{8}){5}$/.test(pass)) {
    return res.status(400).json({ error: 'Enter the complete member pass, including CS and the dashes.' });
  }
  const nickname = typeof data.nickname === 'string' ? data.nickname.trim() : '';
  if (joining && (data.accepted !== true || nickname.length < 2 || nickname.length > 40 || /[\u0000-\u001F\u007F]/u.test(nickname))) {
    return res.status(400).json({ error: 'Choose a nickname of 2–40 characters and confirm the club rules and age requirement.' });
  }
  const ip = String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!await claimQuota(sql, data.action, ip, joining ? 10 : 80)) {
    return res.status(429).json({ error: 'The daily sign-in or signup limit has been reached. Try again tomorrow.' });
  }
  const hash = digest(pass);
  const token = randomBytes(32).toString('hex');
  const queries = [];
  if (joining) queries.push(sql`INSERT INTO club_member (nickname, pass_hash) VALUES (${nickname}, ${hash})
    ON CONFLICT (pass_hash) DO NOTHING`);
  queries.push(sql`INSERT INTO club_session (token_hash, member_id)
    SELECT ${digest(token)}, id FROM club_member WHERE pass_hash = ${hash} RETURNING member_id`);
  const results = await sql.transaction(queries);
  if (!results.at(-1).length) return res.status(401).json({ error: 'That member pass was not recognized.' });
  res.setHeader('Set-Cookie', cookie(token, 30 * 86400));
  return res.status(200).json({ ok: true });
}

async function submitNote(sql, req, res, data) {
  const member = await memberFor(sql, sessionHash(req));
  if (!member) return res.status(401).json({ error: 'Sign in to send a note.' });
  const body = typeof data.body === 'string' ? data.body.trim() : '';
  const validId = typeof data.id === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(data.id);
  if (!validId || !topics.has(data.topic) || body.length < 10 || body.length > 1200 || body.includes('\0')) {
    return res.status(400).json({ error: 'Choose a topic and write a note of 10–1,200 characters.' });
  }
  const [existing] = await sql`SELECT id FROM club_note WHERE id = ${data.id} AND member_id = ${member.id}`;
  if (existing) return res.json({ ok: true });
  if (!await claimQuota(sql, 'note', member.id, 5)) {
    return res.status(429).json({ error: 'You have sent five notes today. You can send another tomorrow.' });
  }
  const rows = await sql`INSERT INTO club_note (id, member_id, topic, body)
    VALUES (${data.id}, ${member.id}, ${data.topic}, ${body}) ON CONFLICT (id) DO NOTHING RETURNING id`;
  if (!rows.length) {
    const own = await sql`SELECT id FROM club_note WHERE id = ${data.id} AND member_id = ${member.id}`;
    if (!own.length) return res.status(409).json({ error: 'This note could not be saved. Reload and try again.' });
  }
  return res.json({ ok: true });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Use GET or POST.' });
  }
  if (req.method === 'POST') {
    const host = req.headers.host;
    const loopback = !process.env.VERCEL && /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host || '');
    const validOrigin = host && (req.headers.origin === 'https://' + host || (loopback && req.headers.origin === 'http://' + host));
    if (!validOrigin) {
      return res.status(403).json({ error: 'Open the club page to continue.' });
    }
    if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
      return res.status(415).json({ error: 'Use a JSON request.' });
    }
  }
  try {
    const sql = neon(process.env.CLUB_DATABASE_URL);
    if (req.method === 'GET') return await readBoard(sql, req, res);
    const data = req.body;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ error: 'Invalid request.' });
    if (data.action === 'join' || data.action === 'signin') return await enterClub(sql, req, res, data);
    if (data.action === 'note') return await submitNote(sql, req, res, data);
    if (data.action === 'signout') {
      const hash = sessionHash(req);
      if (hash) await sql`DELETE FROM club_session WHERE token_hash = ${hash}`;
      res.setHeader('Set-Cookie', cookie('', 0));
      return res.json({ ok: true });
    }
    return res.status(400).json({ error: 'Unknown club action.' });
  } catch {
    return res.status(503).json({ error: 'The clubhouse is temporarily unavailable. Try again in a moment.' });
  }
}
