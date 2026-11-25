(() => {
  'use strict';
  const counted = new Set();
  const endpoint = '/api/sponsors';
  const request = async placement => {
    const response = await fetch(endpoint + '?placement=' + encodeURIComponent(placement), { credentials: 'omit', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Sponsor unavailable');
    return response.json();
  };
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  function showContact(email) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    document.querySelectorAll('[data-sponsor-contact]').forEach(link => {
      link.href = 'mailto:' + encodeURIComponent(email) + '?subject=22%20Crack%20Shot%20sponsorship';
      link.hidden = false;
    });
    document.querySelectorAll('[data-sponsor-contact-pending]').forEach(note => { note.hidden = true; });
  }

  function mount(slot) {
    const placement = slot.dataset.sponsorPlacement;
    const fallback = slot.firstElementChild.cloneNode(true);
    let campaign = null, token = null, inView = false, timer, refreshTimer, version = 0, tokenDeadline = 0;
    const canCount = () => inView && document.visibilityState === 'visible' && !document.documentElement.classList.contains('gate-on');
    function replaceCard(card) {
      const hadFocus = slot.contains(document.activeElement);
      slot.replaceChildren(card);
      if (hadFocus) slot.querySelector('a')?.focus({ preventScroll: true });
    }
    function measure() {
      clearTimeout(timer);
      if (!campaign || !token || !canCount() || counted.has(placement + ':' + campaign.id)) return;
      if (performance.now() >= tokenDeadline) { refresh(); return; }
      timer = setTimeout(() => {
        if (!canCount()) return;
        counted.add(placement + ':' + campaign.id);
        fetch(endpoint, { method: 'POST', credentials: 'omit', keepalive: true,
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).catch(() => {});
      }, 1000);
    }
    function render(data) {
      campaign = data.campaign;
      token = data.token;
      tokenDeadline = performance.now() + 9 * 60 * 1000;
      if (!campaign) {
        if (!slot.querySelector('.sponsor-card--house')) replaceCard(fallback.cloneNode(true));
        measure(); return;
      }
      const card = element('div', 'sponsor-card sponsor-card--paid');
      card.append(element('p', 'sponsor-label', 'Advertisement'));
      if (campaign.image) {
        const image = element('img', 'sponsor-image');
        image.src = campaign.image; image.alt = campaign.imageAlt;
        image.width = 300; image.height = 250; image.decoding = 'async';
        image.addEventListener('error', () => { image.remove(); }, { once: true });
        card.append(image);
      }
      card.append(element('p', 'sponsor-name', campaign.name), element('h2', '', campaign.headline), element('p', 'sponsor-description', campaign.description));
      const link = element('a', 'sponsor-link', campaign.linkLabel + ' →');
      link.href = campaign.url; link.rel = 'sponsored noopener';
      card.append(link);
      replaceCard(card);
      measure();
    }
    async function refresh() {
      const current = ++version;
      clearTimeout(refreshTimer); clearTimeout(timer);
      // End the previous booking even when the network is unavailable at its boundary.
      render({ campaign: null, token: null });
      try {
        const data = await request(placement);
        if (current !== version) return;
        render(data);
        if (Number.isFinite(data.refreshAfterMs) && data.refreshAfterMs > 0) {
          refreshTimer = setTimeout(refresh, Math.min(data.refreshAfterMs + 50, 86400000));
        }
      } catch { /* The static club-support card remains useful without the API. */ }
    }
    if ('IntersectionObserver' in window) {
      const exposure = new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.5;
        measure();
      }, { threshold: [0, 0.5] });
      exposure.observe(slot);
      const loading = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { loading.disconnect(); refresh(); }
      }, { rootMargin: '300px' });
      loading.observe(slot);
    } else {
      // Display still works; do not guess viewability in unsupported browsers.
      refresh();
    }
    document.addEventListener('visibilitychange', measure);
    new MutationObserver(measure).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  document.querySelectorAll('[data-sponsor-placement]').forEach(mount);
  if (document.querySelector('[data-sponsor-contact]')) request('home').then(data => showContact(data.contactEmail)).catch(() => {});
})();
