/* Crack Shot: an original thrown-cracker shot-shell game for 22 Crack Shot.
   Inspired by classic light-gun games; all art, code, and sound are original. MIT. */
(function(){
'use strict';
var P=CS.PAL,R=CS.rand,A=CS.audio,TAU=Math.PI*2,lerp=CS.lerp;
var cv=document.getElementById('c'),L={},st,ctx,bg=document.createElement('canvas'),parts=CS.particles(),pops=[],halves=[];
var HI=CS.hi('crackshot'),HIS=CS.hi('crackshot-sleeve');
var SLEEVE=25,THROWS=13; // 12 pairs + 1 single = 25 crackers, same as the club's Cracker Count string
var g={mode:'title',sleeve:1,score:0,res:[],throwIdx:0,phase:'pull',phaseT:0,shots:3,crackers:[],paused:false,successfulShots:0,shotsFired:0,best:0,stop:0,shake:0,flash:0,crow:{y:0,mood:'',t:0},outcome:'',cleanCount:0,sleeveBreaks:[]};
var aim={x:480,y:260,show:false,tap:0,kick:0,pellets:[],pt:0,over:false};
var img=new Image();img.src='/games/assets/cracker.png';
st=CS.stage(cv,layout);ctx=st.ctx;

function cfg(){var n=g.sleeve;return{T:Math.max(1.05,2.55*Math.pow(0.86,n-1)),quota:Math.min(22,15+2*(n-1)),stagger:n>=3?0.35:0.15,spread:Math.min(0.46,0.3+n*0.03)}}

/* ---------------- layout + background ---------------- */
function layout(s){
  st=s;var W=st.W,H=st.H;L.W=W;L.H=H;
  L.hud=Math.round(H*(st.portrait?0.15:0.135));L.groundBottom=H-L.hud;
  L.horizon=Math.round(H*(st.portrait?0.6:0.58));
  L.trapW=st.portrait?130:150;L.trapH=st.portrait?50:54;L.trapX=W/2;L.trapTop=L.groundBottom-L.trapH-(st.portrait?26:18);
  L.pr=st.portrait?36:31; // shot pattern radius
  L.cr=st.portrait?40:36; // cracker radius at launch
  cacheBG();
}
function cacheBG(){
  var W=L.W,H=L.H,b;bg.width=Math.round(W*st.k);bg.height=Math.round(H*st.k);b=bg.getContext('2d');b.setTransform(st.k,0,0,st.k,0,0);
  var gr=b.createLinearGradient(0,0,0,L.horizon);gr.addColorStop(0,'#1C2E4A');gr.addColorStop(0.45,'#3e4f6c');gr.addColorStop(0.8,'#c9a87a');gr.addColorStop(1,'#F3E6C8');
  b.fillStyle=gr;b.fillRect(0,0,W,L.horizon+2);
  // stars
  b.fillStyle='rgba(243,230,200,.55)';for(var i=0;i<40;i++){var sx=(i*137.5)%W,sy=(i*71.3)%(L.horizon*0.35);b.fillRect(sx,sy,1.6,1.6)}
  // setting sun with carnival stripes
  var sunX=W*(st.portrait?0.72:0.76),sunY=L.horizon-8,sunR=st.portrait?70:92;
  b.save();b.beginPath();b.arc(sunX,sunY,sunR,0,TAU);b.clip();b.fillStyle=P.brass;b.fillRect(sunX-sunR,sunY-sunR,sunR*2,sunR*2);
  b.fillStyle='#d9b96a';for(var k=0;k<5;k++)b.fillRect(sunX-sunR,sunY-sunR*0.15-k*sunR*0.22,sunR*2,sunR*0.07+k*0.6);b.restore();
  // ferris wheel silhouette far away (midway on the horizon)
  var fx=W*(st.portrait?0.2:0.16),fy=L.horizon-62,fr=48;b.strokeStyle='rgba(28,46,74,.55)';b.lineWidth=2;b.beginPath();b.arc(fx,fy,fr,0,TAU);b.stroke();
  for(i=0;i<12;i++){var a=i*TAU/12;b.beginPath();b.moveTo(fx,fy);b.lineTo(fx+Math.cos(a)*fr,fy+Math.sin(a)*fr);b.stroke();b.fillStyle='rgba(196,30,58,.6)';b.fillRect(fx+Math.cos(a)*fr-3,fy+Math.sin(a)*fr,6,6)}
  b.beginPath();b.moveTo(fx-24,L.horizon);b.lineTo(fx,fy);b.lineTo(fx+24,L.horizon);b.stroke();
  // treeline
  b.fillStyle='#1C2E4A';b.beginPath();b.moveTo(0,L.horizon);var x=0;while(x<W+40){var r=R(16,34);b.arc(x+r,L.horizon-R(4,22),r,Math.PI,0);x+=r*1.5}b.lineTo(W,L.horizon+4);b.lineTo(0,L.horizon+4);b.fill();
  // field (stubble, brass/tan bands)
  gr=b.createLinearGradient(0,L.horizon,0,L.groundBottom);gr.addColorStop(0,'#8f7a45');gr.addColorStop(1,'#C4A354');b.fillStyle=gr;b.fillRect(0,L.horizon,W,L.groundBottom-L.horizon);
  b.strokeStyle='rgba(28,46,74,.12)';b.lineWidth=1;for(var yy=L.horizon+6,step=4;yy<L.groundBottom;yy+=step,step*=1.18){b.beginPath();b.moveTo(0,yy);b.lineTo(W,yy);b.stroke()}
  // fence
  var fyy=L.horizon+(L.groundBottom-L.horizon)*0.28;b.fillStyle=P.cream;b.fillRect(0,fyy-14,W,4);b.fillRect(0,fyy-4,W,3);
  for(x=6;x<W;x+=20){b.beginPath();b.moveTo(x,fyy+8);b.lineTo(x,fyy-20);b.lineTo(x+4,fyy-25);b.lineTo(x+8,fyy-20);b.lineTo(x+8,fyy+8);b.closePath();b.fill()}
  b.fillStyle='rgba(28,46,74,.25)';b.fillRect(0,fyy+8,W,4);
  // HUD panel
  b.fillStyle=P.navy;b.fillRect(0,L.groundBottom,W,L.hud);b.fillStyle=P.brass;b.fillRect(0,L.groundBottom,W,4);
}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){if(L.W)cacheBG()});

/* ---------------- flow ---------------- */
function newGame(){g.sleeve=1;g.score=0;g.best=0;g.successfulShots=0;g.shotsFired=0;g.cleanCount=0;g.sleeveBreaks=[];startSleeve()}
function startSleeve(){
  g.res=[];for(var i=0;i<SLEEVE;i++)g.res.push(null);g.throwIdx=0;g.crackers=[];halves.length=0;pops.length=0;parts.clear();
  g.mode='play';g.paused=false;ui.hide();ui.pauseIcon(false);
  var c=cfg();g.banner={t:0,dur:1.8,text:'SLEEVE '+g.sleeve,sub:'25 CRACKERS \u00b7 BREAK '+c.quota+' TO MOVE ON'};
  setPhase('pull',1.9);A.start();
}
function setPhase(p,t){g.phase=p;g.phaseT=t||0}
function slotStart(i){return i*2}
function launch(){
  var c=cfg(),i=g.throwIdx,n=i<THROWS-1?2:1,base=slotStart(i),side=Math.random()<0.5?-1:1;
  g.shots=3;g.crackers=[];
  for(var k=0;k<n;k++){
    var s=n===2?(k?side:-side):(Math.random()<0.5?-1:1),x1=L.W/2+s*R(0.12,c.spread)*L.W*(st.portrait?1.05:1);
    var y0=L.trapTop+4,y1=L.horizon-R(6,30),yA=L.H*R(st.portrait?0.13:0.1,st.portrait?0.3:0.3);
    g.crackers.push({slot:base+k,t:-(k*R(0,c.stagger)),T:c.T*R(0.92,1.1),x0:L.trapX+R(-12,12),y0:y0,x1:x1,y1:y1,A:(y0+y1)/2-yA,rot:R(0,TAU),spin:R(4,9)*(Math.random()<0.5?-1:1),state:'fly',x:L.trapX,y:y0,s:1,trail:[]});
  }
  A.whoosh();setPhase('flight');
}
function posC(c){var u=CS.clamp(c.t/c.T,0,1),ue=1-Math.pow(1-u,1.5);c.u=u;c.x=lerp(c.x0,c.x1,ue);c.y=lerp(c.y0,c.y1,u)-c.A*4*u*(1-u);c.s=lerp(1,0.34,ue);c.r=L.cr*c.s}
function endThrow(){
  var all=g.crackers.every(function(c){return c.state==='broken'});
  g.outcome=all?'happy':'laugh';g.crow={y:0,mood:g.outcome,t:0};
  if(all)A.caw(false);else A.caw(true);
  setPhase('react',1.25);
}
function nextThrow(){
  g.throwIdx++;
  if(g.throwIdx>=THROWS)endSleeve();else setPhase('pull',0.75);
}
function breaks(){return g.res.filter(function(r){return r==='hit'}).length}
function endSleeve(){
  g.mode='between';var b=breaks(),c=cfg(),pass=b>=c.quota,clean=b===SLEEVE,bonus=0;
  g.sleeveBreaks.push(b);if(b>g.best)g.best=b;HIS.set(b);
  if(clean){bonus=2000*g.sleeve;g.cleanCount++;g.score+=bonus}
  if(!pass){finalScreen(b);return}
  A.fanfare();
  ui.show('<p class="kicker">Sleeve '+g.sleeve+' done</p><h2>'+(clean?'Clean Sleeve!':'Cracker Count: '+b+'/25')+'</h2>'+
    sleeveRow()+
    '<div class="stats"><span><b>'+b+'/25</b>breaks</span><span><b>'+c.quota+'</b>needed</span><span><b>'+CS.fmt(g.score)+'</b>score</span></div>'+
    (clean?'<p><span class="badge">Clean Sleeve +'+CS.fmt(bonus)+'</span></p>':'')+
    '<p>Next sleeve throws faster and needs <strong>'+Math.min(22,c.quota+2)+'</strong>.</p>'+
    '<div class="btns"><button data-focus data-act="next">Sleeve '+(g.sleeve+1)+' \u2192</button></div>');
}
function sleeveRow(){return '<p aria-hidden="true" style="letter-spacing:2px;font-size:1.1rem;line-height:1.2;word-break:break-all">'+g.res.map(function(r){return r==='hit'?'<span style="color:#b8913a">\u25CF</span>':'<span style="color:#C41E3A">\u00d7</span>'}).join('')+'</p>'}
function finalScreen(lastB){
  g.mode='over';A.sad();
  var isNew=HI.set(g.score),hi=HI.get(),bestS=HIS.get(),acc=g.shotsFired?Math.round(g.successfulShots/g.shotsFired*100):0;
  var title=g.cleanCount?'Clean Sleeve club':g.best>=22?'Crack Shot':g.best>=18?'Sharpshooter':g.best>=15?'Cracker Smasher':'Crumb Bum';
  var share='Cracker Count (arcade): best sleeve '+g.best+'/25, '+g.sleeveBreaks.length+' sleeve'+(g.sleeveBreaks.length>1?'s':'')+', '+CS.fmt(g.score)+' pts in Crack Shot, the thrown-cracker game from 22 Crack Shot. Can you clean a sleeve? '+location.origin+'/games/crackshot';
  ui.show('<p class="kicker">Out of crackers \u00b7 sleeve '+g.sleeve+'</p><h2>'+title+'</h2><p class="big">'+CS.fmt(g.score)+'</p>'+(isNew?'<p class="new">\u2605 New high score \u2605</p>':'<p>High score: <strong>'+CS.fmt(hi)+'</strong></p>')+
    sleeveRow()+
    '<div class="stats"><span><b>'+lastB+'/25</b>last sleeve (needed '+cfg().quota+')</span><span><b>'+bestS+'/25</b>best ever</span><span><b>'+acc+'%</b>shots that broke</span></div>'+
    '<textarea rows="3" readonly aria-label="Share text">'+share+'</textarea>'+
    '<div class="btns"><button data-act="share">Copy my score</button><button class="ghost" data-focus data-act="again">Play again</button><a class="btn ghost" href="/cracker-count">Real Cracker Count</a></div>'+
    '<p class="fine">Copying just puts the text on your clipboard. Nothing is posted.</p>');
  ui.el.querySelector('[data-act=share]').onclick=function(){CS.copy(share,this)};
}
function titleScreen(){
  g.mode='title';
  ui.show('<p class="kicker">22 Crack Shot Arcade</p><h2>Crack Shot</h2>'+
    '<p>A sleeve of 25 crackers and a crow keeping score. Tap or click the flying crackers and see how far you can go.</p>'+
    '<div class="btns"><button data-focus data-act="start">Play Crack Shot</button></div>'+
    '<details class="cabinet-rules"><summary>Scoring and controls</summary><ul><li>A sleeve contains 25 crackers. A complete sleeve of breaks earns the Clean Sleeve badge.</li><li>Your score counts both crackers in a double break. Accuracy counts a successful click or tap once.</li><li>Each completed quota unlocks the next sleeve.</li></ul><p>P or Esc to pause. M to mute.</p></details>'+
    '<p class="fine">Personal best · '+CS.fmt(HI.get())+' points</p>');
}
function pauseScreen(){
  ui.show('<p class="kicker">Crack Shot</p><h2>Paused</h2><p>Sleeve '+g.sleeve+' \u00b7 '+breaks()+' broken \u00b7 score '+CS.fmt(g.score)+'</p>'+
    '<div class="btns"><button data-focus data-act="resume">Resume</button><button class="ghost" data-act="restart">Restart</button><a class="btn ghost" href="/games">Quit</a></div>');
}
function togglePause(){if(g.mode!=='play')return;g.paused=!g.paused;ui.pauseIcon(g.paused);if(g.paused)pauseScreen();else ui.hide()}
var ui=CS.ui({togglePause:togglePause,autoPause:function(){if(g.mode==='play'&&!g.paused)togglePause()},
  primary:function(){var b=ui.on()&&ui.el.querySelector('[data-focus]');if(b&&document.activeElement!==b){b.click();return true}return false}});
ui.el.addEventListener('click',function(e){var b=e.target.closest('[data-act]');if(!b)return;A.unlock();var a=b.getAttribute('data-act');
  if(a==='start'||a==='again'||a==='restart')newGame();else if(a==='resume')togglePause();else if(a==='next'){g.sleeve++;startSleeve()}});

/* ---------------- shooting ---------------- */
function fire(p){
  if(g.mode!=='play'||g.paused||g.banner)return 0;
  if(g.phase!=='flight'){return 0}
  if(g.shots<=0){A.click();return 0}
  g.shots--;g.shotsFired++;A.shot(true);g.flash=1;g.shake=Math.max(g.shake,3);aim.kick=1;aim.x=p.x;aim.y=p.y;
  aim.pellets=[];for(var i=0;i<22;i++){var a=R(0,TAU),r=Math.sqrt(Math.random())*L.pr;aim.pellets.push([p.x+Math.cos(a)*r,p.y+Math.sin(a)*r])}aim.pt=0.18;
  var hits=[];
  g.crackers.forEach(function(c){if(c.state!=='fly'||c.t<=0)return;var d=Math.hypot(p.x-c.x,p.y-c.y);
    if(d<=L.pr+c.r*0.72){hits.push({c:c,smoked:d<=L.pr*0.42+c.r*0.45})}});
  if (hits.length) g.successfulShots++;
  hits.forEach(function(h){var c=h.c;c.state='broken';g.res[c.slot]='hit';
    var pts=(h.smoked?150:100)*g.sleeve;g.score+=pts;
    pops.push({x:c.x,y:c.y-c.r-8,t:0,text:(h.smoked?'SMOKED! ':'BREAK! ')+'+'+pts,col:h.smoked?P.cream:P.brass,big:h.smoked});
    burst(c,h.smoked)});
  if(hits.length===2){var bonus=500*g.sleeve;g.score+=bonus;pops.push({x:(hits[0].c.x+hits[1].c.x)/2,y:Math.min(hits[0].c.y,hits[1].c.y)-60,t:0,text:'TWO-FER! +'+bonus,col:P.red,big:true,life:1.3});A.tune([72,76,79,84],0.05)}
  if(hits.length){A.crunch();g.stop=0.05;g.shake=6}else A.thunk();
  return hits.length;
}
function burst(c,smoked){
  var n=smoked?42:14,sc=c.s;
  for(var i=0;i<n;i++){var a=R(0,TAU),sp=R(40,smoked?340:200)*(0.6+sc*0.6);parts.add({x:c.x+R(-c.r*0.5,c.r*0.5),y:c.y+R(-c.r*0.5,c.r*0.5),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-80,g:700,drag:0.6,t:0,life:R(0.7,1.3),k:'crumb',sz:R(1.6,5.2)*(0.5+sc),c:Math.random()<0.55?P.tan:(Math.random()<0.5?P.brass:'#e8d4a0'),rot:R(0,TAU),vr:R(-14,14)})}
  for(i=0;i<(smoked?10:4);i++)parts.add({x:c.x,y:c.y,vx:R(-60,60),vy:R(-60,20),g:-20,t:0,life:R(0.4,0.8),k:'dust',sz:R(4,9)*(0.5+sc),c:'rgba(232,212,160,.55)'});
  if(!smoked){var a0=R(0,Math.PI);for(var k=0;k<2;k++){var dir=k?1:-1;halves.push({x:c.x,y:c.y,r:c.r,rot:c.rot,cut:a0,side:k,vx:Math.cos(a0+Math.PI/2)*dir*R(60,120),vy:R(-160,-60),vr:dir*R(3,7),t:0})}}
  else for(i=0;i<4;i++){parts.add({x:c.x,y:c.y,vx:R(-200,200),vy:R(-260,-60),g:800,t:0,life:1.2,k:'chunk',sz:c.r*R(0.22,0.34),rot:R(0,TAU),vr:R(-10,10),c:P.tan})}
}
CS.input(st,{
  move:function(p,type){aim.x=p.x;aim.y=p.y;aim.show=type==='mouse'||type==='pen'},
  down:function(p,type){aim.x=p.x;aim.y=p.y;if(type!=='mouse'){aim.tap=0.5;aim.show=false}else aim.show=true;fire(p)},
  leave:function(type){if(type==='mouse')aim.show=false}
});

/* ---------------- update ---------------- */
function update(dt){
  if(g.paused)return;
  if(g.stop>0){g.stop-=dt;return}
  if(g.banner){g.banner.t+=dt;if(g.banner.t>=g.banner.dur)g.banner=null}
  if(g.mode==='play'&&!g.banner){
    g.phaseT-=dt;
    if(g.phase==='pull'&&g.phaseT<=0)launch();
    else if(g.phase==='flight'){
      var flying=0;
      g.crackers.forEach(function(c){if(c.state!=='fly')return;c.t+=dt;posC(c);if(c.t>0){c.rot+=c.spin*dt;c.trail.push([c.x,c.y,c.r]);if(c.trail.length>6)c.trail.shift()}
        if(c.u>=1){c.state='miss';g.res[c.slot]='miss'}else flying++});
      if(!flying)endThrow();
    }
    else if(g.phase==='react'){g.crow.t+=dt;if(g.phaseT<=0)nextThrow()}
  }
  // aim feedback: ring warms when a cracker is inside it
  aim.over=g.crackers.some(function(c){return c.state==='fly'&&c.t>0&&Math.hypot(aim.x-c.x,aim.y-c.y)<=L.pr+c.r*0.72});
  halves.forEach(function(h){h.t+=dt;h.vy+=700*dt;h.x+=h.vx*dt;h.y+=h.vy*dt;h.rot+=h.vr*dt});for(var i=halves.length-1;i>=0;i--)if(halves[i].t>1.3)halves.splice(i,1);
  for(i=pops.length-1;i>=0;i--){pops[i].t+=dt;if(pops[i].t>(pops[i].life||1))pops.splice(i,1)}
  parts.update(dt);
  g.flash=Math.max(0,g.flash-dt*12);g.shake=Math.max(0,g.shake-dt*30);aim.kick=Math.max(0,aim.kick-dt*6);aim.tap=Math.max(0,aim.tap-dt);aim.pt=Math.max(0,aim.pt-dt);
}

/* ---------------- draw ---------------- */
function drawCracker(x,y,r,rot,alpha){if(!img.complete||!img.naturalWidth){ctx.fillStyle=P.tan;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();return}
  ctx.save();ctx.globalAlpha=alpha==null?1:alpha;ctx.translate(x,y);ctx.rotate(rot);ctx.drawImage(img,-r,-r,r*2,r*2);ctx.restore()}
function draw(){
  st.begin();var W=L.W,H=L.H,i;
  ctx.save();if(g.shake>0 && !CS.reduceMotion())ctx.translate(R(-g.shake,g.shake),R(-g.shake,g.shake));
  ctx.drawImage(bg,0,0,W,H);
  if(g.flash>0 && !CS.reduceMotion()){ctx.fillStyle='rgba(255,246,214,'+(g.flash*0.12)+')';ctx.fillRect(0,0,W,L.groundBottom)}
  // crow behind trap house
  drawCrow();
  // trap house
  drawTrap();
  // crackers
  g.crackers.forEach(function(c){if(c.state!=='fly'||c.t<=0)return;
    c.trail.forEach(function(tp,j){drawCracker(tp[0],tp[1],tp[2],c.rot,0.06*j)});
    ctx.fillStyle='rgba(28,46,74,.18)';ctx.beginPath();ctx.ellipse(c.x+c.r*0.15,c.y+c.r*0.2,c.r*1.02,c.r*1.02,0,0,TAU);ctx.fill();
    drawCracker(c.x,c.y,c.r,c.rot)});
  halves.forEach(function(h){var a=h.t>0.9?1-(h.t-0.9)/0.4:1;ctx.save();ctx.globalAlpha=a;ctx.translate(h.x,h.y);ctx.rotate(h.rot);ctx.beginPath();
    ctx.rotate(h.cut);ctx.rect(-h.r-2,h.side?0:-h.r-2,h.r*2+4,h.r+2);ctx.rotate(-h.cut);ctx.clip();if(img.naturalWidth)ctx.drawImage(img,-h.r,-h.r,h.r*2,h.r*2);ctx.restore()});
  parts.list.forEach(function(p){ctx.globalAlpha=1-p.t/p.life;ctx.fillStyle=p.c;
    if(p.k==='crumb'||p.k==='chunk'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot||0);ctx.beginPath();ctx.moveTo(-p.sz,-p.sz*0.6);ctx.lineTo(p.sz*0.9,-p.sz*0.8);ctx.lineTo(p.sz,p.sz*0.4);ctx.lineTo(-p.sz*0.2,p.sz);ctx.closePath();ctx.fill();
      if(p.k==='chunk'){ctx.strokeStyle=P.brass;ctx.lineWidth=1.5;ctx.stroke()}ctx.restore()}
    else{ctx.beginPath();ctx.arc(p.x,p.y,p.sz*(1+p.t*2.5),0,TAU);ctx.fill()}});ctx.globalAlpha=1;
  pops.forEach(function(p){var life=p.life||1,k=p.t/life;ctx.globalAlpha=k>0.7?1-(k-0.7)/0.3:1;var sz=(p.big?26:20)*(p.t<0.1?0.6+p.t*4:1);
    ctx.font='400 '+sz+'px Rye, Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;ctx.strokeStyle=P.navy;var y=p.y-p.t*36,x=CS.clamp(p.x,90,W-90);ctx.strokeText(p.text,x,y);ctx.fillStyle=p.col;ctx.fillText(p.text,x,y)});ctx.globalAlpha=1;
  // PULL! call
  if(g.mode==='play'&&g.phase==='pull'&&!g.banner&&g.phaseT<0.6){var k=1-g.phaseT/0.6;ctx.globalAlpha=Math.min(1,k*3);ctx.font='400 '+(30+k*10)+'px Rye, Georgia, serif';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle=P.navy;ctx.strokeText('PULL!',L.trapX,L.trapTop-40-k*20);ctx.fillStyle=P.cream;ctx.fillText('PULL!',L.trapX,L.trapTop-40-k*20);ctx.globalAlpha=1}
  ctx.restore();
  drawHUD();
  drawAim();
  if(g.banner)drawBanner();
}
function drawTrap(){
  var x=L.trapX,w=L.trapW,h=L.trapH,y=L.trapTop;
  ctx.fillStyle='rgba(28,46,74,.3)';ctx.beginPath();ctx.ellipse(x,y+h+4,w*0.6,8,0,0,TAU);ctx.fill();
  ctx.save();ctx.beginPath();ctx.rect(x-w/2,y,w,h);ctx.clip();for(var i=0;i<10;i++){ctx.fillStyle=i%2?P.cream:P.red;ctx.fillRect(x-w/2+i*w/10,y,w/10+1,h)}ctx.restore();
  ctx.fillStyle=P.navy;ctx.fillRect(x-w/2-8,y-10,w+16,12);ctx.fillStyle=P.brass;ctx.fillRect(x-w/2-8,y-12,w+16,3);
  ctx.fillStyle='#0b1322';ctx.fillRect(x-22,y-14,44,5);
  ctx.fillStyle=P.navy;var sw=w*0.66,sh=h*0.42;ctx.fillRect(x-sw/2,y+h*0.3,sw,sh);ctx.strokeStyle=P.brass;ctx.lineWidth=2;ctx.strokeRect(x-sw/2,y+h*0.3,sw,sh);
  ctx.fillStyle=P.cream;ctx.font='400 '+Math.round(sh*0.6)+'px Rye, Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('CRACK SHOT',x,y+h*0.3+sh/2+1);
}
function drawCrow(){
  if(g.phase!=='react'||g.mode!=='play')return;
  var t=g.crow.t,T=1.25,up=t<0.2?CS.ease(t/0.2):t>T-0.22?CS.ease(Math.max(0,(T-t)/0.22)):1;
  var x=L.trapX+(st.portrait?0:0),y=L.trapTop+30-up*92,laugh=g.crow.mood==='laugh',bob=laugh?Math.abs(Math.sin(t*16))*-6:Math.sin(t*10)*2;
  ctx.save();ctx.translate(x,y+bob);var s=st.portrait?1.05:1;ctx.scale(s,s);
  // body
  ctx.fillStyle='#121e31';ctx.beginPath();ctx.ellipse(0,18,26,30,0,0,TAU);ctx.fill();
  // wings
  ctx.save();ctx.translate(-22,12);ctx.rotate(laugh?Math.sin(t*16)*0.4-0.2:-1.1);ctx.beginPath();ctx.ellipse(-6,0,10,24,0.3,0,TAU);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(22,12);ctx.rotate(laugh?-Math.sin(t*16)*0.4+0.2:1.1);ctx.beginPath();ctx.ellipse(6,0,10,24,-0.3,0,TAU);ctx.fill();ctx.restore();
  if(!laugh){drawCracker(-44,-14,13,t*3);drawCracker(44,-14,13,-t*3)}
  // head
  ctx.fillStyle='#121e31';ctx.beginPath();ctx.arc(0,-16,18,0,TAU);ctx.fill();
  ctx.beginPath();ctx.moveTo(-4,-33);ctx.lineTo(2,-44);ctx.lineTo(6,-32);ctx.fill();
  // neckerchief
  ctx.fillStyle=P.red;ctx.beginPath();ctx.moveTo(-16,-2);ctx.lineTo(16,-2);ctx.lineTo(0,16);ctx.closePath();ctx.fill();ctx.fillStyle=P.cream;ctx.beginPath();ctx.arc(-4,4,1.6,0,TAU);ctx.arc(5,3,1.6,0,TAU);ctx.fill();
  // eyes
  if(laugh){ctx.strokeStyle=P.cream;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(-7,-19,4,Math.PI*1.1,Math.PI*1.9);ctx.stroke();ctx.beginPath();ctx.arc(7,-19,4,Math.PI*1.1,Math.PI*1.9);ctx.stroke()}
  else{ctx.fillStyle=P.cream;ctx.beginPath();ctx.arc(-7,-19,4.5,0,TAU);ctx.arc(7,-19,4.5,0,TAU);ctx.fill();ctx.fillStyle=P.navy;ctx.beginPath();ctx.arc(-6,-19,2,0,TAU);ctx.arc(8,-19,2,0,TAU);ctx.fill()}
  // beak (open when laughing)
  ctx.fillStyle=P.brass;var o=laugh?5+Math.abs(Math.sin(t*16))*4:1;
  ctx.beginPath();ctx.moveTo(-6,-12);ctx.lineTo(0,-12-o*0.2);ctx.lineTo(6,-12);ctx.lineTo(0,-2);ctx.closePath();ctx.fill();
  if(laugh){ctx.beginPath();ctx.moveTo(-5,-10+o*0.3);ctx.lineTo(5,-10+o*0.3);ctx.lineTo(0,-2+o);ctx.closePath();ctx.fill()}
  ctx.restore();
  // speech bubble
  if(up>0.6){var txt=laugh?'HA-CAW!':'CAW!',bx=x+(st.portrait?70:84),by=y-44;ctx.font='400 20px Rye, Georgia, serif';var tw=ctx.measureText(txt).width+22;
    ctx.fillStyle=P.cream;ctx.strokeStyle=P.navy;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(bx-tw/2+12,by+16);ctx.lineTo(bx-tw/2-4,by+30);ctx.lineTo(bx-tw/2+24,by+16);
    ctx.lineTo(bx+tw/2-10,by+16);ctx.arcTo(bx+tw/2,by+16,bx+tw/2,by-16,10);ctx.arcTo(bx+tw/2,by-16,bx-tw/2,by-16,10);ctx.arcTo(bx-tw/2,by-16,bx-tw/2,by+16,10);ctx.arcTo(bx-tw/2,by+16,bx,by+16,10);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=laugh?P.red:P.navy;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,bx,by+1)}
}
function drawHUD(){
  var W=L.W,H=L.H,top=L.groundBottom+4,hh=L.hud-4,cy=top+hh/2,i,c=cfg();
  ctx.textBaseline='middle';
  // shells
  ctx.textAlign='left';ctx.fillStyle=P.brass;ctx.font='500 12px Oswald, sans-serif';ctx.fillText('SHOTS',18,cy-hh*0.28);
  for(i=0;i<3;i++){var x=18+i*20,y=cy-hh*0.12,on=i<g.shots||g.phase!=='flight';ctx.fillStyle=on?P.red:'rgba(243,230,200,.18)';ctx.fillRect(x,y,13,24);ctx.fillStyle=on?P.brass:'rgba(243,230,200,.12)';ctx.fillRect(x,y+18,13,8)}
  // sleeve tracker
  var two=st.portrait,per=two?13:25,sp=two?25:22,rw=(per-1)*sp,x0=W/2-rw/2+(two?18:0),y0=two?cy-hh*0.2:cy+2;
  ctx.textAlign='center';ctx.fillStyle=P.brass;ctx.font='500 12px Oswald, sans-serif';
  ctx.fillText('SLEEVE '+g.sleeve+' \u00b7 '+breaks()+' BROKEN \u00b7 NEED '+c.quota,W/2+(two?18:0),two?top+11:cy-hh*0.3);
  var cur=g.mode==='play'&&g.phase!=='pull'?[slotStart(g.throwIdx),slotStart(g.throwIdx)+1]:[];
  for(i=0;i<SLEEVE;i++){var row=two?Math.floor(i/per):0,col=two?i%per:i,px=x0+col*sp,py=y0+row*20+(two?6:0),r=g.res[i];
    var blink=cur.indexOf(i)>=0&&!r&&(Math.floor(performance.now()/220)%2);
    if(r==='hit')drawCracker(px,py,8,0);
    else if(r==='miss'){ctx.strokeStyle=P.red;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px-5,py-5);ctx.lineTo(px+5,py+5);ctx.moveTo(px+5,py-5);ctx.lineTo(px-5,py+5);ctx.stroke()}
    else{ctx.fillStyle=blink?P.cream:'rgba(243,230,200,.22)';ctx.beginPath();ctx.arc(px,py,5,0,TAU);ctx.fill()}
    if(i===c.quota-1){ctx.fillStyle=P.brass;ctx.beginPath();ctx.moveTo(px,py+11);ctx.lineTo(px-5,py+17);ctx.lineTo(px+5,py+17);ctx.fill()}}
  // score
  ctx.textAlign='right';ctx.fillStyle=P.brass;ctx.font='500 12px Oswald, sans-serif';ctx.fillText('HI '+CS.fmt(HI.get()),W-18,cy-hh*0.28);
  ctx.fillStyle=P.cream;ctx.font='400 '+(two?20:26)+'px Rye, Georgia, serif';ctx.fillText(CS.fmt(g.score),W-18,cy+hh*0.08);
}
function drawAim(){
  var a=aim.show?1:(aim.tap>0?aim.tap/0.5:0);
  if(aim.pt>0){ctx.fillStyle='rgba(18,30,49,'+(aim.pt/0.18)+')';aim.pellets.forEach(function(q){ctx.beginPath();ctx.arc(q[0],q[1],1.8,0,TAU);ctx.fill()})}
  if(!a||g.mode==='title')return;
  var r=L.pr*(1+aim.kick*0.18),warm=aim.over&&g.phase==='flight';
  ctx.save();ctx.globalAlpha=a;ctx.translate(aim.x,aim.y);
  ctx.fillStyle=warm?'rgba(196,30,58,.14)':'rgba(243,230,200,.10)';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();
  ctx.lineWidth=4;ctx.strokeStyle='rgba(18,30,49,.7)';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();
  ctx.lineWidth=2.2;ctx.strokeStyle=warm?P.red:P.cream;ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=warm?P.red:P.cream;for(var i=0;i<8;i++){var an=i*TAU/8+0.3,rr=r*(i%2?0.5:0.28);ctx.beginPath();ctx.arc(Math.cos(an)*rr,Math.sin(an)*rr,1.6,0,TAU);ctx.fill()}
  ctx.beginPath();ctx.arc(0,0,2.2,0,TAU);ctx.fill();
  ctx.restore();
}
function drawBanner(){
  var b=g.banner,k=b.t/b.dur,a=k<0.15?k/0.15:k>0.8?1-(k-0.8)/0.2:1,W=L.W,H=L.H,y=H*0.36;
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle='rgba(28,46,74,.88)';ctx.fillRect(0,y-46,W,92);ctx.fillStyle=P.brass;ctx.fillRect(0,y-46,W,3);ctx.fillRect(0,y+43,W,3);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=P.cream;ctx.font='400 '+(st.portrait?34:42)+'px Rye, Georgia, serif';ctx.fillText(b.text,W/2,y-8);
  ctx.fillStyle=P.brass;ctx.font='500 '+(st.portrait?14:17)+'px Oswald, sans-serif';ctx.fillText(b.sub,W/2,y+26);ctx.restore();
}

CS.loop(function(dt){update(dt);draw()});
titleScreen();
/* tiny hook for automated smoke tests */
window.__game={state:g,L:L,fire:function(x,y){return fire({x:x,y:y})}};
})();
