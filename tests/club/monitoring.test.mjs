import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, readdirSync } from 'node:fs';

const source = readFileSync(new URL('../../site/assets/monitoring.js', import.meta.url), 'utf8');
function browser({ url = 'https://22crackshot.com/hall', paid = false, privacy = {}, stored = false, brokenStorage = false } = {}) {
  const scripts = [];
  const data = new Map(stored ? [['crackshot-metrics-disabled', 'yes']] : []);
  let reloads = 0;
  const toggle = { hidden: true, addEventListener(type, fn) { this[type] = fn; } };
  const status = {};
  const context = {
    URL, navigator: privacy, location: { href: url, reload: () => reloads++ },
    localStorage: {
      getItem(key) { if (brokenStorage) throw Error('denied'); return data.get(key); },
      setItem(key, value) { if (brokenStorage) throw Error('denied'); data.set(key, value); },
      removeItem(key) { if (brokenStorage) throw Error('denied'); data.delete(key); },
    },
    document: {
      querySelector(selector) {
        if (selector === '[data-measurement-toggle]') return toggle;
        if (selector === '[data-measurement-status]') return status;
        return scripts.find(script => selector === `script[src="${script.src}"]`);
      },
      createElement() { return { dataset: {} }; },
      head: { appendChild: script => scripts.push(script) },
    },
  };
  context.window = context;
  vm.createContext(context);
  const run = () => vm.runInContext(paid ? source.replace('const WEB_ANALYTICS_ENABLED = false;', 'const WEB_ANALYTICS_ENABLED = true;') : source, context);
  run();
  return { context, scripts, data, toggle, status, run, reloads: () => reloads };
}

test('shipping configuration loads free Speed Insights only, asynchronously and once', () => {
  const b = browser();
  assert.deepEqual(b.scripts.map(s => s.src), ['/_vercel/speed-insights/script.js']);
  assert.equal(b.scripts[0].defer, true);
  assert.equal(b.scripts[0].referrerPolicy, 'origin');
  assert.equal(b.scripts[0].dataset.route, '/hall');
  assert.equal(b.context.va, undefined);
  b.run();
  assert.equal(b.scripts.length, 1);
});

test('previews, local development, membership and unknown paths never load collectors', () => {
  for (const url of [
    'http://localhost:3000/hall', 'https://preview.vercel.app/hall',
    'https://22crackshot.com.evil.example/hall', 'http://22crackshot.com/hall',
    'https://22crackshot.com/join', 'https://22crackshot.com/join.html?pass=secret',
    'https://22crackshot.com/404', 'https://22crackshot.com/api/club',
    'https://22crackshot.com/members/private-name',
  ]) assert.equal(browser({ url, paid: true }).scripts.length, 0, url);
});

test('privacy signals, opt-out and inaccessible preferences stop both collectors', () => {
  for (const options of [
    { privacy: { globalPrivacyControl: true } }, { privacy: { doNotTrack: '1' } },
    { stored: true }, { brokenStorage: true },
  ]) assert.equal(browser({ ...options, paid: true }).scripts.length, 0);
});

test('performance payload keeps measurements but strips queries and fragments', () => {
  const b = browser();
  const filter = b.context.siq[0][1];
  const cleaned = filter({ url: 'https://www.22crackshot.com/games/gallery/index.html?pass=secret#name', value: 123, type: 'vital' });
  assert.equal(cleaned.url, 'https://22crackshot.com/games/gallery');
  assert.equal(cleaned.value, 123);
  for (const url of ['https://22crackshot.com/join', 'https://elsewhere.test/hall', 'https://22crackshot.com/not-public']) {
    assert.equal(filter({ url }), null);
  }
  b.data.set('crackshot-metrics-disabled', 'yes');
  assert.equal(filter({ url: 'https://22crackshot.com/hall' }), null);
});

test('optional visitor collector accepts page views only and redacts their URL', () => {
  const b = browser({ paid: true });
  assert.equal(b.scripts.length, 2);
  const filter = b.context.vaq[0][1];
  assert.equal(filter({ type: 'pageview', url: 'https://22crackshot.com/hall.html?email=private#exhibit' }).url, 'https://22crackshot.com/hall');
  assert.equal(filter({ type: 'event', url: 'https://22crackshot.com/hall', name: 'note', data: 'private' }), null);
});

test('preference control persists opt-out and reloads without touching membership storage', () => {
  const b = browser();
  b.data.set('crackshot-age-ok-v1', 'yes');
  b.toggle.click();
  assert.equal(b.data.get('crackshot-metrics-disabled'), 'yes');
  assert.equal(b.data.get('crackshot-age-ok-v1'), 'yes');
  assert.equal(b.reloads(), 1);
  const paused = browser({ stored: true });
  paused.toggle.click();
  assert.equal(paused.data.has('crackshot-metrics-disabled'), false);
  assert.equal(browser({ privacy: { globalPrivacyControl: true } }).toggle.disabled, true);
});

test('every HTML page includes the shared deferred loader exactly once', () => {
  const site = new URL('../../site/', import.meta.url);
  const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === 'node_modules') return [];
    const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    return entry.isDirectory() ? walk(file) : entry.name.endsWith('.html') ? [file] : [];
  });
  for (const file of walk(site)) {
    const html = readFileSync(file, 'utf8');
    assert.equal((html.match(/<script src="\/assets\/monitoring\.js\?v=1" defer><\/script>/g) || []).length, 1, file.href);
  }
});
