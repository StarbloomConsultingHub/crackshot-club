/* Gallery Row: an original carnival shooting-gallery game for the Crack Shot .22 LR Club. MIT. */
(function(){
'use strict';
var P=CS.PAL,R=CS.rand,A=CS.audio,TAU=Math.PI*2;
var cv=document.getElementById('c'),L={},rows=[],bells=[],spinners=[],plate=null,holes=[],pops=[],parts=CS.particles();
var bg=document.createElement('canvas');
var HI=CS.hi('gallery-row');
var ROUNDS=3,AMMO=20,TIME=40,SPEED=[1,1.3,1.65];
var TYPES={owl:{w:50,h:58,pts:30,v:150,gap:118},rabbit:{w:54,h:72,pts:20,v:105,gap:136},duck:{w:68,h:54,pts:10,v:78,gap:150}};
var ROWTYPES=['owl','rabbit','duck'];
var g={mode:'title',round:0,score:0,ammo:AMMO,time:TIME,shots:0,hits:0,streak:0,best:0,rshots:0,rhits:0,rscore:0,endT:-1,shake:0,recoil:0,flash:0,cool:0,plateT:3,banner:null,paused:false,lastTick:99,chase:0};
var aim={x:480,y:300,show:false,touch:false,tap:0,kick:0};
var crackerImg=new Image();crackerImg.src='/games/assets/cracker.png';
var st=CS.stage(cv,layout),ctx=st.ctx;

/* ---------------- layout ---------------- */
function layout(s){
  st=s;var W=st.W,H=st.H,old=L.W;
  L.W=W;L.H=H;
  L.aw=Math.round(H*0.105);L.ts=st.portrait?1.22:1;
  L.counter=Math.round(H*0.88);
  var top=L.aw+(st.portrait?170:110);
  L.plateRail=top-8;
  var span=L.counter-80-top;
  for(var i=0;i<3;i++){
    var y=Math.round(top+span*(i+1)/3);
    if(!rows[i])rows[i]={type:ROWTYPES[i],dir:i%2?-1:1,targets:[],scroll:0};
    rows[i].y=y;buildRow(rows[i],old&&old!==W);
  }
  var by=L.aw+46;
  bells=[mkBell(W*0.06,by,1046,bells[0]),mkBell(W*0.94,by,1318,bells[1])];
  spinners=[mkSpin(W*0.11,L.counter-36,spinners[0]),mkSpin(W*0.89,L.counter-36,spinners[1])];
  cacheBG();
}
function mkBell(x,y,pitch,o){return{x:x,y:y,pitch:pitch,ang:o?o.ang:0,av:o?o.av:0}}
function mkSpin(x,y,o){return{x:x,y:y,a:o?o.a:0,av:o?o.av:0,arm:25,r:11}}
function buildRow(row,rebuild){
  var T=TYPES[row.type],m=90;row.len=L.W+2*m;row.m=m;
  if(row.targets.length&&!rebuild)return;
  var n=Math.max(3,Math.floor(row.len/T.gap)),gap=row.len/n;row.targets=[];
  for(var j=0;j<n;j++)row.targets.push({x:-m+j*gap+R(-8,8),up:true,f:0,gold:false,bob:R(0,TAU)});
}

/* ---------------- background cache ---------------- */
function cacheBG(){
  var W=L.W,H=L.H;bg.width=Math.round(W*st.k);bg.height=Math.round(H*st.k);
  var b=bg.getContext('2d');b.setTransform(st.k,0,0,st.k,0,0);
  var gr=b.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#24385a');gr.addColorStop(1,'#16243b');b.fillStyle=gr;b.fillRect(0,0,W,H);
  b.fillStyle='rgba(196,163,84,.07)';
  for(var y=L.aw;y<L.counter;y+=34)for(var x=((y/34)%2)*17;x<W;x+=34){b.beginPath();b.moveTo(x,y-6);b.lineTo(x+6,y);b.lineTo(x,y+6);b.lineTo(x-6,y);b.fill()}
  b.fillStyle='#0f1a2c';b.fillRect(0,L.plateRail,W,5);
  b.fillStyle=P.brass;b.fillRect(0,L.plateRail-2,W,3);
  [8,W-8].forEach(function(px){b.save();b.beginPath();b.rect(px-8,L.aw,16,L.counter-L.aw);b.clip();b.fillStyle=P.cream;b.fillRect(px-8,L.aw,16,L.counter-L.aw);b.fillStyle=P.red;
    for(var yy=L.aw-20;yy<L.counter;yy+=26){b.beginPath();b.moveTo(px-8,yy);b.lineTo(px+8,yy-12);b.lineTo(px+8,yy);b.lineTo(px-8,yy+12);b.fill()}b.restore();
    b.fillStyle=P.brass;b.beginPath();b.arc(px,L.aw+4,9,0,TAU);b.fill()});
  var sw=st.portrait?45:60,n=Math.ceil(W/sw)+1,i;
  for(i=0;i<n;i++){b.fillStyle=i%2?P.cream:P.red;b.fillRect(i*sw,0,sw,L.aw);b.beginPath();b.arc(i*sw+sw/2,L.aw,sw/2,0,Math.PI);b.fill()}
  b.fillStyle='rgba(0,0,0,.18)';b.fillRect(0,L.aw-6,W,6);
  var sgW=Math.min(W*0.62,420),sgH=L.aw*0.62,sx=W/2-sgW/2,sy=L.aw*0.16;
  round(b,sx,sy,sgW,sgH,10);b.fillStyle=P.navy;b.fill();b.lineWidth=3;b.strokeStyle=P.brass;b.stroke();
  b.fillStyle=P.cream;var fs=Math.round(sgH*0.56);b.font='400 '+fs+'px Rye, Georgia, serif';while(b.measureText('\u2605 GALLERY ROW \u2605').width>sgW-24&&fs>10){fs--;b.font='400 '+fs+'px Rye, Georgia, serif'}b.textAlign='center';b.textBaseline='middle';
  b.fillText('\u2605 GALLERY ROW \u2605',W/2,sy+sgH/2+1);
  var cy=L.counter;gr=b.createLinearGradient(0,cy,0,H);gr.addColorStop(0,'#a3182f');gr.addColorStop(1,'#6e0f20');b.fillStyle=gr;b.fillRect(0,cy,W,H-cy);
  b.fillStyle=P.brass;b.fillRect(0,cy,W,6);b.fillStyle='rgba(0,0,0,.25)';b.fillRect(0,cy+6,W,4);
  b.strokeStyle='rgba(243,230,200,.35)';b.lineWidth=2;b.strokeRect(6,cy+14,W-12,H-cy-20);
}
function round(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){cacheBG()});

/* ---------------- target art (original cast-iron style silhouettes) ---------------- */
function outline(c){c.lineWidth=3;c.strokeStyle=P.navy;c.lineJoin='round';c.stroke()}
function post(c){c.fillStyle='#3a2a12';c.fillRect(-4,-10,8,12)}
function drawDuck(c,gold){post(c);
  c.fillStyle=gold?P.brass:P.cream;
  c.beginPath();c.moveTo(-36,-36);c.lineTo(-22,-30);c.lineTo(-26,-18);c.closePath();c.fill();outline(c);
  c.beginPath();c.ellipse(-4,-22,27,14,0,0,TAU);c.fill();outline(c);
  c.beginPath();c.moveTo(6,-30);c.quadraticCurveTo(10,-40,15,-42);c.lineTo(22,-30);c.closePath();c.fill();
  c.beginPath();c.arc(16,-40,11,0,TAU);c.fill();outline(c);
  c.fillStyle=gold?P.red:P.brass;c.beginPath();c.moveTo(25,-43);c.lineTo(38,-38);c.lineTo(25,-34);c.closePath();c.fill();outline(c);
  c.fillStyle=P.navy;c.beginPath();c.arc(19,-43,2.4,0,TAU);c.fill();
  c.strokeStyle=P.navy;c.lineWidth=2;c.beginPath();c.moveTo(-18,-24);c.quadraticCurveTo(-4,-14,10,-24);c.stroke();
  c.fillStyle=P.red;c.beginPath();c.arc(-6,-23,4.5,0,TAU);c.fill();
  if(gold){c.fillStyle=P.cream;star(c,-24,-44,5);star(c,30,-52,4)}
}
function ear(c,x,y,rot){c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=P.cream;c.beginPath();c.ellipse(0,0,5,14,0,0,TAU);c.fill();outline(c);c.fillStyle=P.red;c.beginPath();c.ellipse(0,1,2,9,0,0,TAU);c.fill();c.restore()}
function drawRabbit(c){post(c);
  ear(c,5,-62,-0.18);ear(c,15,-60,0.22);
  c.fillStyle=P.cream;c.beginPath();c.arc(-19,-20,7,0,TAU);c.fill();outline(c);
  c.beginPath();c.ellipse(-2,-23,19,17,0,0,TAU);c.fill();outline(c);
  c.beginPath();c.arc(10,-44,12,0,TAU);c.fill();outline(c);
  c.fillStyle=P.navy;c.beginPath();c.arc(14,-46,2.4,0,TAU);c.fill();
  c.fillStyle=P.red;c.beginPath();c.arc(21,-42,2,0,TAU);c.fill();c.beginPath();c.arc(-3,-22,4.5,0,TAU);c.fill();
}
function drawOwl(c){post(c);c.fillStyle=P.cream;
  c.beginPath();c.moveTo(-17,-44);c.lineTo(-14,-60);c.lineTo(-5,-49);c.lineTo(5,-49);c.lineTo(14,-60);c.lineTo(17,-44);c.quadraticCurveTo(24,-20,14,-8);c.lineTo(-14,-8);c.quadraticCurveTo(-24,-20,-17,-44);c.closePath();c.fill();outline(c);
  [-8,8].forEach(function(ex){c.fillStyle=P.brass;c.beginPath();c.arc(ex,-40,8,0,TAU);c.fill();outline(c);c.fillStyle=P.navy;c.beginPath();c.arc(ex,-40,3.4,0,TAU);c.fill()});
  c.fillStyle=P.red;c.beginPath();c.moveTo(-3,-33);c.lineTo(3,-33);c.lineTo(0,-27);c.closePath();c.fill();
  c.strokeStyle=P.navy;c.lineWidth=1.6;for(var i=0;i<3;i++){c.beginPath();c.arc(-6+i*6,-18,3,0,Math.PI);c.stroke()}
}
function star(c,x,y,r){c.beginPath();for(var i=0;i<8;i++){var a=i*Math.PI/4,rr=i%2?r*0.35:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.closePath();c.fill()}
function drawTarget(type,t,x,y,dir){
  var s=Math.cos(t.f*Math.PI/2);if(s<0.08)s=0.08;
  ctx.save();ctx.translate(x,y);ctx.scale(dir*L.ts,s*L.ts);
  if(type==='duck')drawDuck(ctx,t.gold);else if(type==='rabbit')drawRabbit(ctx);else drawOwl(ctx);
  if(t.f>0){ctx.globalAlpha=t.f*0.6;ctx.fillStyle='#000';ctx.fillRect(-40,-80,80,82)}
  ctx.restore();
}

/* ---------------- game flow ---------------- */
function newGame(){g.round=0;g.score=0;g.shots=0;g.hits=0;g.streak=0;g.best=0;holes.length=0;pops.length=0;parts.clear();startRound()}
function startRound(){
  g.ammo=AMMO;g.time=TIME;g.rshots=0;g.rhits=0;g.rscore=0;g.endT=-1;g.plateT=R(2,4);plate=null;g.lastTick=99;
  rows.forEach(function(r){r.targets.forEach(function(t){t.up=true;t.f=0;t.gold=r.type==='duck'&&Math.random()<0.07})});
  g.mode='play';g.paused=false;ui.hide();ui.pauseIcon(false);
  g.banner={t:0,dur:1.5,text:'ROUND '+(g.round+1),sub:AMMO+' SHOTS \u00b7 '+TIME+' SECONDS'+(g.round?' \u00b7 FASTER BELT':'')};
  A.start();
}
function endRound(){
  g.mode='between';
  var acc=g.rshots?g.rhits/g.rshots:0,bon=[];
  if(g.ammo===0&&g.time>=1&&acc>0)bon.push(['Time left \u00d7 accuracy',Math.round(Math.floor(g.time)*10*acc)]);
  if(g.rshots>=10&&acc>=0.75)bon.push(['Sharpshooter (75%+)',150]);
  if(g.rshots>=AMMO&&g.rhits===g.rshots)bon.push(['Perfect tube',300]);
  var bsum=bon.reduce(function(a,b){return a+b[1]},0);g.score+=bsum;
  var last=g.round>=ROUNDS-1;
  A.fanfare();
  ui.show('<p class="kicker">Round '+(g.round+1)+' of '+ROUNDS+'</p><h2>Belt stopped!</h2>'+
    '<div class="stats"><span><b>'+CS.fmt(g.rscore)+'</b>round</span><span><b>'+g.rhits+'/'+g.rshots+'</b>hits</span><span><b>'+Math.round(acc*100)+'%</b>accuracy</span></div>'+
    (bon.length?'<p>'+bon.map(function(b){return '<span class="badge">'+b[0]+' +'+b[1]+'</span>'}).join(' ')+'</p>':'<p class="fine">Tip: hits in a row build the streak multiplier. Bells and the cracker bullseye pay big.</p>')+
    '<p>Total: <strong>'+CS.fmt(g.score)+'</strong></p>'+
    '<div class="btns"><button data-focus data-act="'+(last?'final':'next')+'">'+(last?'See final score':'Round '+(g.round+2)+' \u2192')+'</button></div>');
}
function finalScreen(){
  g.mode='over';var isNew=HI.set(g.score),hi=HI.get(),acc=g.shots?Math.round(g.hits/g.shots*100):0;
  var rank=g.score>=2600?'Midway Legend':g.score>=1900?'Crack Shot':g.score>=1300?'Sharpshooter':g.score>=700?'Marksman':'Plinker';
  var share='I scored '+CS.fmt(g.score)+' ('+rank+', '+acc+'% hits) at Gallery Row, the carnival shooting gallery game from the Crack Shot .22 LR Club. Step right up: '+location.origin+'/games/gallery';
  if(isNew)A.fanfare();
  ui.show('<p class="kicker">Final score</p><h2>'+rank+'</h2><p class="big">'+CS.fmt(g.score)+'</p>'+(isNew?'<p class="new">\u2605 New high score \u2605</p>':'<p>High score: <strong>'+CS.fmt(hi)+'</strong></p>')+
    '<div class="stats"><span><b>'+acc+'%</b>accuracy</span><span><b>'+g.hits+'</b>hits</span><span><b>'+g.best+'</b>best streak</span></div>'+
    '<textarea rows="3" readonly aria-label="Share text">'+share+'</textarea>'+
    '<div class="btns"><button data-act="share">Copy my score</button><button class="ghost" data-focus data-act="again">Play again</button><a class="btn ghost" href="/games">More games</a></div>'+
    '<p class="fine">Copying just puts the text on your clipboard. Nothing is posted.</p>');
  ui.el.querySelector('[data-act=share]').onclick=function(){CS.copy(share,this)};
}
function titleScreen(){
  g.mode='title';
  ui.show('<p class="kicker">Crack Shot arcade \u00b7 game 1</p><h2>Gallery Row</h2>'+
    '<p>Step up to the counter. Three conveyor belts of cast-iron ducks, rabbits, and owls, two brass bells, two spinners, and a cracker bullseye. One tube of '+AMMO+' shots per round, '+ROUNDS+' rounds, and the belt speeds up each time.</p>'+
    '<ul><li><strong>Aim &amp; shoot:</strong> click or tap a target.</li><li>Owl 30 \u00b7 Rabbit 20 \u00b7 Duck 10 \u00b7 Gold duck 50 + 3 shots \u00b7 Bell 50 \u00b7 Spinner 15 \u00b7 Cracker bullseye 100</li><li>5 hits in a row = \u00d72, 10 = \u00d73, 15 = \u00d74. A miss resets it.</li><li>Empty the tube early and leftover time pays a bonus, scaled by your accuracy.</li></ul>'+
    '<p class="keys"><kbd>P</kbd>/<kbd>Esc</kbd> pause \u00b7 <kbd>M</kbd> mute \u00b7 <kbd>Space</kbd> start</p>'+
    '<p>High score: <strong>'+CS.fmt(HI.get())+'</strong></p>'+
    '<div class="btns"><button data-focus data-act="start">Step right up</button></div>'+
    '<p class="fine">Original game inspired by classic carnival shooting galleries. Just for fun; always follow real-world range safety.</p>');
}
function pauseScreen(){
  ui.show('<p class="kicker">Gallery Row</p><h2>Paused</h2><p>Score <strong>'+CS.fmt(g.score)+'</strong> \u00b7 Round '+(g.round+1)+' \u00b7 '+g.ammo+' shots left</p>'+
    '<div class="btns"><button data-focus data-act="resume">Resume</button><button class="ghost" data-act="restart">Restart</button><a class="btn ghost" href="/games">Quit</a></div>');
}
function togglePause(){
  if(g.mode!=='play')return;
  g.paused=!g.paused;ui.pauseIcon(g.paused);if(g.paused)pauseScreen();else ui.hide();
}
var ui=CS.ui({togglePause:togglePause,autoPause:function(){if(g.mode==='play'&&!g.paused)togglePause()},
  primary:function(){var b=ui.on()&&ui.el.querySelector('[data-focus]');if(b&&document.activeElement!==b){b.click();return true}return false}});
ui.el.addEventListener('click',function(e){var b=e.target.closest('[data-act]');if(!b)return;A.unlock();var a=b.getAttribute('data-act');
  if(a==='start'||a==='again'||a==='restart')newGame();
  else if(a==='resume')togglePause();
  else if(a==='next'){g.round++;startRound()}
  else if(a==='final')finalScreen();
});

/* ---------------- shooting ---------------- */
function award(pts,x,y,label,col){
  g.hits++;g.rhits++;g.streak++;if(g.streak>g.best)g.best=g.streak;
  var mult=Math.min(4,1+Math.floor(g.streak/5)),v=pts*mult;g.score+=v;g.rscore+=v;
  pops.push({x:x,y:y,t:0,text:(label?label+' ':'')+'+'+v,col:col||P.cream,big:v>=100});
  if(g.streak%5===0&&g.streak<=15){pops.push({x:L.W/2,y:L.aw+70,t:0,text:'HOT STREAK \u00d7'+mult,col:P.brass,big:true,life:1.4});A.tune([76,79,84],0.06)}
}
function sparks(x,y,n,col){for(var i=0;i<n;i++){var a=R(0,TAU),s=R(80,320);parts.add({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,g:600,t:0,life:R(0.25,0.5),c:col||(Math.random()<0.5?P.brass:P.cream),k:'spark'})}}
function crumbs(x,y,n){for(var i=0;i<n;i++){var a=R(0,TAU),s=R(60,360);parts.add({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-120,g:900,t:0,life:R(0.6,1.1),c:Math.random()<0.6?P.tan:P.brass,k:'crumb',sz:R(2,6),rot:R(0,TAU),vr:R(-12,12)})}}
function fire(p,touch){
  if(g.mode!=='play'||g.paused||g.banner)return false;
  if(g.cool>0)return false;
  if(g.ammo<=0){A.click();return false}
  g.cool=0.17;g.ammo--;g.shots++;g.rshots++;A.shot();A.pump();g.recoil=1;g.flash=1;g.shake=Math.max(g.shake,3);aim.kick=1;
  var tol=touch?13:4,hit=false,ts=L.ts;
  bells.forEach(function(b){if(hit)return;var bx=b.x-Math.sin(b.ang)*44,by=b.y-14+Math.cos(b.ang)*44;
    if(Math.hypot(p.x-bx,p.y-by)<22+tol){hit=true;b.av+=(p.x<bx?1:-1)*5+R(-1,1);A.ding(b.pitch);award(50,bx,by-30,'DING!',P.brass);sparks(bx,by,10,P.brass);g.shake=6}});
  if(!hit)spinners.forEach(function(s){if(hit)return;for(var i=0;i<4;i++){var a=s.a+i*TAU/4,px=s.x+Math.cos(a)*s.arm,py=s.y+Math.sin(a)*s.arm;
    if(Math.hypot(p.x-px,p.y-py)<s.r+tol){hit=true;var fast=Math.abs(s.av)>6;s.av+=(s.x<L.W/2?1:-1)*13;A.clank();award(fast?25:15,px,py-24,fast?'SPIN!':'',P.cream);sparks(px,py,8);return}}});
  if(!hit&&plate){var cx=plate.x,cy=L.plateRail-36;
    if(plate.cracker&&Math.hypot(p.x-cx,p.y-cy)<21+tol){hit=true;plate.cracker=false;A.crunch();A.ding(1568);award(100,cx,cy-46,'CRACKED!',P.brass);crumbs(cx,cy,34);g.shake=8}
    else if(p.x>cx-36&&p.x<cx+36&&p.y>L.plateRail-96&&p.y<L.plateRail){hit=true;A.clank();award(5,p.x,p.y-20,'',P.cream);sparks(p.x,p.y,6);plate.wob=1}}
  if(!hit)for(var ri=rows.length-1;ri>=0&&!hit;ri--){var r=rows[ri],T=TYPES[r.type];
    for(var j=0;j<r.targets.length;j++){var t=r.targets[j];if(!t.up)continue;var by2=r.y+Math.sin(t.bob)*1.5;
      if(p.x>t.x-T.w*ts/2-tol&&p.x<t.x+T.w*ts/2+tol&&p.y>by2-T.h*ts-tol&&p.y<by2+tol){
        hit=true;t.up=false;A.clank();
        if(t.gold){award(50,t.x,by2-T.h-8,'GOLD +3 SHOTS',P.brass);g.ammo+=3;A.ding(1760);sparks(t.x,by2-30,16,P.brass)}
        else{award(T.pts,t.x,by2-T.h-8,'',P.cream);sparks(t.x,by2-30,8)}
        break}}}
  if(!hit){g.streak=0;A.thunk();
    if(p.y>L.aw+6&&p.y<L.counter){holes.push({x:p.x,y:p.y,t:0});if(holes.length>40)holes.shift()}
    for(var k=0;k<6;k++)parts.add({x:p.x,y:p.y,vx:R(-50,50),vy:R(-70,-10),g:120,t:0,life:R(0.3,0.6),c:'rgba(200,190,160,.6)',k:'dust',sz:R(3,6)})}
  if(g.ammo<=0&&g.endT<0)g.endT=0.9;
  return hit;
}
CS.input(st,{
  move:function(p,type){aim.x=p.x;aim.y=p.y;aim.touch=type==='touch';aim.show=!aim.touch},
  down:function(p,type){aim.x=p.x;aim.y=p.y;aim.touch=type!=='mouse';if(aim.touch){aim.tap=0.45;aim.show=false}else aim.show=true;fire(p,aim.touch)},
  leave:function(type){if(type==='mouse')aim.show=false}
});

/* ---------------- update ---------------- */
function update(dt){
  if(g.paused)return;
  var playing=g.mode==='play';
  g.chase+=dt*(g.streak>=5?14:6);
  var sp=(g.mode==='play'||g.mode==='between')?SPEED[g.round]:0.7;
  if(g.banner){g.banner.t+=dt;if(g.banner.t>=g.banner.dur)g.banner=null}
  rows.forEach(function(r){var T=TYPES[r.type],v=T.v*sp*r.dir;r.scroll+=v*dt;
    r.targets.forEach(function(t){t.x+=v*dt;t.bob+=dt*6;
      if(!t.up&&t.f<1)t.f=Math.min(1,t.f+dt*6);
      if(r.dir>0&&t.x>L.W+r.m){t.x-=r.len;respawn(r,t)}else if(r.dir<0&&t.x<-r.m){t.x+=r.len;respawn(r,t)}})});
  bells.forEach(function(b){b.av+=(-b.ang*28-b.av*1.6)*dt;b.ang+=b.av*dt});
  spinners.forEach(function(s){s.a+=s.av*dt;s.av*=Math.exp(-1.1*dt)});
  if(playing&&!g.banner){
    g.time-=dt;var sec=Math.ceil(g.time);if(sec<=5&&sec>=1&&sec!==g.lastTick){g.lastTick=sec;A.tick()}
    if(g.time<=0){g.time=0;if(g.endT<0)g.endT=0.6}
    g.plateT-=dt;if(!plate&&g.plateT<=0){var d=Math.random()<0.5?1:-1;plate={x:d>0?-60:L.W+60,dir:d,v:(110+g.round*35)*(st.portrait?0.8:1),cracker:true,wob:0};A.whoosh()}
  }
  if(plate){plate.x+=plate.dir*plate.v*dt;plate.wob=Math.max(0,plate.wob-dt*3);if(plate.x<-90||plate.x>L.W+90){plate=null;g.plateT=R(4,7)}}
  if(g.endT>=0&&playing){g.endT-=dt;if(g.endT<0)endRound()}
  g.cool=Math.max(0,g.cool-dt);g.recoil=Math.max(0,g.recoil-dt*6);g.flash=Math.max(0,g.flash-dt*14);g.shake=Math.max(0,g.shake-dt*30);aim.kick=Math.max(0,aim.kick-dt*7);aim.tap=Math.max(0,aim.tap-dt);
  holes.forEach(function(h){h.t+=dt});while(holes.length&&holes[0].t>7)holes.shift();
  for(var i=pops.length-1;i>=0;i--){pops[i].t+=dt;if(pops[i].t>(pops[i].life||0.9))pops.splice(i,1)}
  parts.update(dt);
}
function respawn(r,t){t.up=true;t.f=0;t.gold=r.type==='duck'&&g.mode==='play'&&Math.random()<0.07}

/* ---------------- draw ---------------- */
function draw(){
  st.begin();var W=L.W,H=L.H,i;
  ctx.save();if(g.shake>0)ctx.translate(R(-g.shake,g.shake),R(-g.shake,g.shake));
  ctx.drawImage(bg,0,0,W,H);
  holes.forEach(function(h){ctx.globalAlpha=h.t>5?1-(h.t-5)/2:1;ctx.fillStyle='#0a1220';ctx.beginPath();ctx.arc(h.x,h.y,3.2,0,TAU);ctx.fill();ctx.strokeStyle='rgba(243,230,200,.35)';ctx.lineWidth=1;ctx.stroke()});ctx.globalAlpha=1;
  if(plate)drawPlate(plate);
  rows.forEach(function(r){
    r.targets.forEach(function(t){drawTarget(r.type,t,t.x,r.y+Math.sin(t.bob)*1.5,r.dir)});
    ctx.fillStyle='#0e1828';ctx.fillRect(0,r.y,W,16);
    ctx.fillStyle=P.brass;ctx.fillRect(0,r.y,W,4);
    ctx.fillStyle='rgba(196,163,84,.55)';var off=((r.scroll%18)+18)%18;for(var x=-18+off;x<W;x+=18)ctx.fillRect(x,r.y+7,9,3);
    ctx.fillStyle=P.red;ctx.fillRect(0,r.y+12,W,4);
  });
  bells.forEach(drawBell);
  spinners.forEach(drawSpinner);
  var sw=st.portrait?45:60,n=Math.ceil(W/sw)+1;
  for(i=0;i<n;i++){var on=((i+Math.floor(g.chase))%3)===0,bx=i*sw+sw/2,by=L.aw+sw/2-6;
    if(on){ctx.fillStyle='rgba(255,240,190,.25)';ctx.beginPath();ctx.arc(bx,by,10,0,TAU);ctx.fill()}
    ctx.fillStyle=on?'#fff6d6':'#8a7a4a';ctx.beginPath();ctx.arc(bx,by,4.5,0,TAU);ctx.fill()}
  parts.list.forEach(function(p){ctx.globalAlpha=1-p.t/p.life;ctx.fillStyle=p.c;
    if(p.k==='spark'){ctx.fillRect(p.x-1.5,p.y-1.5,3,3)}
    else if(p.k==='crumb'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.beginPath();ctx.moveTo(-p.sz,-p.sz*0.6);ctx.lineTo(p.sz,-p.sz*0.4);ctx.lineTo(p.sz*0.3,p.sz*0.8);ctx.closePath();ctx.fill();ctx.restore()}
    else{ctx.beginPath();ctx.arc(p.x,p.y,p.sz*(1+p.t*2),0,TAU);ctx.fill()}});ctx.globalAlpha=1;
  pops.forEach(function(p){var life=p.life||0.9,k=p.t/life;ctx.globalAlpha=k>0.7?1-(k-0.7)/0.3:1;
    var sz=(p.big?26:19)*(p.t<0.1?0.6+p.t*4:1);ctx.font='400 '+sz+'px Rye, Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.lineWidth=4;ctx.strokeStyle=P.navy;var y=p.y-p.t*40,x=CS.clamp(p.x,70,W-70);ctx.strokeText(p.text,x,y);ctx.fillStyle=p.col;ctx.fillText(p.text,x,y)});ctx.globalAlpha=1;
  ctx.restore();
  drawHUD();
  drawRifle();
  drawAim();
  if(g.banner)drawBanner();
}
function drawPlate(pl){
  var x=pl.x,y=L.plateRail;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(pl.wob*20)*0.05*pl.wob);
  ctx.fillStyle='#0b1322';ctx.fillRect(-3,-6,6,8);
  ctx.fillStyle=P.dark;ctx.strokeStyle=P.brass;ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(-38,-4);ctx.quadraticCurveTo(-40,-50,-12,-56);ctx.lineTo(-9,-64);ctx.arc(0,-78,17,Math.PI*0.68,Math.PI*0.32,false);ctx.lineTo(12,-56);ctx.quadraticCurveTo(40,-50,38,-4);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#050a14';ctx.beginPath();ctx.arc(0,-36,22,0,TAU);ctx.fill();
  if(pl.cracker&&crackerImg.complete&&crackerImg.naturalWidth){ctx.drawImage(crackerImg,-20,-56,40,40)}
  else{ctx.fillStyle='rgba(215,191,131,.5)';for(var i=0;i<5;i++){ctx.fillRect(-14+i*7,-24+(i%2)*3,3,3)}}
  ctx.strokeStyle=P.brass;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-36,22,0,TAU);ctx.stroke();
  ctx.lineWidth=1;ctx.strokeStyle='rgba(196,163,84,.6)';ctx.beginPath();ctx.arc(0,-36,28,0,TAU);ctx.stroke();
  ctx.restore();
}
function drawBell(b){
  ctx.save();ctx.strokeStyle=P.brass;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(b.x-14,L.aw-2);ctx.lineTo(b.x,b.y-14);ctx.lineTo(b.x+14,L.aw-2);ctx.stroke();
  ctx.translate(b.x,b.y-14);ctx.rotate(b.ang);
  ctx.strokeStyle='#5a4a20';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,18);ctx.stroke();
  ctx.fillStyle=P.brass;ctx.strokeStyle=P.navy;ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(-8,20);ctx.quadraticCurveTo(-9,30,-14,44);ctx.quadraticCurveTo(-22,52,-24,58);ctx.lineTo(24,58);ctx.quadraticCurveTo(22,52,14,44);ctx.quadraticCurveTo(9,30,8,20);ctx.quadraticCurveTo(0,15,-8,20);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(255,250,220,.5)';ctx.beginPath();ctx.ellipse(-8,40,3,10,0.3,0,TAU);ctx.fill();
  ctx.fillStyle=P.navy;ctx.beginPath();ctx.arc(Math.sin(b.ang*-2)*6,60,4,0,TAU);ctx.fill();
  ctx.restore();
}
function drawSpinner(s){
  ctx.save();ctx.fillStyle='#0b1322';ctx.fillRect(s.x-3,s.y,6,L.counter-s.y);
  ctx.translate(s.x,s.y);
  for(var i=0;i<4;i++){var a=s.a+i*TAU/4,px=Math.cos(a)*s.arm,py=Math.sin(a)*s.arm;
    ctx.strokeStyle=P.navy;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(px,py);ctx.stroke();
    ctx.fillStyle=i%2?P.red:P.cream;ctx.beginPath();ctx.arc(px,py,s.r,0,TAU);ctx.fill();ctx.lineWidth=2.5;ctx.stroke()}
  ctx.fillStyle=P.brass;ctx.beginPath();ctx.arc(0,0,6,0,TAU);ctx.fill();
  ctx.restore();
}
function drawHUD(){
  var W=L.W,H=L.H,cy=L.counter+(H-L.counter)/2+4;
  ctx.textBaseline='middle';
  ctx.textAlign='left';ctx.fillStyle=P.brass;ctx.font='500 12px Oswald, sans-serif';ctx.fillText('SCORE',22,cy-15);
  ctx.fillStyle=P.cream;ctx.font='400 '+(st.portrait?24:28)+'px Rye, Georgia, serif';var sc=CS.fmt(g.score);ctx.fillText(sc,22,cy+8);
  var mult=Math.min(4,1+Math.floor(g.streak/5));
  if(mult>1){var sw=ctx.measureText(sc).width;ctx.fillStyle=P.brass;round(ctx,30+sw,cy-4,38,24,12);ctx.fill();ctx.fillStyle=P.navy;ctx.font='600 15px Oswald, sans-serif';ctx.textAlign='center';ctx.fillText('\u00d7'+mult,49+sw,cy+8)}
  var tx=st.portrait?W*0.43:W*0.4;ctx.textAlign='center';ctx.fillStyle=P.brass;ctx.font='500 12px Oswald, sans-serif';
  ctx.fillText('ROUND '+Math.min(ROUNDS,g.round+1)+'/'+ROUNDS+' \u00b7 HI '+CS.fmt(HI.get()),tx,cy-15);
  var tsec=Math.ceil(g.time),warn=g.mode==='play'&&tsec<=5;ctx.fillStyle=warn&&(Math.floor(performance.now()/250)%2)?P.brass:P.cream;ctx.font='400 28px Rye, Georgia, serif';ctx.fillText('0:'+(tsec<10?'0':'')+tsec,tx,cy+8);
  var cols=st.portrait?12:23,cw=8,ax=st.portrait?W*0.56:W*0.53,ay=cy-10;
  ctx.textAlign='left';ctx.fillStyle=P.brass;ctx.font='500 12px Oswald, sans-serif';ctx.fillText('TUBE \u00b7 '+g.ammo,ax,cy-15-(st.portrait?4:0));
  var bh=st.portrait?11:20;
  for(var i=0;i<Math.max(AMMO,g.ammo);i++){var r=Math.floor(i/cols),c=i%cols,x=ax+c*cw,y=ay+(st.portrait?r*14-4:0),full=i<g.ammo;
    ctx.fillStyle=full?P.brass:'rgba(0,0,0,.3)';ctx.fillRect(x,y,5,bh);if(full){ctx.fillStyle='#8c6d2c';ctx.fillRect(x,y,5,4)}}
}
function drawRifle(){
  var W=L.W,H=L.H,px=W-30,py=H+24,ang=Math.atan2(aim.y-py,aim.x-px),len=(st.portrait?160:Math.min(H*0.32,220))-g.recoil*16;
  ctx.save();ctx.translate(px,py);ctx.rotate(ang);
  ctx.fillStyle='#6b3d1c';ctx.beginPath();ctx.moveTo(-40,-10);ctx.lineTo(len*0.32,-9);ctx.lineTo(len*0.32,9);ctx.lineTo(-40,14);ctx.closePath();ctx.fill();
  ctx.fillStyle='#1a1a1a';ctx.fillRect(len*0.28,-8,len*0.22,14);
  ctx.fillStyle='#2b2b2b';ctx.fillRect(len*0.48,-3.5,len*0.52,7);
  ctx.fillStyle='#7a4620';ctx.fillRect(len*0.55-g.recoil*8,1,len*0.2,8);
  ctx.fillStyle=P.brass;ctx.fillRect(len-4,-6,4,3);
  if(g.flash>0){ctx.globalAlpha=g.flash;ctx.fillStyle='#fff3c4';ctx.beginPath();for(var i=0;i<10;i++){var a=i*TAU/10,r=i%2?7:18+R(0,8);ctx.lineTo(len+10+Math.cos(a)*r,Math.sin(a)*r)}ctx.fill();ctx.globalAlpha=1}
  ctx.restore();
}
function drawAim(){
  var a=aim.show?1:(aim.tap>0?aim.tap/0.45:0);if(!a||g.mode==='title')return;
  var r=13+aim.kick*7;ctx.save();ctx.globalAlpha=a;ctx.translate(aim.x,aim.y);
  ctx.strokeStyle=P.cream;ctx.lineWidth=4.5;ring();ctx.strokeStyle=P.red;ctx.lineWidth=2.2;ring();
  ctx.fillStyle=P.red;ctx.beginPath();ctx.arc(0,0,2,0,TAU);ctx.fill();ctx.restore();
  function ring(){ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.moveTo(-r-7,0);ctx.lineTo(-r+5,0);ctx.moveTo(r-5,0);ctx.lineTo(r+7,0);ctx.moveTo(0,-r-7);ctx.lineTo(0,-r+5);ctx.moveTo(0,r-5);ctx.lineTo(0,r+7);ctx.stroke()}
}
function drawBanner(){
  var b=g.banner,k=b.t/b.dur,a=k<0.15?k/0.15:k>0.8?1-(k-0.8)/0.2:1,W=L.W,H=L.H,y=H*0.42;
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle='rgba(28,46,74,.88)';ctx.fillRect(0,y-46,W,92);ctx.fillStyle=P.brass;ctx.fillRect(0,y-46,W,3);ctx.fillRect(0,y+43,W,3);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=P.cream;ctx.font='400 '+(st.portrait?34:42)+'px Rye, Georgia, serif';ctx.fillText(b.text,W/2,y-8);
  ctx.fillStyle=P.brass;ctx.font='500 '+(st.portrait?14:17)+'px Oswald, sans-serif';ctx.fillText(b.sub,W/2,y+26);ctx.restore();
}

CS.loop(function(dt){update(dt);draw()});
titleScreen();
/* tiny hook for automated smoke tests */
window.__game={state:g,rows:rows,L:L,bells:bells,get plate(){return plate},fire:function(x,y){return fire({x:x,y:y},false)}};
})();
