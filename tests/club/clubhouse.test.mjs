import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import handler from '../../site/api/club.mjs';
import { openLocalDatabase } from './local-database.mjs';

const host = 'club.example';
const pass = 'CS-11111111-22222222-33333333-44444444-55555555';
const join = { action: 'join', pass, nickname: 'Penny Arcade', accepted: true };
let db;

before(async () => { db = await openLocalDatabase(); });
after(async () => { await db?.close(); });

async function call(body, cookie = '', overrides = {}) {
  const headers = { host, origin: 'https://' + host, cookie, 'content-type': 'application/json' };
  const request = { method: body ? 'POST' : 'GET', headers: { ...headers, ...overrides }, body };
  const result = {
    code: 200, headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; }
  };
  await handler(request, result);
  return result;
}

test('guests can read the board, but cannot post or join without consent', async () => {
  assert.deepEqual((await call()).data, { member: null, pending: [], notes: [] });
  assert.equal((await call({ action: 'note' })).code, 401);
  assert.equal((await call({ ...join, accepted: false })).code, 400);
  assert.equal((await call(join, '', { origin: 'https://elsewhere.example' })).code, 403);
  assert.equal((await call(join, '', { 'content-type': 'text/plain' })).code, 415);
  assert.equal((await call(join, '', { origin: 'http://' + host })).code, 403);
  assert.equal((await call({ action: 'signout' }, '', { host: '127.0.0.1:4173', origin: 'http://127.0.0.1:4173' })).code, 200);
});

test('membership, private review, approval, return visits and signout', async () => {
  const first = await call(join);
  assert.equal(first.code, 200);
  assert.match(first.headers['Set-Cookie'], /HttpOnly; SameSite=Lax; Secure/);
  assert.equal(first.headers['Cache-Control'], 'private, no-store');
  const cookie = first.headers['Set-Cookie'].split(';')[0];
  assert.equal((await call(join)).code, 200);
  const members = await db.query('SELECT pass_hash FROM club_member');
  assert.equal(members.rows.length, 1);
  assert.match(members.rows[0].pass_hash, /^[a-f0-9]{64}$/);
  assert.equal((await call(null, cookie)).data.member, join.nickname);

  const note = { action: 'note', id: randomUUID(), topic: 'Gallery memory', body: 'A dated postcard shows the old arcade.', approved_at: 'now' };
  assert.equal((await call(note, cookie)).code, 200);
  assert.equal((await call(note, cookie)).code, 200);
  const mine = (await call(null, cookie)).data;
  assert.equal(mine.pending.length, 1);
  assert.equal(mine.notes.length, 0);
  assert.equal((await call()).data.pending.length, 0);

  const second = await call({ ...join, pass: pass.replace('55555555', 'AAAAAAAA'), nickname: 'Another member' });
  const otherCookie = second.headers['Set-Cookie'].split(';')[0];
  assert.deepEqual((await call(null, otherCookie)).data.pending, []);
  assert.equal((await call(note, otherCookie)).code, 409);
  await assert.rejects(db.transaction(async tx => {
    await tx.exec('SET LOCAL ROLE club_web');
    await tx.query('UPDATE club_note SET approved_at = now() WHERE id = $1', [note.id]);
  }), /permission denied/);

  await db.query('UPDATE club_note SET approved_at = now() WHERE id = $1', [note.id]);
  const board = (await call()).data;
  assert.equal(board.notes[0].nickname, join.nickname);
  assert.equal(board.notes[0].body, note.body);
  assert.equal((await call(null, cookie)).data.pending.length, 0);

  assert.equal((await call({ action: 'signout' }, cookie)).code, 200);
  assert.equal((await call(null, cookie)).data.member, null);
  const signedIn = await call({ action: 'signin', pass: pass.toLowerCase() });
  assert.equal(signedIn.code, 200);
  const newCookie = signedIn.headers['Set-Cookie'].split(';')[0];
  assert.equal((await call(null, newCookie)).data.member, join.nickname);
  await db.exec("UPDATE club_session SET expires_at = now() - interval '1 day'");
  assert.equal((await call(null, newCookie)).data.member, null);
  assert.equal((await call({ action: 'signin', pass: pass.replace('55555555', 'BBBBBBBB') })).code, 401);
});

test('signup quota rejects the eleventh attempt from the same daily bucket', async () => {
  const ip = { 'x-vercel-forwarded-for': '203.0.113.27' };
  for (let i = 0; i < 10; i++) assert.equal((await call(join, '', ip)).code, 200);
  assert.equal((await call(join, '', ip)).code, 429);
});
