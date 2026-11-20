/* Gallery Games Hall: list-view search/filter + walk/list toggle. Walk view uses /assets/hall-engine.js. */
(function(){
  var q=document.getElementById('hall-q'),grid=document.getElementById('hall-grid');
  if(q&&grid){
    var cards=[].slice.call(grid.querySelectorAll('.exhibit')),chips=[].slice.call(document.querySelectorAll('.chip'));
    var count=document.getElementById('hall-count'),none=document.getElementById('hall-none'),filter='all';
    var apply=function(){
      var term=q.value.trim().toLowerCase(),n=0;
      cards.forEach(function(c){
        var ok=filter==='all'||c.getAttribute('data-tag')===filter;
        if(ok&&term)ok=c.getAttribute('data-text').indexOf(term)>-1;
        c.hidden=!ok;if(ok)n++;
      });
      count.textContent=n;none.hidden=n>0;
    };
    chips.forEach(function(b){b.addEventListener('click',function(){
      filter=b.getAttribute('data-filter');
      chips.forEach(function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false');});
      apply();
    });});
    q.addEventListener('input',apply);
  }
})();
