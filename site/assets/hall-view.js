// Both halls start at the walk-in exhibit and honor a reader's saved list preference.
(function () {
  const toggle = document.querySelector('.viewtoggle');
  const walk = document.getElementById('walk-view');
  const list = document.getElementById('list-view');
  const gallery = walk.querySelector('[data-hall-src]');
  const status = document.getElementById('hall-status');
  const canWalk = window.CSS?.supports('transform-style', 'preserve-3d') && window.HallEngine;
  let loading;

  function linkedExhibit() {
    const item = document.getElementById(location.hash.slice(1));
    return item?.classList.contains('exhibit') ? item : null;
  }

  function revealExhibit() {
    const item = linkedExhibit();
    if (!item || list.hidden) return;
    item.hidden = false;
    const details = item.querySelector('details');
    if (details) details.open = true;
    item.scrollIntoView();
  }

  function setView(view, save) {
    const walking = view === 'walk' && Boolean(canWalk);
    walk.hidden = !walking;
    list.hidden = walking;
    toggle.querySelectorAll('button').forEach(button => {
      const active = button.dataset.view === (walking ? 'walk' : 'list');
      button.classList.toggle('on', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (save) {
      try { localStorage.setItem(toggle.dataset.preference, walking ? 'walk' : 'list'); } catch {}
    }
    if (!walking) return;
    status.hidden = true;
    if (gallery.hallEngine) {
      gallery.hallEngine.layout();
    } else if (!loading) {
      loading = window.HallEngine.mount(gallery).then(engine => {
        loading = null;
        if (engine || walk.hidden) return;
        setView('list', false);
        status.textContent = 'The walk-in hall could not load. The exhibit list is open below.';
        status.hidden = false;
        revealExhibit();
      });
    }
  }

  function openFromUrl() {
    let preferred = 'walk';
    try {
      if (localStorage.getItem(toggle.dataset.preference) === 'list') preferred = 'list';
    } catch {}
    setView(location.hash === '#list' ? 'list' : preferred, false);
    if (walk.hidden) revealExhibit();
    else if (gallery.hallEngine) gallery.hallEngine.openExhibit(location.hash.slice(1));
  }

  toggle.hidden = !canWalk;
  toggle.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => setView(button.dataset.view, true));
  });
  window.addEventListener('hashchange', openFromUrl);
  openFromUrl();
})();
