(function(){
  var q=document.getElementById('hall-q'),grid=document.getElementById('hall-grid');
  if(!q||!grid)return;
  var cards=[].slice.call(grid.querySelectorAll('.exhibit')),chips=[].slice.call(document.querySelectorAll('.chip'));
  var count=document.getElementById('hall-count'),none=document.getElementById('hall-none'),filter='all';
  function apply(){
    var term=q.value.trim().toLowerCase(),n=0;
    cards.forEach(function(c){
      var ok=true;
      if(filter!=='all'){var p=filter.split(':');ok=c.getAttribute('data-'+p[0])===p[1];}
      if(ok&&term)ok=c.getAttribute('data-text').indexOf(term)>-1;
      c.hidden=!ok;if(ok)n++;
    });
    count.textContent=n;none.hidden=n>0;
  }
  chips.forEach(function(b){b.addEventListener('click',function(){
    filter=b.getAttribute('data-filter');
    chips.forEach(function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false');});
    apply();
  });});
  q.addEventListener('input',apply);
  if(location.hash){var t=document.querySelector(location.hash+'.exhibit');if(t){var d=t.querySelector('details');if(d)d.open=true;}}
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;var t=document.querySelector(a.getAttribute('href')+'.exhibit');if(t){t.hidden=false;var d=t.querySelector('details');if(d)d.open=true;}});
})();
/* Walk-in / list view toggle */
(function(){
  var btns=[].slice.call(document.querySelectorAll('.viewtoggle .vt'));if(!btns.length)return;
  var walk=document.getElementById('walk-view'),list=document.getElementById('list-view'),KEY='cs-hall-view';
  var ok3d=window.CSS&&CSS.supports&&CSS.supports('transform-style','preserve-3d');
  function set(v,save){
    walk.hidden=v!=='walk';list.hidden=v!=='list';
    btns.forEach(function(b){var on=b.getAttribute('data-view')===v;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false');});
    if(save)try{localStorage.setItem(KEY,v)}catch(e){}
    if(v==='walk'){var el=document.getElementById('smoothbore-walk');if(el&&el.hallEngine)el.hallEngine.layout();}
  }
  var v='walk';try{v=localStorage.getItem(KEY)||'walk'}catch(e){}
  if(location.hash==='#list')v='list';
  if(!ok3d)v='list';
  set(v,false);
  btns.forEach(function(b){b.addEventListener('click',function(){set(b.getAttribute('data-view'),true)})});
})();
