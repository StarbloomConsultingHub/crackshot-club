/* Crack Shot arcade: shared helpers (stage, input, synth audio, scores, share, overlay).
   Original code for 22 Crack Shot. MIT. */
(function(){
'use strict';
var CS=window.CS={};
// The lobby carries the 18+ gate; keep the requested game for the return trip.
var ageConfirmed=false;
try{ageConfirmed=localStorage.getItem('crackshot-age-ok-v1')==='yes'}catch(e){}
if(!ageConfirmed){location.replace('/games?returnTo='+encodeURIComponent(location.pathname+location.search+location.hash))}

CS.PAL={red:'#C41E3A',cream:'#F3E6C8',navy:'#1C2E4A',brass:'#C4A354',paper:'#FBF4E2',ink:'#1C2E4A',dark:'#121e31',tan:'#D7BF83'};
const motion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
CS.reduceMotion = function () { return Boolean(motion && motion.matches); };
CS.rand=function(a,b){return a+Math.random()*(b-a)};
CS.clamp=function(v,a,b){return v<a?a:v>b?b:v};
CS.lerp=function(a,b,t){return a+(b-a)*t};
CS.ease=function(t){return 1-Math.pow(1-t,3)};

/* ---------- stage: logical resolution that adapts to landscape / portrait ---------- */
CS.stage=function(canvas,onResize){
  var ctx=canvas.getContext('2d'),st={W:960,H:600,k:1,ctx:ctx,canvas:canvas,portrait:false};
  function fit(){
    var box=canvas.parentElement.getBoundingClientRect(),cw=Math.max(200,box.width),ch=Math.max(200,box.height),asp=cw/ch,W,H;
    if(asp>=0.95){W=960;H=Math.round(CS.clamp(W/asp,520,760));st.portrait=false}
    else{W=540;H=Math.round(CS.clamp(W/asp,700,1170));st.portrait=true}
    var s=Math.min(cw/W,ch/H),dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.style.width=Math.round(W*s)+'px';canvas.style.height=Math.round(H*s)+'px';
    canvas.width=Math.round(W*s*dpr);canvas.height=Math.round(H*s*dpr);
    st.W=W;st.H=H;st.k=s*dpr;st.css=s;
    onResize&&onResize(st);
  }
  st.fit=fit;
  st.begin=function(){ctx.setTransform(st.k,0,0,st.k,0,0)};
  st.toLogical=function(e){var r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*st.W,y:(e.clientY-r.top)/r.height*st.H}};
  var t;window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(fit,60)});
  window.addEventListener('orientationchange',function(){setTimeout(fit,250)});
  fit();
  return st;
};

/* ---------- pointer input (mouse + touch + pen via Pointer Events) ---------- */
CS.input=function(st,h){
  var c=st.canvas;
  c.style.touchAction='none';
  c.addEventListener('pointermove',function(e){h.move&&h.move(st.toLogical(e),e.pointerType)});
  c.addEventListener('pointerdown',function(e){e.preventDefault();CS.audio.unlock();h.down&&h.down(st.toLogical(e),e.pointerType)});
  c.addEventListener('pointerleave',function(e){h.leave&&h.leave(e.pointerType)});
  c.addEventListener('contextmenu',function(e){e.preventDefault()});
};

/* ---------- WebAudio synth: every sound is generated, no samples ---------- */
CS.audio=(function(){
  var A={},ctx=null,master=null,noiseBuf=null,muted=false;
  try{muted=localStorage.getItem('cs-arcade-muted')==='1'}catch(e){}
  A.unlock=function(){
    if(!ctx){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=muted?0:0.55;
      var comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination);
      noiseBuf=ctx.createBuffer(1,ctx.sampleRate*1,ctx.sampleRate);var d=noiseBuf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
    if(ctx.state==='suspended')ctx.resume();
  };
  A.isMuted=function(){return muted};
  A.setMuted=function(m){muted=m;try{localStorage.setItem('cs-arcade-muted',m?'1':'0')}catch(e){}if(master)master.gain.setTargetAtTime(m?0:0.55,ctx.currentTime,0.02)};
  function ok(){return ctx&&!muted}
  function env(g,t,a,peak,dec){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec)}
  function osc(type,f,t,dur,peak,dest,a){var o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);env(g,t,a||0.003,peak,dur);o.connect(g);g.connect(dest||master);o.start(t);o.stop(t+dur+0.05);return o}
  function noise(t,dur,peak,ftype,freq,q,dest){var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuf;s.playbackRate.value=CS.rand(0.9,1.1);f.type=ftype;f.frequency.setValueAtTime(freq,t);if(q)f.Q.value=q;env(g,t,0.002,peak,dur);s.connect(f);f.connect(g);g.connect(dest||master);s.start(t,Math.random()*0.5);s.stop(t+dur+0.05);return f}
  A.shot=function(big){if(!ok())return;var t=ctx.currentTime;
    noise(t,big?0.22:0.12,big?0.9:0.6,'lowpass',big?2600:4200,0.7);
    noise(t,0.04,0.5,'highpass',3000,0.5);
    var o=osc('sine',big?140:190,t,big?0.18:0.1,big?0.8:0.45);o.frequency.exponentialRampToValueAtTime(45,t+0.15)};
  A.ding=function(pitch){if(!ok())return;var t=ctx.currentTime,f=pitch||1046;
    [[1,0.5,1.6],[2.76,0.22,0.9],[5.4,0.12,0.5],[8.93,0.06,0.3]].forEach(function(p){osc('sine',f*p[0],t,p[2],p[1],null,0.002)})};
  A.clank=function(){if(!ok())return;var t=ctx.currentTime,b=CS.rand(280,360);
    [1,1.47,2.09,2.93].forEach(function(m,i){osc(i%2?'square':'triangle',b*m,t,0.16-i*0.025,0.18/(i+1))});
    noise(t,0.07,0.35,'bandpass',2400,2)};
  A.crunch=function(){if(!ok())return;var t=ctx.currentTime;
    for(var i=0;i<5;i++){noise(t+i*0.018+Math.random()*0.01,0.03+Math.random()*0.03,0.5,'bandpass',CS.rand(1800,5200),1.5)}
    noise(t,0.12,0.25,'highpass',2500,0.7)};
  A.thunk=function(){if(!ok())return;var t=ctx.currentTime;noise(t,0.06,0.25,'lowpass',700,1);};
  A.click=function(){if(!ok())return;var t=ctx.currentTime;osc('square',1800,t,0.015,0.12);osc('square',900,t+0.03,0.015,0.08)};
  A.tick=function(){if(!ok())return;osc('square',1320,ctx.currentTime,0.03,0.08)};
  A.pump=function(){if(!ok())return;var t=ctx.currentTime;noise(t+0.06,0.03,0.18,'bandpass',1400,3);noise(t+0.14,0.03,0.2,'bandpass',1100,3)};
  A.whoosh=function(){if(!ok())return;var t=ctx.currentTime,f=noise(t,0.35,0.22,'bandpass',500,1.4);f.frequency.exponentialRampToValueAtTime(2600,t+0.3);
    var o=osc('square',70,t,0.09,0.25);o.frequency.exponentialRampToValueAtTime(40,t+0.08)};
  A.caw=function(laugh){if(!ok())return;var t=ctx.currentTime,n=laugh?3:1;
    for(var i=0;i<n;i++){var s=t+i*0.22,o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type='sawtooth';
      o.frequency.setValueAtTime(laugh?620:560,s);o.frequency.exponentialRampToValueAtTime(laugh?380:330,s+0.16);f.type='bandpass';f.frequency.value=1300;f.Q.value=2.5;
      env(g,s,0.01,0.35,0.16);o.connect(f);f.connect(g);g.connect(master);o.start(s);o.stop(s+0.25)}};
  A.tune=function(notes,step,type){if(!ok())return;var t=ctx.currentTime+0.02;
    notes.forEach(function(n,i){if(n==null)return;var f=440*Math.pow(2,(n-69)/12);osc(type||'square',f,t+i*step,step*1.6,0.09);osc('triangle',f/2,t+i*step,step*1.6,0.07)})};
  A.fanfare=function(){A.tune([67,72,76,79,null,76,79],0.09)};
  A.sad=function(){A.tune([67,66,65,64],0.16,'triangle')};
  A.start=function(){A.tune([60,64,67,72,67,72],0.075)};
  return A;
})();

/* ---------- local high scores ---------- */
CS.hi=function(key){var k='cs-arcade-'+key;return{get:function(){try{return +localStorage.getItem(k)||0}catch(e){return 0}},
  set:function(v){try{var o=+localStorage.getItem(k)||0;if(v>o){localStorage.setItem(k,String(v));return true}}catch(e){}return false}}};

/* ---------- copy-to-clipboard share text (never posts anywhere) ---------- */
CS.copy=function(text,btn){
  function done(ok){if(!btn)return;var o=btn.getAttribute('data-label')||btn.textContent;btn.setAttribute('data-label',o);btn.textContent=ok?'Copied! Paste it anywhere':'Select & copy the text above';setTimeout(function(){btn.textContent=o},2200)}
  function fallback(){var ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}document.body.removeChild(ta);done(ok)}
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(function(){done(true)},fallback)}else fallback();
};
CS.fmt=function(n){return Math.round(n).toLocaleString('en-US')};

/* ---------- DOM overlay + top bar buttons ---------- */
CS.ui=function(opt){
  var ov=document.getElementById('ov'),pb=document.getElementById('pauseBtn'),mb=document.getElementById('muteBtn');
  function muteIcon(){var m=CS.audio.isMuted();mb.setAttribute('aria-pressed',m);mb.setAttribute('aria-label',m?'Unmute sound':'Mute sound');
    mb.innerHTML=m?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l5 6M21 9l-5 6" stroke-width="2.2" fill="none"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke-width="2" fill="none"/></svg>'}
  mb.addEventListener('click',function(){CS.audio.unlock();CS.audio.setMuted(!CS.audio.isMuted());muteIcon();});muteIcon();
  pb.addEventListener('click',function(){opt.togglePause();});
  document.addEventListener('keydown',function(e){
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
    const target = e.target;
    if (target.isContentEditable || target.closest?.('input,textarea,select')) return;
    var k=e.key.toLowerCase();
    if(k==='p'||k==='escape'){opt.togglePause();e.preventDefault()}
    else if(k==='m'){CS.audio.unlock();CS.audio.setMuted(!CS.audio.isMuted());muteIcon()}
    else if ((k === ' ' || k === 'enter') && opt.primary) {
      if (target.closest?.('button,a[href],summary,[role="button"]')) return;
      if (!e.repeat && opt.primary()) e.preventDefault();
    }
  });
  document.addEventListener('visibilitychange',function(){if(document.hidden&&opt.autoPause)opt.autoPause()});
  return{
    show:function(html){ov.innerHTML='<div class="panel">'+html+'</div>';ov.classList.add('on');var b=ov.querySelector('[data-focus]');if(b)setTimeout(function(){b.focus({preventScroll:true})},30);return ov},
    hide:function(){ov.classList.remove('on');ov.innerHTML=''},
    on:function(){return ov.classList.contains('on')},
    pauseIcon:function(p){pb.innerHTML=p?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';pb.setAttribute('aria-label',p?'Resume':'Pause')},
    el:ov
  };
};

/* ---------- small particle helper ---------- */
CS.particles=function(){
  var P=[];return{list:P,
    add:function(p){P.push(p)},
    update:function(dt){for(var i=P.length-1;i>=0;i--){var p=P[i];p.t+=dt;if(p.t>=p.life){P.splice(i,1);continue}
      p.vy+=(p.g||0)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.vr)p.rot=(p.rot||0)+p.vr*dt;if(p.drag){p.vx*=1-p.drag*dt;p.vy*=1-p.drag*dt}}},
    clear:function(){P.length=0}};
};
CS.loop=function(fn){var last=performance.now();function f(now){var dt=Math.min(0.05,(now-last)/1000);last=now;fn(dt,now/1000);requestAnimationFrame(f)}requestAnimationFrame(f)};
})();
