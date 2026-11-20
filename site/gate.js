/* Crack Shot 18+ click-through age gate. Self-declared only; stored in localStorage. */
(function(){
  var KEY='crackshot-age-ok-v1', d=document, root=d.documentElement;
  var gate=d.getElementById('age-gate'); if(!gate) return;
  function ok(){try{return localStorage.getItem(KEY)==='yes'}catch(e){return false}}
  // Only the arcade lobby accepts a return link, and only to one of our games.
  var returnTo='';
  if(/^\/games(?:\/(?:index\.html)?)?$/.test(location.pathname)){
    try{
      var target=new URL(new URLSearchParams(location.search).get('returnTo')||'',location.origin);
      if(target.origin===location.origin && /^\/games\/(?:gallery|crackshot)(?:\/(?:index\.html)?)?$/.test(target.pathname)){
        returnTo=target.pathname+target.search+target.hash;
      }
    }catch(e){}
  }
  if(ok()){root.classList.remove('gate-on');if(returnTo)location.replace(returnTo);return}
  root.classList.add('gate-on');
  var yes=gate.querySelector('[data-gate=yes]'), no=gate.querySelector('[data-gate=no]');
  setTimeout(function(){yes&&yes.focus()},50);
  yes.addEventListener('click',function(){
    try{localStorage.setItem(KEY,'yes')}catch(e){}
    if(returnTo && !ok()){
      var error=d.getElementById('gate-storage-error');
      if(!error){
        error=d.createElement('p');error.id='gate-storage-error';error.setAttribute('role','alert');
        error.textContent='Your browser could not save your age confirmation. Allow site storage, then try again to open the game.';
        yes.parentNode.appendChild(error);
      }
      return;
    }
    root.classList.remove('gate-on');
    if(returnTo)location.replace(returnTo);
  });
  no.addEventListener('click',function(){
    gate.classList.add('left');
    setTimeout(function(){location.href='https://www.google.com/'},1500);
  });
  gate.addEventListener('keydown',function(e){ if(e.key==='Tab'){ // keep focus inside
    var f=[yes,no]; if(e.shiftKey&&d.activeElement===yes){no.focus();e.preventDefault()} else if(!e.shiftKey&&d.activeElement===no){yes.focus();e.preventDefault()} }});
})();
// Header navigation on pages with the full site menu.
(function () {
  var button = document.querySelector('.menu-btn'), nav = document.querySelector('nav.main');
  if (!button || !nav) return;
  var more = nav.querySelector('details');
  function closeMobile() {
    nav.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
  }
  button.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
    if (!open && more) more.open = false;
  });
  if (!more) return;
  document.addEventListener('click', function (event) {
    if (!more.contains(event.target)) more.open = false;
    if (!nav.contains(event.target) && !button.contains(event.target)) closeMobile();
  });
  nav.addEventListener('focusout', function (event) {
    if (event.relatedTarget && !more.contains(event.relatedTarget)) more.open = false;
  });
  nav.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (more.open) {
      more.open = false;
      more.querySelector('summary').focus();
    } else if (nav.classList.contains('open')) {
      closeMobile();
      button.focus();
    }
  });
})();
