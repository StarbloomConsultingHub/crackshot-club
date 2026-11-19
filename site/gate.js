/* Crack Shot 18+ click-through age gate. Self-declared only; stored in localStorage. */
(function(){
  var KEY='crackshot-age-ok-v1', d=document, root=d.documentElement;
  var gate=d.getElementById('age-gate'); if(!gate) return;
  function ok(){try{return localStorage.getItem(KEY)==='yes'}catch(e){return false}}
  if(ok()){root.classList.remove('gate-on');return}
  root.classList.add('gate-on');
  var yes=gate.querySelector('[data-gate=yes]'), no=gate.querySelector('[data-gate=no]');
  setTimeout(function(){yes&&yes.focus()},50);
  yes.addEventListener('click',function(){
    try{localStorage.setItem(KEY,'yes')}catch(e){}
    root.classList.remove('gate-on');
  });
  no.addEventListener('click',function(){
    gate.classList.add('left');
    setTimeout(function(){location.href='https://www.google.com/'},1500);
  });
  gate.addEventListener('keydown',function(e){ if(e.key==='Tab'){ // keep focus inside
    var f=[yes,no]; if(e.shiftKey&&d.activeElement===yes){no.focus();e.preventDefault()} else if(!e.shiftKey&&d.activeElement===no){yes.focus();e.preventDefault()} }});
})();
// mobile menu
(function(){var b=document.querySelector('.menu-btn'),n=document.querySelector('nav.main');if(!b||!n)return;
b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o)})})();
