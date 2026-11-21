/*! Hall Engine: a walk-in CSS-3D museum corridor for Crack Shot halls.
 * No dependencies. Usage:
 *   <div class="hx" data-hall-src="/assets/halls/smoothbore.json"></div>
 *   <script src="/assets/hall-engine.js" defer></script>
 * or HallEngine.mount(el, {src:url} | {data:obj}).
 * Data format: see docs/hall-engine.md (exhibits[], finale{}).
 * Controls: wheel / trackpad, Up/Down or W/S to walk, Left/Right (or [ ]) for prev/next
 * exhibit, Enter to open the nearest, Esc to close; swipe up/down on touch; HUD buttons
 * (hold Forward/Back to walk). Tap or click a plaque to open its card.
 */
(function(global){
  'use strict';
  function h(tag,attrs,kids){var e=document.createElement(tag);if(attrs)for(var k in attrs){if(k==='text')e.textContent=attrs[k];else if(k==='html')e.innerHTML=attrs[k];else e.setAttribute(k,attrs[k]);}(kids||[]).forEach(function(c){if(c)e.appendChild(typeof c==='string'?document.createTextNode(c):c)});return e;}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  // The static catalog owns each image, its identification and its credit. Both
  // views use the same figure so a corrected attribution cannot drift apart.
  function catalogMedia(exhibit) {
    var entry = document.getElementById(exhibit.id);
    return entry && entry.querySelector('[data-hall-media]');
  }

  function cardHTML(x){
    var dl=(x.details||[]).map(function(d){return '<dt>'+esc(d[0])+'</dt><dd>'+esc(d[1])+'</dd>'}).join('');
    var body=(x.body||[]).map(function(p){return '<p>'+p+'</p>'}).join('');
    var src=(x.sources||[]).map(function(s){return '<a href="'+esc(s[1])+'" rel="noopener" target="_blank">'+esc(s[0])+'</a>'}).join(' · ');
    return (x.tags||[]).map(function(t){return '<span class="hx-tag">'+esc(t)+'</span>'}).join('')+
      '<h2 id="hx-title">'+esc(x.title)+'</h2><p class="hx-sub">'+esc(x.subtitle||'')+'</p>'+
      (x.summary?'<p>'+esc(x.summary)+'</p>':'')+body+(dl?'<dl>'+dl+'</dl>':'')+(src?'<p class="hx-src"><strong>Sources</strong> '+src+'</p>':'');
  }

  function mount(root,opts){
    opts=opts||{};
    if(opts.data)return build(root,opts.data,opts);
    var url=opts.src||root.getAttribute('data-hall-src');
    return fetch(url).then(function(r){if(!r.ok)throw new Error('hall data '+r.status);return r.json()}).then(function(d){return build(root,d,opts)})
      .catch(function(e){root.innerHTML='<p style="color:#fff;padding:1rem">The walk-in hall could not load ('+esc(e.message)+'). Use the list view.</p>';});
  }

  function build(root,data,opts){
    var reduce=global.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ex=data.exhibits||[], fin=data.finale;
    root.classList.add('hx'); root.innerHTML='';
    var stage=h('div',{'class':'hx-stage',tabindex:'0',role:'application','aria-roledescription':'walk-in hall','aria-label':(data.title||'Hall')+'. Use arrow keys or W and S to walk, left and right arrows to jump between exhibits, Enter to open the nearest exhibit.'});
    var world=h('div',{'class':'hx-world'}); stage.appendChild(world);
    var now=h('div',{'class':'hx-now','aria-live':'polite'}); var bar=h('div',{'class':'hx-bar'});
    var hint=h('div',{'class':'hx-hint',text:opts.hint||'Scroll, swipe, or use the arrow keys to walk. Tap a plaque to read it.'});
    var hud=h('div',{'class':'hx-hud'});
    function btn(label,aria,cls){return h('button',{type:'button','class':'hx-btn'+(cls?' '+cls:''),'aria-label':aria,text:label});}
    var bPrev=btn('‹','Previous exhibit','ghost'),bBack=btn('Back','Walk back (hold)','ghost'),bOpen=btn('Read','Open the nearest exhibit'),bFwd=btn('Forward','Walk forward (hold)','ghost'),bNext=btn('›','Next exhibit','ghost');
    [bPrev,bBack,bOpen,bFwd,bNext].forEach(function(b){hud.appendChild(b)});
    root.appendChild(stage); root.appendChild(now); root.appendChild(hint); root.appendChild(hud); root.appendChild(bar);
    setTimeout(function(){hint.classList.add('gone')},6000);
    // modal (one per page is fine; reuse if present)
    var modal=document.querySelector('.hx-modal');
    if(!modal){modal=h('div',{'class':'hx-modal',role:'dialog','aria-modal':'true','aria-labelledby':'hx-title'});modal.innerHTML='<div class="hx-card"><button type="button" class="hx-close" aria-label="Close">×</button><div class="hx-body"></div><div class="hx-nav"><button type="button" class="hx-btn ghost hx-mprev">Previous</button><button type="button" class="hx-btn hx-mnext">Next</button></div></div>';document.body.appendChild(modal);}
    var mBody=modal.querySelector('.hx-body');

    var W,H,G,START,L,D,P,segs=[],items=[],cam=0,target=0,vel=0,cur=-1,lastFocus=null,open=-1;
    var all=ex.concat(fin?[fin]:[]);
    var lastWidth=0, lastHeight=0;
    function layout(){
      var sw=stage.clientWidth, sh=stage.clientHeight;
      if(!sw || !sh || (sw===lastWidth && sh===lastHeight)) return;
      lastWidth=sw;
      lastHeight=sh;
      W=Math.max(340,sw*1.04); H=Math.max(300,sh*1.02);
      P=Math.min(405,W*0.54); G=Math.max(235,W*0.47); START=G*0.83; D=G*0.78;
      stage.style.perspective=Math.round(W*0.85)+'px';
      L=START+ex.length*G+W*0.9;
      world.innerHTML=''; segs=[]; items=[];
      var S=Math.round(W/3), n=Math.ceil(L/S)+1;
      // Continuous wall backing covers subpixel joins between the decorated bays.
      var wallStart=2*S;
      [-1,1].forEach(function(side){
        add('hx-wall-back',L+wallStart,H,
          'translate3d('+side*(W/2+2)+'px,'+(-H/2)+'px,'+wallStart+'px) rotateY(90deg)',L,1);
      });
      for(var k=-2;k<n;k++){
        var z=k*S;
        add('hx-floor',W,S,'translate3d('+(-W/2)+'px,'+(H/2)+'px,'+(-z)+'px) rotateX(-90deg)',z,S);
        add('hx-ceil',W,S,'translate3d('+(-W/2)+'px,'+(-H/2)+'px,'+(-z)+'px) rotateX(-90deg)',z,S);
        add('hx-wall',S,H,'translate3d('+(-W/2)+'px,'+(-H/2)+'px,'+(-z)+'px) rotateY(90deg)',z,S);
        add('hx-wall',S,H,'translate3d('+(W/2)+'px,'+(-H/2)+'px,'+(-z)+'px) rotateY(90deg)',z,S);
      }
      // A low gallery bench shares the floor plane, leaving a clear centre aisle.
      for(var bay=1;bay<ex.length;bay+=5){
        var benchZ=START+(bay+0.35)*G;
        var benchWidth=W*0.21, benchDepth=G*0.21, benchHeight=H*0.12;
        var benchX=(bay%2 ? 0.24 : -0.24)*W-benchWidth/2;
        var seatY=H/2-benchHeight;
        add('hx-bench-shadow',benchWidth*1.23,benchDepth*1.6,atBench(benchX-benchWidth*.09,H/2-1,benchZ-benchDepth*.32)+' rotateX(-90deg)',benchZ,benchDepth);
        add('hx-bench-seat',benchWidth,benchDepth,atBench(benchX,seatY,benchZ)+' rotateX(-90deg)',benchZ,benchDepth);
        add('hx-bench-edge',benchWidth,7,atBench(benchX,seatY,benchZ),benchZ,1);
        add('hx-bench-edge',benchDepth,7,atBench(benchX,seatY,benchZ)+' rotateY(90deg)',benchZ,benchDepth);
        add('hx-bench-edge',benchDepth,7,atBench(benchX+benchWidth,seatY,benchZ)+' rotateY(90deg)',benchZ,benchDepth);
        [0.12,0.83].forEach(function(position){
          var footX=benchX+position*benchWidth, footZ=benchZ+benchDepth*0.12;
          add('hx-bench-base',benchWidth*0.06,benchHeight-6,atBench(footX,seatY+6,footZ),footZ,1);
          add('hx-bench-base',benchDepth*0.76,benchHeight-6,atBench(footX,seatY+6,footZ)+' rotateY(90deg)',footZ,benchDepth);
        });
      }
      var end=h('div',{'class':'hx-end'}); end.style.width=W+'px'; end.style.height=H+'px'; end.style.transform='translate3d('+(-W/2)+'px,'+(-H/2)+'px,'+(-L)+'px)'; world.appendChild(end); segs.push({el:end,z:L,s:1});
      ex.forEach(function(x,i){
        var left=i%2===0, z=START+i*G, el=plaque(x,i), sc=P/300;
        var tx=(left?-1:1)*(W/2-P*0.41-12), ty=-H*0.06;
        el.style.transform='translate(-50%,-50%) translate3d('+tx+'px,'+ty+'px,'+(-z)+'px) rotateY('+(left?48:-48)+'deg) scale('+sc+')';
        world.appendChild(el); items.push({el:el,z:z,image:el.querySelector('img')});
        var lamp=h('div',{'class':'hx-lamp'}); lamp.style.transform='translate(-50%,-50%) translate3d('+tx+'px,'+(-H*0.38)+'px,'+(-z)+'px) rotateY('+(left?48:-48)+'deg)'; world.appendChild(lamp); segs.push({el:lamp,z:z,s:1});
      });
      if(fin){var fe=plaque(fin,ex.length,true),fs=Math.min(1,W*0.62/420); fe.style.transform='translate(-50%,-50%) translate3d(0px,'+(-H*0.04)+'px,'+(-(L-2))+'px) scale('+fs+')'; world.appendChild(fe); items.push({el:fe,z:L,image:fe.querySelector('img')});}
      target=Math.min(target,maxCam()); cam=Math.min(cam,maxCam()); render(true);
    }
    function atBench(x,y,z){return 'translate3d('+x+'px,'+y+'px,'+(-z)+'px)';}
    function add(cls,w,hh,tr,z,s){var e=h('div',{'class':cls});e.style.width=w+'px';e.style.height=hh+'px';e.style.transform=tr;world.appendChild(e);segs.push({el:e,z:z,s:s});}
    function plaque(x,i,final){
      var media=catalogMedia(x), image=media && media.querySelector('img');
      var b=h('button',{type:'button','class':'hx-plaque'+(image?'':' hx-record')+(final?' hx-final':''),'data-i':String(i),'aria-label':(final?'Final plaque: ':'Exhibit '+(i+1)+': ')+x.title});
      b.innerHTML=(x.tags&&x.tags[0]?'<span class="hx-tag">'+esc(x.tags[0])+'</span>':'')+'<span class="hx-pt">'+esc(x.plaqueTitle||x.title)+'</span><span class="hx-ps">'+esc(x.plaqueSub||x.subtitle||'')+'</span>';
      if(image){
        var mount=h('span',{'class':'hx-mount','aria-hidden':'true'});
        mount.appendChild(h('img',{alt:'',decoding:'async','data-src':image.dataset.thumb || image.getAttribute('src'),width:image.getAttribute('width'),height:image.getAttribute('height')}));
        b.prepend(mount);
      }
      b.addEventListener('click',function(e){e.stopPropagation();if(dragMoved)return;goTo(i);show(i);});
      b.addEventListener('focus',function(){goTo(i)});
      return b;
    }
    function camFor(i){return i>=ex.length?maxCam():Math.max(0,START+i*G-D);}
    function maxCam(){return Math.max(0,L-W*0.75);}
    function goTo(i){target=camFor(i); requestMotion();}
    function nearest(v){if(v==null)v=cam;var best=0,bd=1e9;for(var i=0;i<all.length;i++){var d=Math.abs(camFor(i)-v);if(d<bd){bd=d;best=i;}}return best;}
    var persp=0;
    function render(force){
      persp=parseFloat(stage.style.perspective)||700;
      world.style.transform='translate3d(0,0,'+cam.toFixed(1)+'px)';
      for(var k=0;k<segs.length;k++){var s=segs[k],rel=cam-s.z;var hide=rel>persp*0.9;if(s.hid!==hide){s.el.style.visibility=hide?'hidden':'';s.hid=hide;}}
      // Load the small wall print only as the visitor approaches its bay.
      items.forEach(function(item){
        var distance=item.z-cam;
        var behind=distance < -persp*0.55;
        if(item.image && distance < persp*2.7 && !behind){
          item.image.src=item.image.dataset.src;
          item.image=null;
        }
        if(item.hid!==behind){
          item.el.style.visibility=behind?'hidden':'';
          item.hid=behind;
        }
      });
      var n=nearest(); if(n!==cur||force){if(items[cur])items[cur].el.classList.remove('is-near');cur=n;if(items[cur])items[cur].el.classList.add('is-near');
        var x=all[cur]; now.innerHTML='<span>'+(cur<ex.length?'Exhibit '+(cur+1)+' of '+ex.length:'End of the hall')+' · <b>'+esc(x.plaqueTitle||x.title)+'</b></span><span>'+(cur<ex.length?(cur%2===0?'Left wall':'Right wall'):'ahead')+'</span>';}
      bar.style.width=(maxCam()?cam/maxCam()*100:0)+'%';
    }
    var frame=0;
    function requestMotion(){
      if(!frame) frame=requestAnimationFrame(tick);
    }
    function tick(){
      frame=0;
      target=Math.max(0,Math.min(maxCam(),target+vel));
      var d=target-cam; cam=(reduce||Math.abs(d)<0.5)?target:cam+d*0.14;
      render(); if(cam!==target || vel) requestMotion();
    }
    function dismissHint(){hint.classList.add('gone'); requestMotion();}
    // wheel: walk; release page scroll at either end
    stage.addEventListener('wheel',function(e){var dy=e.deltaY*(e.deltaMode===1?32:1);if((dy<0&&target<=0)||(dy>0&&target>=maxCam()))return;e.preventDefault();target=Math.max(0,Math.min(maxCam(),target+dy*1.1));dismissHint();},{passive:false});
    // keys (stage focused, or anywhere while the hall is mostly on screen and no modal/input)
    function onKey(e){
      if(open>=0){if(e.key==='Escape')hide();else if(e.key==='ArrowRight')step(1,true);else if(e.key==='ArrowLeft')step(-1,true);return;}
      var t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;
      if(root.offsetParent===null)return;
      var inStage=stage.contains(document.activeElement);
      if(!inStage){var r=stage.getBoundingClientRect();if(r.top<-r.height*0.3||r.bottom>innerHeight+r.height*0.3)return;}
      var k=e.key,used=true;
      if(k==='ArrowUp'||k==='w'||k==='W')target=Math.min(maxCam(),target+G*0.5);
      else if(k==='ArrowDown'||k==='s'||k==='S')target=Math.max(0,target-G*0.5);
      else if(k==='ArrowRight'||k===']'||k==='PageDown')step(1);
      else if(k==='ArrowLeft'||k==='['||k==='PageUp')step(-1);
      else if(k==='Home')target=0; else if(k==='End')target=maxCam();
      else if((k==='Enter'||k===' ')&&(inStage&&document.activeElement===stage))show(nearest());
      else used=false;
      if(used){e.preventDefault();dismissHint();}
    }
    document.addEventListener('keydown',onKey);
    function step(dir,inModal){var base=inModal?open:nearest(target);var i=Math.max(0,Math.min(all.length-1,base+dir));goTo(i);if(inModal)show(i);}
    // touch swipe + mouse drag
    var sy=null,lastY=0,dragMoved=false,moved=0;
    stage.addEventListener('pointerdown',function(e){sy=e.clientY;lastY=e.clientY;moved=0;dragMoved=false;});
    stage.addEventListener('pointermove',function(e){if(sy===null)return;var dy=lastY-e.clientY;lastY=e.clientY;moved+=Math.abs(dy);if(moved>8){dragMoved=true;dismissHint();}target=Math.max(0,Math.min(maxCam(),target+dy*2.2));requestMotion();});
    function up(){sy=null;setTimeout(function(){dragMoved=false},0);}
    stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);stage.addEventListener('pointerleave',up);
    // HUD
    function hold(b,v){function on(e){e.preventDefault();vel=v;dismissHint();}function off(){vel=0;}b.addEventListener('pointerdown',on);['pointerup','pointerleave','pointercancel'].forEach(function(ev){b.addEventListener(ev,off)});b.addEventListener('click',function(){if(!vel)target=Math.max(0,Math.min(maxCam(),target+(v>0?G*0.6:-G*0.6)));requestMotion();});b.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();target=Math.max(0,Math.min(maxCam(),target+(v>0?G*0.6:-G*0.6)));requestMotion();}});}
    hold(bFwd,9);hold(bBack,-9);
    bNext.addEventListener('click',function(){step(1);dismissHint();});bPrev.addEventListener('click',function(){step(-1);dismissHint();});
    bOpen.addEventListener('click',function(){dismissHint();show(nearest())});
    // modal
    function show(i){
      if(i<0 || i>=all.length) return;
      if(open<0) lastFocus=document.activeElement;
      open=i;
      var exhibit=all[i];
      mBody.innerHTML=cardHTML(exhibit);
      var media=catalogMedia(exhibit);
      if(media){
        var copy=media.cloneNode(true), image=copy.querySelector('img');
        if(image) image.loading='eager';
        mBody.querySelector('.hx-sub').after(copy);
      }
      modal.classList.add('open');
      modal.querySelector('.hx-mprev').disabled=i<=0;
      modal.querySelector('.hx-mnext').disabled=i>=all.length-1;
      modal.querySelector('.hx-card').scrollTop=0;
      modal.querySelector('.hx-close').focus({preventScroll:true});
      if(exhibit.id&&history.replaceState)history.replaceState(null,'','#'+exhibit.id);
    }
    function hide(){
      modal.classList.remove('open');
      var was=open; open=-1;
      // Only clear the hash when it still names this exhibit, so closing a card
      // on the way to #targo-dates (or another in-page note) keeps that target.
      if(history.replaceState){
        var hash=location.hash.slice(1);
        var exhibit=was>=0?all[was]:null;
        if(!hash || (exhibit && hash===exhibit.id)) history.replaceState(null,'',location.pathname+location.search);
      }
      if(lastFocus&&lastFocus.focus)lastFocus.focus();
    }
    modal.querySelector('.hx-close').onclick=hide;
    modal.onclick=function(e){if(e.target===modal)hide();};
    modal.querySelector('.hx-mprev').onclick=function(){step(-1,true)};
    modal.querySelector('.hx-mnext').onclick=function(){step(1,true)};
    modal.addEventListener('keydown',function(e){if(e.key!=='Tab')return;var f=modal.querySelectorAll('button:not([disabled]),a[href]');if(!f.length)return;var a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}});
    var ro=global.ResizeObserver?new ResizeObserver(function(){layout()}):null; if(ro)ro.observe(stage); else addEventListener('resize',layout);
    layout();
    function openExhibit(id) {
      if (!id || root.closest('[hidden]')) return;
      var index = all.findIndex(function (exhibit) { return exhibit.id === id; });
      if (index < 0) return;
      target = cam = camFor(index);
      render(true);
      show(index);
    }
    openExhibit(location.hash.slice(1));
    var api={show:show,hide:hide,goTo:goTo,openExhibit:openExhibit,layout:layout,get index(){return nearest()},get count(){return all.length},el:root};
    root.hallEngine=api; return api;
  }
  var HallEngine={mount:mount,version:'2.0.0'};
  global.HallEngine=HallEngine;
  function auto(){[].forEach.call(document.querySelectorAll('[data-hall-src]'),function(el){if(!el.hallEngine&&!el.hasAttribute('data-hall-manual'))mount(el);});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',auto);else auto();
})(window);
