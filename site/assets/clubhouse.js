const element = id => document.getElementById(id);
const status = element('club-status');
const joinForm = element('join-form');
const signInForm = element('signin-form');
const noteForm = element('note-form');
const retry = element('club-retry');
let newPass = '';
let draftId = '';
let busy = false;

function makePass() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return 'CS-' + hex.match(/.{8}/g).join('-');
}

async function request(data) {
  const options = { cache: 'no-store', credentials: 'same-origin' };
  if (data) Object.assign(options, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  const fallback = 'The clubhouse could not be reached. Check your connection and try again.';
  let response, result;
  try {
    response = await fetch('/api/club', options);
    result = await response.json();
  } catch {
    throw new Error(fallback);
  }
  if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : fallback);
  return result;
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
function renderBoard(notes) {
  const board = element('board-notes');
  board.replaceChildren();
  if (!notes.length) {
    const empty = document.createElement('p');
    empty.textContent = 'The first member notes will appear here after review.';
    board.append(empty);
  }
  for (const note of notes) {
    const article = document.createElement('article');
    const title = document.createElement('h3');
    title.textContent = note.topic;
    const meta = document.createElement('div');
    meta.className = 'board-meta';
    meta.textContent = note.nickname + ' · ' + dateFormat.format(new Date(note.published));
    const body = document.createElement('p');
    body.className = 'note-text';
    body.textContent = note.body;
    article.append(title, meta, body);
    board.append(article);
  }
}

async function refresh() {
  const state = await request();
  const signedIn = state.member !== null;
  element('guest-tools').hidden = signedIn;
  element('member-tools').hidden = !signedIn;
  element('desk-heading').textContent = signedIn ? 'Welcome, ' + state.member : 'Free membership';
  element('desk-summary').textContent = signedIn ? 'Pull up a chair and add a note for the club.'
    : 'Choose the nickname you’d like other members to see. You’ll get a private member pass to come back with.';
  const pending = element('pending-notes');
  const list = pending.querySelector('ul');
  list.replaceChildren();
  for (const note of state.pending) {
    const item = document.createElement('li');
    item.textContent = note.topic + ' · ' + note.body;
    list.append(item);
  }
  pending.hidden = !state.pending.length;
  renderBoard(state.notes);
  return signedIn;
}

async function run(action) {
  if (busy) return;
  busy = true;
  retry.hidden = true;
  status.textContent = 'One moment…';
  const controls = document.querySelectorAll('.club-desk button');
  controls.forEach(control => { control.disabled = true; });
  try {
    status.textContent = await action() || '';
  } catch (error) {
    status.textContent = error.message;
    retry.hidden = false;
  } finally {
    busy = false;
    controls.forEach(control => { control.disabled = false; });
  }
}

function showPass(pass) {
  element('member-pass').value = pass;
  element('pass-card').hidden = !pass;
}

function enter(action, pass, extra = {}) {
  return run(async () => {
    await request({ action, pass, ...extra });
    if (action === 'join') showPass(pass);
    const signedIn = await refresh();
    if (!signedIn) throw new Error('Your pass is valid. Enable cookies for this site, then sign in with your member pass.');
    joinForm.reset();
    signInForm.reset();
    newPass = '';
    element('desk-heading').focus();
    return action === 'join' ? 'You’re a member. Save your pass below.' : 'You’re signed in.';
  });
}

joinForm.addEventListener('submit', event => {
  event.preventDefault();
  newPass ||= makePass();
  enter('join', newPass, { nickname: joinForm.elements.nickname.value, accepted: joinForm.elements.accepted.checked });
});
signInForm.addEventListener('submit', event => {
  event.preventDefault();
  showPass('');
  enter('signin', signInForm.elements.pass.value);
});
noteForm.addEventListener('input', () => { draftId = ''; });
noteForm.addEventListener('submit', event => {
  event.preventDefault();
  run(async () => {
    draftId ||= crypto.randomUUID();
    await request({ action: 'note', id: draftId, topic: noteForm.elements.topic.value, body: noteForm.elements.body.value });
    noteForm.reset();
    draftId = '';
    await refresh();
    return 'Your note is with the club editor.';
  });
});
element('copy-pass').addEventListener('click', async () => {
  const field = element('member-pass');
  try {
    await navigator.clipboard.writeText(field.value);
    status.textContent = 'Member pass copied.';
  } catch {
    field.focus();
    field.select();
    status.textContent = 'Your pass is selected. Use your device’s Copy command.';
  }
});
element('sign-out').addEventListener('click', () => run(async () => {
  await request({ action: 'signout' });
  showPass('');
  newPass = '';
  draftId = '';
  noteForm.reset();
  element('member-tools').hidden = true;
  element('pending-notes').querySelector('ul').replaceChildren();
  await refresh();
  element('desk-heading').focus();
  return 'You’re signed out.';
}));
function openDesk() { run(async () => { await refresh(); }); }
retry.addEventListener('click', openDesk);
openDesk();
