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
