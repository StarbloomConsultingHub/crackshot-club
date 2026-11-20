/*! Hall Engine v1: a walk-in CSS-3D museum corridor for Crack Shot halls.
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
  var NS='http://www.w3.org/2000/svg';
  function h(tag,attrs,kids){var e=document.createElement(tag);if(attrs)for(var k in attrs){if(k==='text')e.textContent=attrs[k];else if(k==='html')e.innerHTML=attrs[k];else e.setAttribute(k,attrs[k]);}(kids||[]).forEach(function(c){if(c)e.appendChild(typeof c==='string'?document.createTextNode(c):c)});return e;}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  /* ---------- built-in art (stylized silhouettes, palette via currentColor + vars) ---------- */
  var ART={};
  function gun(extra,stock){
    stock=stock||'#1C2E4A';
    return '<svg viewBox="0 0 320 90" role="img" aria-hidden="true">'+
      '<path d="M8 40 L92 33 L104 38 L104 50 L92 50 L60 56 L14 68 Q6 70 6 62 Z" fill="'+stock+'"/>'+
      '<rect x="98" y="32" width="46" height="15" rx="3" fill="#C4A354"/>'+
      '<rect x="142" y="35" width="170" height="6" rx="2" fill="#1C2E4A"/>'+
      '<rect x="304" y="31" width="4" height="5" fill="#1C2E4A"/>'+
      '<path d="M112 47 q4 10 12 10" stroke="#1C2E4A" stroke-width="3" fill="none"/>'+extra+'</svg>';
  }
  ART['rifle:pump']=gun('<rect x="142" y="42" width="140" height="4" rx="2" fill="#1C2E4A"/><rect x="170" y="40" width="60" height="11" rx="4" fill="#C41E3A"/>');
  ART['rifle:lever']=gun('<rect x="142" y="42" width="150" height="4" rx="2" fill="#1C2E4A"/><path d="M104 47 q-2 22 22 20 q14 -2 12 -18" stroke="#1C2E4A" stroke-width="4" fill="none"/><rect x="150" y="40" width="50" height="9" rx="3" fill="#7a4a24"/>','#7a4a24');
  ART['rifle:bolt']=gun('<path d="M104 40 L196 40 L196 50 L104 52 Z" fill="#C41E3A"/><circle cx="128" cy="26" r="5" fill="#1C2E4A"/><rect x="126" y="26" width="4" height="8" fill="#1C2E4A"/>');
  ART['rifle:nylon']=gun('<path d="M104 40 L200 40 L200 50 L104 52 Z" fill="#7a4a24"/><circle cx="128" cy="26" r="5" fill="#C4A354"/><rect x="126" y="26" width="4" height="8" fill="#C4A354"/>','#7a4a24');
  ART['rifle:block']=gun('<path d="M120 47 q6 16 -30 16" stroke="#1C2E4A" stroke-width="4" fill="none"/><rect x="142" y="40" width="36" height="8" rx="3" fill="#C41E3A"/>');
  ART['rifle:break']=gun('<circle cx="146" cy="44" r="5" fill="#C41E3A"/><rect x="148" y="40" width="40" height="8" rx="3" fill="#C41E3A"/>');
  ART['duck']='<svg viewBox="0 0 320 90" aria-hidden="true"><ellipse cx="150" cy="56" rx="70" ry="22" fill="#C4A354"/><circle cx="210" cy="34" r="16" fill="#C4A354"/><path d="M224 34 l24 4 l-24 6z" fill="#C41E3A"/><circle cx="214" cy="30" r="3" fill="#1C2E4A"/><path d="M90 52 l-26 -10 l10 18z" fill="#C4A354"/><rect x="60" y="78" width="200" height="6" fill="#1C2E4A"/></svg>';
  ART['target']='<svg viewBox="0 0 320 90" aria-hidden="true"><circle cx="160" cy="45" r="40" fill="#F3E6C8" stroke="#1C2E4A" stroke-width="4"/><circle cx="160" cy="45" r="27" fill="#C41E3A"/><circle cx="160" cy="45" r="14" fill="#F3E6C8"/><circle cx="160" cy="45" r="6" fill="#1C2E4A"/></svg>';
  ART['cracker']=(function(){var n=18,R=38,C=45,d='',i,a,b,c;function pt(r,t){return (r*Math.cos(t)).toFixed(1)+' '+(r*Math.sin(t)).toFixed(1);}
    d='M'+pt(R,0);for(i=0;i<n;i++){b=(i+.5)/n*Math.PI*2;c=(i+1)/n*Math.PI*2;d+=' Q'+pt(C,b)+' '+pt(R,c);}d+=' Z';
    var holes=[[0,0],[-14,-10],[14,-10],[-14,10],[14,10],[0,-20],[0,20]].map(function(p){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="2.6" fill="#8c6f2c"/>'}).join('');
    return '<svg viewBox="0 0 320 90" aria-hidden="true"><g transform="translate(160 45)"><path d="'+d+'" fill="#E2C27A" stroke="#8c6f2c" stroke-width="1.5"/>'+holes+'</g></svg>';})();
  function artHTML(a){
    if(!a)return ART['target'];
    if(typeof a==='string')return ART[a]||ART['target'];
    if(a.svg)return a.svg;
    if(a.img)return '<img src="'+esc(a.img)+'" alt="'+esc(a.alt||'')+'" style="width:100%;height:auto;display:block">';
    return ART['target'];
  }

  function cardHTML(x){
    var dl=(x.details||[]).map(function(d){return '<dt>'+esc(d[0])+'</dt><dd>'+esc(d[1])+'</dd>'}).join('');
    var body=(x.body||[]).map(function(p){return '<p>'+p+'</p>'}).join('');   /* body is trusted HTML from our own JSON */
    var src=(x.sources||[]).map(function(s){return '<a href="'+esc(s[1])+'" rel="noopener" target="_blank">'+esc(s[0])+'</a>'}).join(' · ');
    return (x.tags||[]).map(function(t){return '<span class="hx-tag" style="display:inline-block;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;background:var(--hx-ink);color:var(--hx-plaque);padding:1px 6px;border-radius:2px;margin-right:4px">'+esc(t)+'</span>'}).join('')+
      '<h2 id="hx-title">'+esc(x.title)+'</h2><p class="hx-sub">'+esc(x.subtitle||'')+'</p>'+artHTML(x.art)+
      (x.summary?'<p>'+esc(x.summary)+'</p>':'')+body+(dl?'<dl>'+dl+'</dl>':'')+(src?'<p class="hx-src"><strong>Sources:</strong> '+src+'</p>':'');
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
    var bPrev=btn('⏮','Previous exhibit','ghost'),bBack=btn('◀ Back','Walk back (hold)','ghost'),bOpen=btn('Read','Open the nearest exhibit'),bFwd=btn('Forward ▶','Walk forward (hold)','ghost'),bNext=btn('⏭','Next exhibit','ghost');
    [bPrev,bBack,bOpen,bFwd,bNext].forEach(function(b){hud.appendChild(b)});
    root.appendChild(stage); root.appendChild(now); root.appendChild(hint); root.appendChild(hud); root.appendChild(bar);
    setTimeout(function(){hint.classList.add('gone')},6000);
    // modal (one per page is fine; reuse if present)
    var modal=document.querySelector('.hx-modal');
    if(!modal){modal=h('div',{'class':'hx-modal',role:'dialog','aria-modal':'true','aria-labelledby':'hx-title'});modal.innerHTML='<div class="hx-card"><button type="button" class="hx-close" aria-label="Close">×</button><div class="hx-body"></div><div class="hx-nav"><button type="button" class="hx-btn ghost hx-mprev">◀ Prev</button><button type="button" class="hx-btn hx-mnext">Next ▶</button></div></div>';document.body.appendChild(modal);}
    var mBody=modal.querySelector('.hx-body');

    var W,H,G,START,L,D,P,segs=[],items=[],cam=0,target=0,vel=0,cur=-1,lastFocus=null,open=-1;
    var all=ex.concat(fin?[fin]:[]);
    function layout(){
      var sw=stage.clientWidth, sh=stage.clientHeight;
      W=Math.max(340,Math.min(820,sw*0.95)); H=Math.max(300,Math.min(520,sh*0.92));
      P=Math.min(300,W*0.46); G=Math.max(230,W*0.52); START=G*1.2; D=G*0.9;
      stage.style.perspective=Math.round(W*0.85)+'px';
      L=START+ex.length*G+W*0.9;
      world.innerHTML=''; segs=[]; items=[];
      var S=Math.round(W/3), n=Math.ceil(L/S)+1;
      for(var k=0;k<n;k++){
        var z=k*S;
        add('hx-floor',W,S,'translate3d('+(-W/2)+'px,'+(H/2)+'px,'+(-z)+'px) rotateX(-90deg)',z,S);
        add('hx-ceil',W,S,'translate3d('+(-W/2)+'px,'+(-H/2)+'px,'+(-z)+'px) rotateX(-90deg)',z,S);
        add('hx-wall',S,H,'translate3d('+(-W/2)+'px,'+(-H/2)+'px,'+(-z)+'px) rotateY(90deg)',z,S);
        add('hx-wall',S,H,'translate3d('+(W/2)+'px,'+(-H/2)+'px,'+(-z)+'px) rotateY(90deg)',z,S);
      }
      var end=h('div',{'class':'hx-end'}); end.style.width=W+'px'; end.style.height=H+'px'; end.style.transform='translate3d('+(-W/2)+'px,'+(-H/2)+'px,'+(-L)+'px)'; world.appendChild(end); segs.push({el:end,z:L,s:1});
      ex.forEach(function(x,i){
        var left=i%2===0, z=START+i*G, el=plaque(x,i), sc=P/300;
        var tx=(left?-1:1)*(W/2-P*0.27-8), ty=-H*0.06;
        el.style.transform='translate(-50%,-50%) translate3d('+tx+'px,'+ty+'px,'+(-z)+'px) rotateY('+(left?58:-58)+'deg) scale('+sc+')';
        world.appendChild(el); items.push({el:el,z:z});
        var lamp=h('div',{'class':'hx-lamp'}); lamp.style.transform='translate(-50%,-50%) translate3d('+tx+'px,'+(-H*0.38)+'px,'+(-z)+'px) rotateY('+(left?58:-58)+'deg)'; world.appendChild(lamp); segs.push({el:lamp,z:z,s:1});
      });
      if(fin){var fe=plaque(fin,ex.length,true),fs=Math.min(1,W*0.62/420); fe.style.transform='translate(-50%,-50%) translate3d(0px,'+(-H*0.04)+'px,'+(-(L-2))+'px) scale('+fs+')'; world.appendChild(fe); items.push({el:fe,z:L});}
      target=Math.min(target,maxCam()); cam=Math.min(cam,maxCam()); render(true);
    }
    function add(cls,w,hh,tr,z,s){var e=h('div',{'class':cls});e.style.width=w+'px';e.style.height=hh+'px';e.style.transform=tr;world.appendChild(e);segs.push({el:e,z:z,s:s});}
    function plaque(x,i,final){
      var b=h('button',{type:'button','class':'hx-plaque'+(final?' hx-final':''),'data-i':String(i),'aria-label':(final?'Final plaque: ':'Exhibit '+(i+1)+': ')+x.title});
      b.innerHTML=(x.tags&&x.tags[0]?'<span class="hx-tag">'+esc(x.tags[0])+'</span>':'')+artHTML(x.art)+'<span class="hx-pt">'+esc(x.plaqueTitle||x.title)+'</span><span class="hx-ps">'+esc(x.plaqueSub||x.subtitle||'')+'</span>';
      b.addEventListener('click',function(e){e.stopPropagation();if(dragMoved)return;goTo(i);show(i);});
      b.addEventListener('focus',function(){goTo(i)});
      return b;
    }
    function camFor(i){return i>=ex.length?maxCam():Math.max(0,START+i*G-D);}
    function maxCam(){return Math.max(0,L-W*0.75);}
    function goTo(i){target=camFor(i);}
    function nearest(v){if(v==null)v=cam;var best=0,bd=1e9;for(var i=0;i<all.length;i++){var d=Math.abs(camFor(i)-v);if(d<bd){bd=d;best=i;}}return best;}
    var persp=0;
    function render(force){
      persp=parseFloat(stage.style.perspective)||700;
      world.style.transform='translate3d(0,0,'+cam.toFixed(1)+'px)';
      for(var k=0;k<segs.length;k++){var s=segs[k],rel=cam-s.z;var hide=rel>persp*0.9;if(s.hid!==hide){s.el.style.visibility=hide?'hidden':'';s.hid=hide;}}
      for(var j=0;j<items.length;j++){var it=items[j],r2=cam-it.z;var hd=r2>persp*0.55;if(it.hid!==hd){it.el.style.visibility=hd?'hidden':'';it.hid=hd;}}
      var n=nearest(); if(n!==cur||force){if(items[cur])items[cur].el.classList.remove('is-near');cur=n;if(items[cur])items[cur].el.classList.add('is-near');
        var x=all[cur]; now.innerHTML='<span>'+(cur<ex.length?'Exhibit '+(cur+1)+' of '+ex.length:'End of the hall')+' · <b>'+esc(x.plaqueTitle||x.title)+'</b></span><span>'+(cur<ex.length?(cur%2===0?'◀ left wall':'right wall ▶'):'ahead')+'</span>';}
      bar.style.width=(maxCam()?cam/maxCam()*100:0)+'%';
    }
    function tick(){
      target=Math.max(0,Math.min(maxCam(),target+vel));
      var d=target-cam; cam=(reduce||Math.abs(d)<0.5)?target:cam+d*0.14;
      render(); requestAnimationFrame(tick);
    }
    function dismissHint(){hint.classList.add('gone');}
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
    stage.addEventListener('pointermove',function(e){if(sy===null)return;var dy=lastY-e.clientY;lastY=e.clientY;moved+=Math.abs(dy);if(moved>8){dragMoved=true;dismissHint();}target=Math.max(0,Math.min(maxCam(),target+dy*2.2));});
    function up(){sy=null;setTimeout(function(){dragMoved=false},0);}
    stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);stage.addEventListener('pointerleave',up);
    // HUD
    function hold(b,v){function on(e){e.preventDefault();vel=v;dismissHint();}function off(){vel=0;}b.addEventListener('pointerdown',on);['pointerup','pointerleave','pointercancel'].forEach(function(ev){b.addEventListener(ev,off)});b.addEventListener('click',function(){if(!vel)target=Math.max(0,Math.min(maxCam(),target+(v>0?G*0.6:-G*0.6)));});b.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();target=Math.max(0,Math.min(maxCam(),target+(v>0?G*0.6:-G*0.6)));}});}
    hold(bFwd,9);hold(bBack,-9);
    bNext.addEventListener('click',function(){step(1);dismissHint();});bPrev.addEventListener('click',function(){step(-1);dismissHint();});
    bOpen.addEventListener('click',function(){dismissHint();show(nearest())});
    // modal
    function show(i){open=i;var cs=getComputedStyle(root);['--hx-wall','--hx-wainscot','--hx-trim','--hx-ink','--hx-plaque','--hx-accent','--hx-ceil'].forEach(function(v){var val=cs.getPropertyValue(v);if(val)modal.style.setProperty(v,val.trim());});lastFocus=document.activeElement;mBody.innerHTML=cardHTML(all[i]);modal.classList.add('open');modal.querySelector('.hx-mprev').disabled=i<=0;modal.querySelector('.hx-mnext').disabled=i>=all.length-1;modal.querySelector('.hx-close').focus();
      if(all[i].id&&history.replaceState)history.replaceState(null,'','#'+all[i].id);}
    function hide(){modal.classList.remove('open');open=-1;if(history.replaceState)history.replaceState(null,'',location.pathname+location.search);if(lastFocus&&lastFocus.focus)lastFocus.focus();}
    modal.querySelector('.hx-close').onclick=hide;
    modal.onclick=function(e){if(e.target===modal)hide();};
    modal.querySelector('.hx-mprev').onclick=function(){step(-1,true)};
    modal.querySelector('.hx-mnext').onclick=function(){step(1,true)};
    modal.addEventListener('keydown',function(e){if(e.key!=='Tab')return;var f=modal.querySelectorAll('button:not([disabled]),a[href]');if(!f.length)return;var a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}});
    var ro=global.ResizeObserver?new ResizeObserver(function(){layout()}):null; if(ro)ro.observe(stage); else addEventListener('resize',layout);
    layout(); requestAnimationFrame(tick);
    // deep link #id
    var hid=location.hash.slice(1); if(hid){for(var q=0;q<all.length;q++)if(all[q].id===hid){target=cam=camFor(q);render(true);show(q);break;}}
    var api={show:show,hide:hide,goTo:goTo,layout:layout,get index(){return nearest()},get count(){return all.length},el:root};
    root.hallEngine=api; return api;
  }
  var HallEngine={mount:mount,art:ART,version:'1.0.0'};
  global.HallEngine=HallEngine;
  function auto(){[].forEach.call(document.querySelectorAll('[data-hall-src]'),function(el){if(!el.hallEngine&&!el.hasAttribute('data-hall-manual'))mount(el);});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',auto);else auto();
})(window);
