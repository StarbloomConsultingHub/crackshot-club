// The catalogue is readable HTML. The map and filters use those same records.
(function () {
  'use strict';
  const controls = document.getElementById('atlas-controls');
  const filter = document.getElementById('atlas-type');
  const count = document.getElementById('atlas-count');
  const index = document.querySelector('.atlas-index');
  const map = document.getElementById('atlas-map');
  const svg = 'http://www.w3.org/2000/svg';

  function shape(type, attributes) {
    const element = document.createElementNS(svg, type);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    return element;
  }

  const records = Array.from(document.querySelectorAll('.atlas-record'), article => {
    const {place, kind, x, y, dx, dy} = article.dataset;
    const endX = Number(x) + Number(dx);
    const endY = Number(y) + Number(dy);
    const target = '#' + article.id;
    const marker = shape('a', {href: target, 'aria-label': place + ', ' + kind});
    const label = shape('text', {
      x: endX, y: endY - 5, 'text-anchor': Number(dx) < 0 ? 'end' : 'start'
    });
    label.textContent = place;
    marker.append(
      shape('line', {x1: x, y1: y, x2: endX, y2: endY}),
      shape('circle', {cx: x, cy: y, r: 8}),
      label
    );
    map.append(marker);
    const link = document.createElement('a');
    link.href = target;
    link.textContent = place;
    index.append(link);
    return {article, kind, marker, link};
  });

  function matches(record) {
    return !filter.value || record.kind === filter.value;
  }

  function display(selected) {
    for (const record of records) {
      const visible = matches(record);
      record.marker.style.display = visible ? '' : 'none';
      record.link.hidden = !visible;
      record.article.hidden = record !== selected;
      for (const link of [record.marker, record.link]) {
        if (record === selected) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
    const total = records.filter(matches).length;
    count.textContent = total + (total === 1 ? ' record' : ' records');
  }

  function readLocation() {
    const record = records.find(item => '#' + item.article.id === location.hash) || records[0];
    if (!matches(record)) filter.value = '';
    display(record);
  }

  function choose(event) {
    const link = event.target.closest('a');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;
    const hash = link.getAttribute('href');
    const record = records.find(item => '#' + item.article.id === hash);
    if (!record) return;
    event.preventDefault();
    if (hash !== location.hash) history.pushState(null, '', hash);
    display(record);
    const heading = record.article.querySelector('h2');
    heading.tabIndex = -1;
    heading.focus({preventScroll: true});
    if (window.matchMedia('(max-width: 760px)').matches) heading.scrollIntoView({block: 'center'});
  }

  filter.addEventListener('change', () => {
    const selected = records.find(item => !item.article.hidden && matches(item)) || records.find(matches);
    if (selected) {
      history.replaceState(null, '', '#' + selected.article.id);
      display(selected);
    }
  });
  map.addEventListener('click', choose);
  index.addEventListener('click', choose);
  window.addEventListener('hashchange', readLocation);
  window.addEventListener('popstate', readLocation);
  controls.hidden = false;
  index.hidden = false;
  readLocation();
})();
