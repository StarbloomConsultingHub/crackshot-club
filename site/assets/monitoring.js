(() => {
  'use strict';

  // Web Analytics is metered on Pro. Enable only after the owner approves it
  // and enables Analytics in this project's Vercel dashboard. See docs/monitoring.md.
  const WEB_ANALYTICS_ENABLED = false;
  const SPEED_INSIGHTS_ENABLED = true;
  const OPT_OUT_KEY = 'crackshot-metrics-disabled';
  const productionHosts = new Set(['22crackshot.com', 'www.22crackshot.com']);
  const publicPaths = new Set([
    '/', '/about', '/hall', '/gallery-hall', '/gallery-atlas', '/games',
    '/games/gallery', '/games/crackshot', '/pull-the-sleeve', '/rules',
    '/safety', '/designs', '/gear', '/sponsor',
  ]);

  const privacySignal = () => navigator.globalPrivacyControl === true
    || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  function optedOut() {
    try { return localStorage.getItem(OPT_OUT_KEY) === 'yes'; }
    catch { return true; } // If preferences cannot be read, do not collect.
  }
  function publicUrl(value) {
    try {
      const url = new URL(value, location.href);
      if (url.protocol !== 'https:' || !productionHosts.has(url.hostname)) return null;
      const path = url.pathname.replace(/\/index\.html$/, '/')
        .replace(/\.html$/, '').replace(/\/+$/, '') || '/';
      if (!publicPaths.has(path)) return null;
      // One canonical path, never a query string, hash, credential or unknown path.
      return { url: `https://22crackshot.com${path}`, path };
    } catch { return null; }
  }
  function beforeSend(event) {
    if (privacySignal() || optedOut()) return null;
    const clean = publicUrl(event.url);
    return clean ? { ...event, url: clean.url } : null;
  }

  // This control also lets the owner exclude their own visits from reports.
  const toggle = document.querySelector('[data-measurement-toggle]');
  const status = document.querySelector('[data-measurement-status]');
  if (toggle && status) {
    const signal = privacySignal();
    const disabled = optedOut();
    status.textContent = signal ? 'Measurement is paused by your browser’s privacy setting.'
      : disabled ? 'Measurement is paused in this browser.'
        : 'Measurement is allowed in this browser on 22crackshot.com.';
    toggle.textContent = disabled ? 'Allow measurement in this browser' : 'Pause measurement in this browser';
    toggle.disabled = signal;
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      try {
        if (optedOut()) localStorage.removeItem(OPT_OUT_KEY);
        else localStorage.setItem(OPT_OUT_KEY, 'yes');
        location.reload();
      } catch {
        status.textContent = 'Your browser could not save this preference. Measurement is paused while storage is unavailable.';
      }
    });
  }

  const page = publicUrl(location.href);
  if (!page || privacySignal() || optedOut()) return;

  function load(queueName, queueKey, src, filter, route) {
    if (document.querySelector(`script[src="${src}"]`)) return;
    window[queueName] = window[queueName] || function () {
      (window[queueKey] = window[queueKey] || []).push(arguments);
    };
    window[queueName]('beforeSend', filter);
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.referrerPolicy = 'origin';
    if (route) script.dataset.route = route;
    document.head.appendChild(script);
  }

  if (SPEED_INSIGHTS_ENABLED) {
    load('si', 'siq', '/_vercel/speed-insights/script.js', beforeSend, page.path);
  }
  if (WEB_ANALYTICS_ENABLED) {
    load('va', 'vaq', '/_vercel/insights/script.js', (event) => {
      // Page views only: no form values, member IDs, game inputs or custom events.
      if (event.type !== 'pageview') return null;
      return beforeSend(event);
    });
  }
})();
