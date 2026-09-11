/* ══════════════════════════════════════════════════════════
   구덩이가 무너진다 — 25층 보스를 잡은 뒤의 탈출
   본 게임과 떼어 둔다. 이 파일이 없거나 깨져도 본 게임은 돈다.
   ══════════════════════════════════════════════════════════ */
const MINI={
  dur:40,            // 카운트다운(초)
  hitCost:5,         // 부딪히면 깎이는 기력
  brake:0.40,        // 부딪히면 속도가 이만큼으로 떨어진다
  brakeBack:3.0,     // 원래 속도로 돌아오는 데 걸리는 시간
  hitTime:5.4,       // 부딪히면 이만큼(초) 뒤로 떠밀린다
  invuln:0.9,        // 부딪힌 뒤 잠깐 무적
  heal:8,            // 옥빛 구슬이 돌려주는 기력
  clean:38.6,          // 한 번도 안 부딪히면 이쯤에 빠져나간다(초)
};
let MG=null, mT=0, mHold=false;

/* ── 들고 나기 ───────────────────────────────────────── */
function miniStart(kind,done){
  const kinds=['cave','fall','run'];
  MG={ kind:kind&&kinds.includes(kind)?kind:kinds[Math.floor(Math.random()*kinds.length)],
      t:0, left:MINI.dur, prog:0, spd:1, brake:0, hits:0, inv:0, over:null, done,
      quit:false, fx:0, shake:0 };
  mT=performance.now();
  if(MG.kind==='cave') caveInit(); else t3Init(MG.kind==='run');
  S.screen='mini';
  vibe('alertOn');
}
function miniEnd(how){                       // 'clear' | 'timeout' | 'dead' | 'quit'
  const done=MG.done; const kind=MG.kind; MG=null;
  if(how==='dead'){ S.energy=0; S.screen='play'; runEnd(false); return; }
  S.screen='play'; show(null);
  if(how==='clear'){
    const ink=120+Math.round(S.stage*6);
    S.bonusInk=(S.bonusInk||0)+ink;
    S.energy=Math.min(S.energyMax, S.energy+Math.round(S.energyMax*0.25));
    S.alertMsg={text:`구덩이를 빠져나왔다 — 먹 +${ink}`,t:2.6,ok:true};
    S.winFlash=1; vibe('boss');
  }else if(how==='timeout'){
    S.energy=1;
    S.alertMsg={text:'무너진 흙에 묻혔다 — 간신히 기어 나왔다',t:2.6,ok:false};
    vibe('wrong');
  }else{
    S.alertMsg={text:'되돌아 나왔다',t:1.8,ok:false};
  }
  if(done) done();
}
function miniHit(n){
  if(MG.inv>0)return;
  MG.inv=MINI.invuln; MG.hits++; MG.brake=MINI.brakeBack; MG.fx=1; MG.shake=22;
  MG.prog=Math.max(0, MG.prog-MINI.hitTime/MINI.clean);   // 뒤로 떠밀린다
  S.energy-=(n||MINI.hitCost);
  vibe('hurt');
  if(S.energy<=0){ miniEnd('dead'); }
}

/* ── 매 프레임 ──────────────────────────────────────── */
function miniTick(dt){
  MG.t+=dt; MG.left=Math.max(0,MINI.dur-MG.t);
  MG.inv=Math.max(0,MG.inv-dt);
  MG.fx=Math.max(0,MG.fx-dt*2.2);
  MG.shake=Math.max(0,MG.shake-dt*60);
  if(MG.brake>0) MG.brake=Math.max(0,MG.brake-dt);
  /* 시간이 갈수록 빨라지고, 부딪히면 뚝 떨어졌다 돌아온다 */
  const ramp=0.80+ Math.pow(MG.t/MINI.dur,1.25)*1.55;   // 처음엔 순하게
  const b=MG.brake>0 ? MINI.brake+(1-MINI.brake)*(1-MG.brake/MINI.brakeBack) : 1;
  MG.spd=ramp*b;
  MG.prog+=MG.spd*dt/MINI.clean;
  if(MG.kind==='cave') caveTick(dt); else t3Tick(dt);
  if(MG.prog>=1){ miniEnd('clear'); return; }
  if(MG.left<=0){ miniEnd('timeout'); return; }
}
function miniDraw(){
  ctx.save();
  if(MG.shake>0){ const s=MG.shake;
    ctx.translate((Math.random()-.5)*s,(Math.random()-.5)*s); }
  ctx.fillStyle='#05080F'; ctx.fillRect(-60,-60,VW+120,VH+120);
  if(MG.kind==='cave') caveDraw(); else t3Draw();
  ctx.restore();
  miniHud();
  if(MG.fx>0){                                   // 부딪힌 순간 테두리가 붉게
    ctx.save(); ctx.globalAlpha=MG.fx*0.85;
    ctx.strokeStyle='#E2453A'; ctx.shadowColor='#E2453A';
    for(const [lw,bl] of [[40,22],[16,40]]){
      ctx.lineWidth=lw; ctx.shadowBlur=bl;
      ctx.strokeRect(lw/2,lw/2,VW-lw,VH-lw);
    }
    ctx.restore();
  }
}
/* ── 위쪽 표시 — 가운데 남은 길, 오른쪽 속도, 왼쪽 기력 ── */
function miniHud(){
  const urgent=MG.left<10;
  ctx.save();
  ctx.textBaseline='alphabetic';
  const bw=420, bx=VW/2-bw/2, by=126;
  ctx.textAlign='center';
  ctx.font=`600 22px 'IBM Plex Sans KR',sans-serif`;
  ctx.fillStyle='rgba(222,211,184,.7)';
  ctx.fillText('남은 길',VW/2,by-46);
  ctx.fillStyle='rgba(255,255,255,.10)'; roundRect(bx,by-30,bw,16,8); ctx.fill();
  const left=Math.max(0,1-MG.prog);
  ctx.fillStyle=C['--jade']; ctx.shadowColor=C['--jade']; ctx.shadowBlur=14;
  roundRect(bx+bw*(1-left),by-30,Math.max(6,bw*left),16,8); ctx.fill();
  ctx.shadowBlur=0;
  ctx.font=`700 56px 'Gowun Batang',serif`;
  ctx.fillStyle=urgent?'#E2453A':C['--gold'];
  if(urgent){ ctx.shadowColor='#E2453A'; ctx.shadowBlur=18+10*Math.sin(MG.t*12); }
  ctx.fillText(MG.left.toFixed(1),VW/2,by+44);
  ctx.shadowBlur=0;
  ctx.textAlign='right';
  ctx.font=`600 20px 'IBM Plex Sans KR',sans-serif`;
  ctx.fillStyle='rgba(222,211,184,.55)';
  ctx.fillText('속도',VW-80,by-46);
  ctx.font=`700 42px 'Gowun Batang',serif`;
  ctx.fillStyle=MG.brake>0?'#E2453A':C['--paper'];
  ctx.fillText('×'+MG.spd.toFixed(2),VW-80,by-6);
  ctx.font=`600 19px 'IBM Plex Sans KR',sans-serif`;
  ctx.fillStyle='rgba(222,211,184,.45)';
  ctx.fillText(`부딪힘 ${MG.hits}`,VW-80,by+24);
  ctx.textAlign='left';
  ctx.font=`600 20px 'IBM Plex Sans KR',sans-serif`;
  ctx.fillStyle='rgba(222,211,184,.55)';
  ctx.fillText('기력',80,by-46);
  ctx.fillStyle='rgba(255,255,255,.10)'; roundRect(80,by-30,190,16,8); ctx.fill();
  ctx.fillStyle=S.energy<=20?'#E2453A':C['--paper'];
  roundRect(80,by-30,Math.max(5,190*Math.max(0,S.energy/S.energyMax)),16,8); ctx.fill();
  if(MG.t>10){
    ctx.globalAlpha=.55; ctx.textAlign='center';
    ctx.font=`600 22px 'IBM Plex Sans KR',sans-serif`;
    ctx.fillStyle='rgba(222,211,184,.9)';
    ctx.fillText('그만둔다',VW/2,VH-60);
    ctx.strokeStyle='rgba(222,211,184,.35)'; ctx.lineWidth=2;
    roundRect(VW/2-90,VH-92,180,46,10); ctx.stroke();
  }
  ctx.restore();
  miniPad();
}
/* ── 미니게임 전용 조이스틱 ─────────────────────────── */
function miniPad(){
  if(MG.kind==='cave')return;
  const hx=190, hy=VH-230, R=110;
  const on=mStick.id!==null;
  const cx=on?mStick.ox:hx, cy=on?mStick.oy:hy;
  ctx.save();
  ctx.globalAlpha=on?.55:.30;
  ctx.strokeStyle=C['--paper']; ctx.lineWidth=3;
  ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.stroke();
  ctx.globalAlpha=on?.9:.45;
  ctx.fillStyle=C['--paper'];
  const a=mAxis();
  ctx.beginPath(); ctx.arc(cx+a.x*R, cy+(MG.kind==='fall'?a.y*R:0), 34,0,7); ctx.fill();
  if(!on){
    ctx.globalAlpha=.5; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font=`600 20px 'IBM Plex Sans KR',sans-serif`;
    ctx.fillStyle=C['--paper'];
    ctx.fillText(MG.kind==='fall'?'끌어서 피한다':'끌어서 좌우',cx,cy+R+30);
  }
  if(MG.kind==='run'){
    ctx.globalAlpha=.35; ctx.strokeStyle=C['--gold']; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(VW-190,VH-230,96,0,7); ctx.stroke();
    ctx.globalAlpha=.65; ctx.fillStyle=C['--gold'];
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font=`700 30px 'Gowun Batang',serif`;
    ctx.fillText('뛴다',VW-190,VH-230);
  }
  ctx.restore();
}

/* ══════════════════════════════════════════════════════════
   ① 동굴 비행 — 누르면 오르고 놓으면 떨어진다
   ══════════════════════════════════════════════════════════ */
const CAVE={
  px:VW*0.30, grav:1250, thrust:-2050, vmax:820,   // 훨씬 무겁고 느리게
  step:46,                     // 지형 한 칸의 가로 폭
  base:900, speed:395,         // 기본 흐름 속도(가로)
};
let cv2=null;
function caveInit(){
  cv2={ y:VH*0.5, vy:0, ox:0, seg:[], rocks:[], pills:[], gates:[], guns:[], shots:[], ang:0, trail:[] };
  let x=0, mid=VH*0.5, gap=700;
  for(let i=0;i<60;i++){ cv2.seg.push(caveSeg(x,mid,gap)); x+=CAVE.step;
    mid+=(Math.random()-.5)*40; gap-=1; }
  cv2.nx=x;
}
function caveSeg(x,mid,gap){
  mid=Math.max(CEIL_Y+gap/2+40, Math.min(VH-gap/2-120, mid));
  return {x, top:mid-gap/2, bot:mid+gap/2, mid, gap};
}
function caveGen(){
  const s=cv2.seg[cv2.seg.length-1];
  const p=MG.prog;
  const gap=Math.max(280, 700-420*p);                 // 갈수록 좁아진다
  const wob=(0.9+2.4*p);
  let mid=s.mid+(Math.random()-.5)*46*wob;
  cv2.seg.push(caveSeg(cv2.nx, mid, gap+(Math.random()-.5)*40));
  cv2.nx+=CAVE.step;
  /* 통로 한복판의 바위 — 벽만이 아니라 길을 막는다 */
  if(p>0.14 && Math.random()<0.05+0.10*p){
    const g=cv2.seg[cv2.seg.length-1];
    const r=26+Math.random()*30;
    cv2.rocks.push({x:g.x, y:g.top+r+Math.random()*Math.max(10,g.gap-r*2), r,
                    a:Math.random()*7, sp:(Math.random()-.5)*1.6});
  }
  /* 위아래로 오르내리는 기둥 */
  if(p>0.35 && Math.random()<0.035+0.05*p){
    const g=cv2.seg[cv2.seg.length-1];
    cv2.pills.push({x:g.x, y:g.mid, h:g.gap*0.42, ph:Math.random()*7, sw:g.gap*0.22});
  }
  /* 옥빛 구슬 — 일부러 벽에 붙여 둔다 */
  caveGimmick();
  if(Math.random()<0.022){
    const g=cv2.seg[cv2.seg.length-1];
    const side=Math.random()<.5?1:-1;
    cv2.pills.length;
    cv2.rocks.push({x:g.x, y:g.mid+side*g.gap*0.36, r:17, heal:true, a:0, sp:2.2});
  }
}
function caveAt(x){                                   // 그 자리의 위아래 벽
  const i=Math.floor((x+cv2.ox)/CAVE.step);
  return cv2.seg[Math.max(0,Math.min(cv2.seg.length-1,i))];
}
function caveTick(dt){
  const flow=CAVE.speed*MG.spd;
  cv2.ox+=flow*dt;
  while(cv2.seg.length && cv2.seg[0].x < cv2.ox-CAVE.step*2) cv2.seg.shift();
  while(cv2.nx < cv2.ox+VW+CAVE.step*4) caveGen();
  /* 누르면 오른다 */
  cv2.vy += (mHold?CAVE.thrust:CAVE.grav)*dt;
  cv2.vy = Math.max(-CAVE.vmax, Math.min(CAVE.vmax, cv2.vy));
  cv2.y += cv2.vy*dt;
  cv2.ang = Math.max(-0.5,Math.min(0.5, cv2.vy/1000));
  cv2.trail.push({x:CAVE.px, y:cv2.y}); if(cv2.trail.length>16) cv2.trail.shift();
  /* 벽 */
  const g=caveAt(CAVE.px);
  if(cv2.y<g.top+26){ cv2.y=g.top+26; cv2.vy=180; miniHit(); }
  if(cv2.y>g.bot-26){ cv2.y=g.bot-26; cv2.vy=-180; miniHit(); }
  /* 바위·구슬 */
  for(let i=cv2.rocks.length-1;i>=0;i--){
    const r=cv2.rocks[i]; r.a+=r.sp*dt;
    if(r.x<cv2.ox-80){ cv2.rocks.splice(i,1); continue; }
    const sx=r.x-cv2.ox;
    if(Math.abs(sx-CAVE.px)<r.r+22 && Math.abs(r.y-cv2.y)<r.r+22){
      if(r.heal){ S.energy=Math.min(S.energyMax,S.energy+MINI.heal);
                  spawnGrainsSafe(sx,r.y,8); cv2.rocks.splice(i,1); vibe('right'); }
      else miniHit();
    }
  }
  caveGimTick(dt);
  for(let i=cv2.pills.length-1;i>=0;i--){
    const q=cv2.pills[i];
    if(q.x<cv2.ox-80){ cv2.pills.splice(i,1); continue; }
    q.ph+=dt*1.7;
    const sx=q.x-cv2.ox, cy=q.y+Math.sin(q.ph)*q.sw;
    if(Math.abs(sx-CAVE.px)<22+14 && Math.abs(cy-cv2.y)<q.h/2+22) miniHit();
  }
}
function spawnGrainsSafe(x,y,n){ if(typeof spawnGrains==='function'){
  const px=S.px, py=S.py; S.px=CAVE.px; S.py=cv2.y+6; spawnGrains(x,y,n); S.px=px; S.py=py; } }

function caveDraw(){
  const ox=cv2.ox;
  /* 뒤쪽 결 — 시차 */
  ctx.save(); ctx.globalAlpha=.16; ctx.strokeStyle=C['--jade']; ctx.lineWidth=2;
  for(let k=0;k<14;k++){
    const x=((k*180 - ox*0.35)%(VW+360))-180;
    ctx.beginPath(); ctx.moveTo(x,CEIL_Y); ctx.lineTo(x-40,VH); ctx.stroke();
  }
  ctx.restore();
  /* 위아래 벽 */
  const path=(which)=>{
    ctx.beginPath();
    ctx.moveTo(-40, which==='top'?CEIL_Y-80:VH+80);
    for(const g of cv2.seg){ const sx=g.x-ox;
      if(sx<-80||sx>VW+80)continue;
      ctx.lineTo(sx, which==='top'?g.top:g.bot); }
    ctx.lineTo(VW+40, which==='top'?CEIL_Y-80:VH+80);
    ctx.closePath();
  };
  for(const w of ['top','bot']){
    ctx.save();
    path(w);
    ctx.fillStyle='rgba(10,16,26,.96)'; ctx.fill();
    ctx.strokeStyle=C['--jade']; ctx.shadowColor=C['--jade']; ctx.shadowBlur=16;
    ctx.lineWidth=4; ctx.stroke();
    ctx.restore();
  }
  /* 바위와 구슬 */
  for(const r of cv2.rocks){
    const sx=r.x-ox; if(sx<-80||sx>VW+80)continue;
    ctx.save(); ctx.translate(sx,r.y); ctx.rotate(r.a);
    if(r.heal){
      ctx.strokeStyle=C['--jade']; ctx.shadowColor=C['--jade']; ctx.shadowBlur=22;
      ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,r.r,0,7); ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,r.r*0.45,0,7); ctx.stroke();
    }else{
      ctx.strokeStyle='#E2453A'; ctx.shadowColor='#E2453A'; ctx.shadowBlur=18;
      ctx.fillStyle='rgba(30,10,12,.9)'; ctx.lineWidth=3.5;
      ctx.beginPath();
      for(let k=0;k<7;k++){ const a=k/7*7, rr=r.r*(0.72+0.34*((k*37)%10)/10);
        k?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  /* 기둥 */
  for(const q of cv2.pills){
    const sx=q.x-ox; if(sx<-80||sx>VW+80)continue;
    const cy=q.y+Math.sin(q.ph)*q.sw;
    ctx.save();
    ctx.strokeStyle='#E2453A'; ctx.shadowColor='#E2453A'; ctx.shadowBlur=16;
    ctx.fillStyle='rgba(30,10,12,.85)'; ctx.lineWidth=3.5;
    roundRect(sx-20, cy-q.h/2, 40, q.h, 8); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  caveGimDraw();
  /* 지나온 자취 */
  ctx.save(); ctx.strokeStyle='rgba(243,237,223,.35)'; ctx.lineWidth=3; ctx.lineCap='round';
  ctx.beginPath();
  cv2.trail.forEach((p,i)=>{ const x=p.x-(cv2.trail.length-1-i)*13;
    i?ctx.lineTo(x,p.y):ctx.moveTo(x,p.y); });
  ctx.stroke(); ctx.restore();
  drawSeonbi(CAVE.px, cv2.y, cv2.ang, MG.inv>0);
}

/* ══════════════════════════════════════════════════════════
   선비 — 옆모습. 갓 · 도포 · 날리는 자락
   ══════════════════════════════════════════════════════════ */
function drawSeonbi(x,y,ang,blink){
  const K=1.0, t=performance.now()/1000;
  ctx.save();
  ctx.translate(x,y); ctx.rotate(ang*0.7); ctx.scale(K,K);
  if(blink) ctx.globalAlpha=.4+.35*Math.sin(t*40);
  const ink='#F3EDDF', line='rgba(243,237,223,.95)';
  ctx.lineJoin='round'; ctx.lineCap='round';

  /* 날리는 옷자락 — 뒤로 세 획 */
  ctx.strokeStyle='rgba(243,237,223,.55)'; ctx.lineWidth=3.5;
  ctx.shadowColor=ink; ctx.shadowBlur=10;
  for(let k=0;k<3;k++){
    const w=8+k*9, s=Math.sin(t*9+k*1.2)*5;
    ctx.beginPath();
    ctx.moveTo(-14, 2+k*6);
    ctx.quadraticCurveTo(-40-w, 6+k*8+s, -66-w*1.6, -2+k*10+s*1.5);
    ctx.stroke();
  }
  /* 도포 — 몸통 */
  ctx.shadowBlur=14;
  ctx.fillStyle='rgba(12,18,28,.92)'; ctx.strokeStyle=line; ctx.lineWidth=4;
  ctx.beginPath();
  ctx.moveTo(-16,-14);
  ctx.quadraticCurveTo(-4,-20, 12,-12);      // 어깨
  ctx.quadraticCurveTo(22,4, 16,24);         // 앞자락
  ctx.quadraticCurveTo(0,32, -18,22);        // 아랫단
  ctx.quadraticCurveTo(-24,2, -16,-14);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  /* 허리띠 */
  ctx.strokeStyle='rgba(229,178,79,.9)'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(-17,4); ctx.quadraticCurveTo(0,10,17,3); ctx.stroke();
  /* 앞으로 뻗은 소매 */
  ctx.strokeStyle=line; ctx.lineWidth=4; ctx.fillStyle='rgba(12,18,28,.92)';
  ctx.beginPath();
  ctx.moveTo(6,-8); ctx.quadraticCurveTo(24,-6, 30,2);
  ctx.quadraticCurveTo(22,10, 6,6); ctx.closePath();
  ctx.fill(); ctx.stroke();
  /* 얼굴 */
  ctx.fillStyle=ink; ctx.shadowBlur=16;
  ctx.beginPath(); ctx.arc(4,-26,11,0,7); ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(10,14,22,.8)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(8,-28); ctx.lineTo(12,-27); ctx.stroke();   // 눈
  /* 갓 — 통과 챙 */
  ctx.strokeStyle=line; ctx.lineWidth=4; ctx.shadowColor=ink; ctx.shadowBlur=12;
  ctx.fillStyle='rgba(8,14,22,.95)';
  ctx.beginPath(); ctx.ellipse(2,-38,26,7,0,0,7); ctx.fill(); ctx.stroke();  // 챙
  ctx.beginPath();
  ctx.moveTo(-8,-38); ctx.lineTo(-6,-54); ctx.lineTo(12,-54); ctx.lineTo(14,-38);
  ctx.closePath(); ctx.fill(); ctx.stroke();                                // 통
  ctx.beginPath(); ctx.ellipse(3,-54,9,3.2,0,0,7); ctx.stroke();
  /* 갓끈 — 뒤로 흩날린다 */
  ctx.strokeStyle='rgba(229,178,79,.85)'; ctx.lineWidth=2.5; ctx.shadowBlur=8;
  for(const s of [0,1]){
    ctx.beginPath(); ctx.moveTo(-16,-36);
    ctx.quadraticCurveTo(-34,-30+Math.sin(t*11+s*2)*7, -52,-24+s*8+Math.sin(t*9+s)*6);
    ctx.stroke();
  }
  ctx.restore();
}

/* ── 조작 — 미니게임일 때만 가로챈다 ─────────────────── */
let mStick={id:null, ox:0, oy:0, x:0, y:0};
const mAxis=()=>{
  if(mStick.id===null) return {x:0,y:0};
  const R=110;
  return {x:Math.max(-1,Math.min(1,(mStick.x-mStick.ox)/R)),
          y:Math.max(-1,Math.min(1,(mStick.y-mStick.oy)/R))};
};
(function(){
  const V=e=>{ const r=cv.getBoundingClientRect();
    return {x:(e.clientX-r.left)/r.width*VW, y:(e.clientY-r.top)/r.height*VH}; };
  cv.addEventListener('pointerdown',e=>{
    if(!MG||S.screen!=='mini')return;
    e.stopPropagation();
    const p=V(e);
    if(MG.t>10 && Math.abs(p.x-VW/2)<100 && p.y>VH-100 && p.y<VH-40){ miniEnd('quit'); return; }
    if(MG.kind==='cave'){ mHold=true; return; }
    if(p.x<VW/2){ mStick.id=e.pointerId; mStick.ox=p.x; mStick.oy=p.y; mStick.x=p.x; mStick.y=p.y; }
    else if(MG.kind==='run' && W3 && W3.onFloor){ W3.vy=T3.jump; W3.onFloor=false; vibe('charged'); }
  },true);
  cv.addEventListener('pointermove',e=>{
    if(!MG||S.screen!=='mini')return;
    if(mStick.id===e.pointerId){ const p=V(e); mStick.x=p.x; mStick.y=p.y; e.stopPropagation(); }
  },true);
  const up=e=>{ if(!MG||S.screen!=='mini')return; e.stopPropagation();
    if(mStick.id===e.pointerId) mStick.id=null;
    mHold=false; };
  cv.addEventListener('pointerup',up,true);
  cv.addEventListener('pointercancel',up,true);
})();

/* ── 본 게임의 그리기에 얹는다 ───────────────────────── */
(function(){
  const prev=draw;
  draw=function(){
    prev();
    if(!MG||!S||S.screen!=='mini')return;
    const now=performance.now();
    const dt=Math.min(0.05,(now-mT)/1000); mT=now;
    miniTick(dt);
    if(MG) miniDraw();
  };
})();

/* ══════════════════════════════════════════════════════════
   ② 낙하 · ③ 질주 — 선으로 된 통로. 진짜 원근 투영을 쓴다
   두 판은 같은 엔진이다. 축과 중력만 다르다
   ══════════════════════════════════════════════════════════ */
const T3={
  F:640,            // 초점거리
  W:250,            // 통로 반폭(가로·세로)
  ZC:170,           // 선비가 서 있는 깊이
  FAR:2600,         // 여기서 태어나 다가온다
  ring:170,         // 사각 테 간격
  base:820,         // 기본 다가오는 속도
  move:760,         // 좌우(상하) 움직임 속도
  grav:3400, jump:-1500,
};
let W3=null;
const curZ=z=>W3.run ? Math.sin((z+W3.rolled)*0.0013+W3.seed)*T3.W*1.7
                        + Math.sin((z+W3.rolled)*0.0004+W3.seed*2)*T3.W*1.1 : 0;
const p3=(x,y,z)=>{ const s=T3.F/Math.max(24,z), off=curZ(z)-curZ(T3.ZC);
  return {x:VW/2+(x+off-W3.cx)*s, y:VH*0.52+(y-W3.cy)*s, s}; };

function t3Init(run){
  W3={ run, cx:0, cy:run?T3.W-70:0, vx:0, vy:0, onFloor:true,
       z0:0, obs:[], nextZ:T3.FAR, ang:0, lean:0, jumpHeld:false,
       seed:Math.random()*7, rolled:0 };
  for(let z=T3.ring; z<T3.FAR; z+=T3.ring) W3.obs.push({kind:'ring',z});
}
function t3Gen(){
  const p=MG.prog, run=W3.run;
  W3.obs.push({kind:'ring', z:W3.nextZ});
  const r=Math.random();
  const hard=0.18+0.55*p;
  if(r<hard){
    const z=W3.nextZ+T3.ring*0.5;
    if(run){
      if(Math.random()<0.45)
        W3.obs.push({kind:'wall', z, x:(Math.random()-.5)*T3.W*1.1,
                     w:70+Math.random()*90, h:T3.W*2, hit:false});   // 기둥 — 옆으로 피한다
      else if(Math.random()<0.42)
        W3.obs.push({kind:'pit', z, len:T3.ring*(0.7+0.6*p), hit:false});   // 길이 끊겼다
      else
        W3.obs.push({kind:'hurdle', z, x:(Math.random()-.5)*T3.W*0.9,
                     w:120+Math.random()*160, hh:70+Math.random()*60, hit:false}); // 턱 — 뛰어넘는다
    }else{
      const t=Math.random();
      if(t<0.34) W3.obs.push({kind:'plate', z, hx:(Math.random()-.5)*T3.W*0.9,
                              hy:(Math.random()-.5)*T3.W*0.9,
                              hr:Math.max(72,150-70*p), hit:false});
      else if(t<0.64) W3.obs.push({kind:'bar', z, vert:Math.random()<.5,
                              o:(Math.random()-.5)*T3.W, w:46+40*p,
                              sp:(0.6+1.4*p)*(Math.random()<.5?-1:1), hit:false});
      else if(t<0.86) W3.obs.push({kind:'cross', z, a:Math.random()*7,
                              sp:(0.8+1.6*p)*(Math.random()<.5?-1:1),
                              arm:34+26*p, hit:false});
      else W3.obs.push({kind:'iris', z, ph:Math.random()*7,
                              r0:Math.max(85,175-80*p), hit:false});
    }
  }
  if(Math.random()<0.055) W3.obs.push({kind:'gem', z:W3.nextZ+T3.ring*0.5,
                              x:(Math.random()-.5)*T3.W*1.2,
                              y:run?T3.W-90:(Math.random()-.5)*T3.W*1.2, hit:false});
  W3.nextZ+=T3.ring;
}
function t3Tick(dt){
  const flow=T3.base*MG.spd;
  /* 움직임 */
  const L=mAxis();
  W3.cx=Math.max(-T3.W+40,Math.min(T3.W-40, W3.cx+L.x*T3.move*dt));
  W3.lean+=((L.x)-W3.lean)*Math.min(1,dt*9);
  if(W3.run){
    W3.vy+=T3.grav*dt; W3.cy+=W3.vy*dt;
    const floor=T3.W-70;
    if(W3.cy>=floor){ W3.cy=floor; W3.vy=0; W3.onFloor=true; }
    else W3.onFloor=false;
  }else{
    W3.cy=Math.max(-T3.W+40,Math.min(T3.W-40, W3.cy+L.y*T3.move*dt));
  }
  W3.ang+=dt;
  /* 다가온다 */
  for(let i=W3.obs.length-1;i>=0;i--){
    const o=W3.obs[i];
    o.z-=flow*dt;
    if(o.z<-120){ W3.obs.splice(i,1); continue; }
    if(o.kind==='bar')   o.o=Math.sin(W3.ang*o.sp)*T3.W*0.62;
    if(o.kind==='cross') o.a+=o.sp*dt;
    if(o.kind==='iris')  o.ph+=dt*1.9;
    if(!o.hit && o.z<=T3.ZC && o.z>T3.ZC-flow*dt-10){
      o.hit=true;
      if(o.kind==='gem'){
        if(Math.hypot(o.x-W3.cx,o.y-W3.cy)<86){
          S.energy=Math.min(S.energyMax,S.energy+MINI.heal);
          vibe('right'); o.got=true;
        }
      }else if(t3Block(o)) miniHit();
    }
  }
  W3.rolled+=flow*dt;                      // 길이 흘러간 만큼 곡선도 흐른다
  W3.nextZ-=flow*dt;                       // 먼 끝도 같이 다가온다
  let guard=0;
  while(W3.nextZ<=T3.FAR && guard++<12) t3Gen();   // 한 칸 지날 때마다 새로 깐다
}
function t3Block(o){
  const x=W3.cx, y=W3.cy, R=46;
  switch(o.kind){
    case 'plate':  return Math.hypot(x-o.hx,y-o.hy) > o.hr-R;
    case 'bar':    return o.vert ? Math.abs(x-o.o)<o.w+R : Math.abs(y-o.o)<o.w+R;
    case 'cross':  { for(let k=0;k<4;k++){ const a=o.a+k*Math.PI/2;
                       const dx=Math.cos(a), dy=Math.sin(a);
                       const t=x*dx+y*dy; if(t<0) continue;
                       if(Math.abs(-x*dy+y*dx)<o.arm+R*0.6) return true; }
                     return false; }
    case 'iris':   { const r=o.r0*(0.72+0.42*(0.5+0.5*Math.sin(o.ph)));
                     return Math.hypot(x,y) > r-R; }
    case 'wall':   return Math.abs(x-o.x)<o.w+R;
    case 'hurdle': return Math.abs(x-o.x)<o.w+R && (T3.W-70-y)<o.hh;
    case 'pit':    return W3.onFloor;                     // 발이 땅에 있으면 빠진다
  }
  return false;
}
/* ── 그리기 ─────────────────────────────────────────── */
function t3Draw(){
  const jade=C['--jade'], red='#E2453A';
  ctx.save();
  /* 소실점으로 뻗는 모서리 선 넷 */
  ctx.strokeStyle='rgba(82,191,160,.30)'; ctx.lineWidth=2;
  for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
    const a=p3(sx*T3.W, sy*T3.W, 40), b=p3(sx*T3.W, sy*T3.W, T3.FAR);
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
  }
  const list=[...W3.obs].sort((a,b)=>b.z-a.z);        // 먼 것부터
  for(const o of list){
    if(o.z<30) continue;
    const s=T3.F/o.z, fade=Math.max(0,Math.min(1,(T3.FAR-o.z)/T3.FAR*1.6));
    const lw=Math.max(1, 5*s*1.4);
    if(o.kind==='ring'){
      ctx.globalAlpha=fade*0.55; ctx.strokeStyle=jade; ctx.lineWidth=lw*0.7;
      ctx.shadowColor=jade; ctx.shadowBlur=8*s*8;
      const a=p3(-T3.W,-T3.W,o.z), b=p3(T3.W,T3.W,o.z);
      ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
      if(W3.run){                                     // 바닥 결
        ctx.globalAlpha=fade*0.35;
        const f1=p3(-T3.W,T3.W,o.z), f2=p3(T3.W,T3.W,o.z);
        ctx.beginPath(); ctx.moveTo(f1.x,f1.y); ctx.lineTo(f2.x,f2.y); ctx.stroke();
      }
      ctx.shadowBlur=0; continue;
    }
    ctx.globalAlpha=fade; ctx.lineWidth=lw;
    if(o.kind==='gem'){
      if(o.got) continue;
      const c=p3(o.x,o.y,o.z);
      ctx.strokeStyle=jade; ctx.shadowColor=jade; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.arc(c.x,c.y,26*s*1.6,0,7); ctx.stroke();
      ctx.beginPath(); ctx.arc(c.x,c.y,12*s*1.6,0,7); ctx.stroke();
      ctx.shadowBlur=0; continue;
    }
    ctx.strokeStyle=red; ctx.shadowColor=red; ctx.shadowBlur=14;
    ctx.fillStyle='rgba(34,10,14,.55)';
    if(o.kind==='plate'){
      const a=p3(-T3.W,-T3.W,o.z), b=p3(T3.W,T3.W,o.z), h=p3(o.hx,o.hy,o.z);
      ctx.save();
      ctx.beginPath(); ctx.rect(a.x,a.y,b.x-a.x,b.y-a.y);
      ctx.arc(h.x,h.y,o.hr*s,0,7,true); ctx.fill('evenodd');
      ctx.restore();
      ctx.beginPath(); ctx.arc(h.x,h.y,o.hr*s,0,7); ctx.stroke();
      ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
    }else if(o.kind==='bar'){
      const a=o.vert?p3(o.o-o.w,-T3.W,o.z):p3(-T3.W,o.o-o.w,o.z);
      const b=o.vert?p3(o.o+o.w, T3.W,o.z):p3( T3.W,o.o+o.w,o.z);
      ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);
      ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
    }else if(o.kind==='cross'){
      const c=p3(0,0,o.z);
      ctx.beginPath();
      for(let k=0;k<4;k++){ const a=o.a+k*Math.PI/2;
        ctx.moveTo(c.x,c.y);
        ctx.lineTo(c.x+Math.cos(a)*T3.W*1.4*s, c.y+Math.sin(a)*T3.W*1.4*s); }
      ctx.lineWidth=o.arm*2*s; ctx.stroke();
    }else if(o.kind==='iris'){
      const c=p3(0,0,o.z);
      const r=o.r0*(0.72+0.42*(0.5+0.5*Math.sin(o.ph)))*s;
      const a=p3(-T3.W,-T3.W,o.z), b=p3(T3.W,T3.W,o.z);
      ctx.save();
      ctx.beginPath(); ctx.rect(a.x,a.y,b.x-a.x,b.y-a.y);
      ctx.arc(c.x,c.y,r,0,7,true); ctx.fill('evenodd');
      ctx.restore();
      ctx.beginPath(); ctx.arc(c.x,c.y,r,0,7); ctx.stroke();
    }else if(o.kind==='wall'){
      const a=p3(o.x-o.w,-T3.W,o.z), b=p3(o.x+o.w,T3.W,o.z);
      ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y); ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
    }else if(o.kind==='pit'){
      const a=p3(-T3.W,T3.W,o.z), b=p3(T3.W,T3.W,o.z);
      const c=p3(-T3.W,T3.W,o.z+o.len), d=p3(T3.W,T3.W,o.z+o.len);
      ctx.beginPath();
      ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineTo(d.x,d.y); ctx.lineTo(c.x,c.y);
      ctx.closePath();
      ctx.fillStyle='rgba(0,0,0,.92)'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(d.x,d.y);
      ctx.moveTo(b.x,b.y); ctx.lineTo(c.x,c.y); ctx.lineWidth=lw*0.6; ctx.stroke();
    }else if(o.kind==='hurdle'){
      const a=p3(o.x-o.w,T3.W-70-o.hh,o.z), b=p3(o.x+o.w,T3.W,o.z);
      ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y); ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
    }
    ctx.shadowBlur=0;
  }
  ctx.restore();
  /* 선비 */
  const me=p3(W3.cx,W3.cy,T3.ZC);
  if(W3.run) drawSeonbiBack(me.x, me.y, me.s, W3.lean, MG.inv>0, !W3.onFloor);
  else       drawSeonbiDown(me.x, me.y, me.s, W3.lean, MG.inv>0);
}
/* 뒤에서 본 선비 — 질주. 가늘고 길게 */
function drawSeonbiBack(x,y,s,lean,blink,air){
  const t=performance.now()/1000, K=s*0.62;
  const run=Math.sin(t*15), run2=Math.sin(t*15+Math.PI);
  ctx.save(); ctx.translate(x,y); ctx.scale(K,K); ctx.rotate(lean*0.26);
  if(blink) ctx.globalAlpha=.4+.35*Math.sin(t*40);
  const line='rgba(243,237,223,.95)';
  ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.shadowColor='#F3EDDF';

  /* 길게 끌리는 도포 자락 — 뒤로 흐른다 */
  ctx.strokeStyle='rgba(243,237,223,.42)'; ctx.lineWidth=3; ctx.shadowBlur=12;
  for(let k=0;k<3;k++){
    const sx=k===2?0:(k?1:-1), w=10+k*7;
    ctx.beginPath(); ctx.moveTo(sx*9,4);
    ctx.quadraticCurveTo(sx*(16+w), 30+Math.sin(t*11+k)*6, sx*(10+w*0.5), 62+k*8);
    ctx.stroke();
  }
  /* 다리 — 달린다 */
  ctx.strokeStyle=line; ctx.lineWidth=4.5; ctx.shadowBlur=8;
  for(const [sx,ph] of [[-1,run],[1,run2]]){
    const knee=air? -8 : ph*12;
    ctx.beginPath(); ctx.moveTo(sx*5,18);
    ctx.quadraticCurveTo(sx*8, 32+knee, sx*(6+ph*7), 48+(air?-10:0));
    ctx.stroke();
  }
  /* 몸통 — 좁고 길게 */
  ctx.strokeStyle=line; ctx.lineWidth=4; ctx.fillStyle='rgba(12,18,28,.94)';
  ctx.shadowBlur=12;
  ctx.beginPath();
  ctx.moveTo(-12,-14);
  ctx.quadraticCurveTo(0,-18,12,-14);          // 어깨 — 좁게
  ctx.lineTo(9,20);                            // 허리까지 가늘게
  ctx.quadraticCurveTo(0,24,-9,20);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  /* 허리띠 */
  ctx.strokeStyle='rgba(229,178,79,.95)'; ctx.lineWidth=2.6;
  ctx.beginPath(); ctx.moveTo(-10,6); ctx.quadraticCurveTo(0,9,10,6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2,8);
  ctx.quadraticCurveTo(6,22+Math.sin(t*9)*4, 3,34); ctx.stroke();   // 띠 끝
  /* 팔 */
  ctx.strokeStyle=line; ctx.lineWidth=4;
  for(const [sx,ph] of [[-1,run2],[1,run]]){
    ctx.beginPath(); ctx.moveTo(sx*11,-9);
    if(air) ctx.quadraticCurveTo(sx*22,-22, sx*18,-34);
    else    ctx.quadraticCurveTo(sx*19,-2+ph*8, sx*13, 12+ph*10);
    ctx.stroke();
  }
  /* 목과 머리 */
  ctx.strokeStyle=line; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(0,-15); ctx.lineTo(0,-20); ctx.stroke();
  ctx.fillStyle='#F3EDDF'; ctx.shadowBlur=16;
  ctx.beginPath(); ctx.arc(0,-27,8.5,0,7); ctx.fill();
  /* 갓 — 넓고 얇게 */
  ctx.shadowBlur=13; ctx.strokeStyle=line; ctx.lineWidth=3.4;
  ctx.fillStyle='rgba(8,14,22,.95)';
  ctx.beginPath(); ctx.ellipse(0,-35,26,6.5,0,0,7); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-8,-35); ctx.lineTo(-7,-50); ctx.lineTo(7,-50); ctx.lineTo(8,-35);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,-50,7.2,2.6,0,0,7); ctx.stroke();
  /* 갓끈 — 길게 흩날린다 */
  ctx.strokeStyle='rgba(229,178,79,.85)'; ctx.lineWidth=2.2; ctx.shadowBlur=8;
  for(const sx of [-1,1]){
    ctx.beginPath(); ctx.moveTo(sx*20,-33);
    ctx.quadraticCurveTo(sx*30,-14+Math.sin(t*12+sx)*8, sx*22, 8+Math.sin(t*9+sx)*7);
    ctx.stroke();
  }
  ctx.restore();
}
/* 위에서 내려다본 선비 — 낙하 */
function drawSeonbiDown(x,y,s,lean,blink){
  const t=performance.now()/1000, K=s*0.80;
  ctx.save(); ctx.translate(x,y); ctx.scale(K,K);
  if(blink) ctx.globalAlpha=.4+.35*Math.sin(t*40);
  const line='rgba(243,237,223,.95)';
  ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.strokeStyle='rgba(243,237,223,.5)'; ctx.lineWidth=3.4;
  ctx.shadowColor='#F3EDDF'; ctx.shadowBlur=12;
  for(let k=0;k<4;k++){                            // 사방으로 펼친 소매와 자락
    const a=k*Math.PI/2+Math.PI/4+lean*0.2;
    const w=30+Math.sin(t*7+k)*7;
    ctx.beginPath(); ctx.moveTo(Math.cos(a)*16,Math.sin(a)*16);
    ctx.quadraticCurveTo(Math.cos(a)*(30+w),Math.sin(a)*(30+w),
                         Math.cos(a+0.5)*(40+w),Math.sin(a+0.5)*(40+w));
    ctx.stroke();
  }
  ctx.strokeStyle=line; ctx.lineWidth=4; ctx.fillStyle='rgba(12,18,28,.92)';
  ctx.beginPath(); ctx.ellipse(0,0,24,20,lean*0.3,0,7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(229,178,79,.9)'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.ellipse(0,0,14,11,lean*0.3,0,7); ctx.stroke();
  ctx.strokeStyle=line; ctx.lineWidth=4; ctx.fillStyle='rgba(8,14,22,.95)';
  ctx.shadowBlur=16;
  ctx.beginPath(); ctx.arc(0,0,30,0,7); ctx.fill(); ctx.stroke();   // 갓 — 위에서 보면 원
  ctx.beginPath(); ctx.arc(0,0,11,0,7); ctx.stroke();
  ctx.strokeStyle='rgba(229,178,79,.85)'; ctx.lineWidth=2.5; ctx.shadowBlur=8;
  for(const sx of [-1,1]){
    ctx.beginPath(); ctx.moveTo(sx*26,4);
    ctx.quadraticCurveTo(sx*40,14+Math.sin(t*11+sx)*8, sx*34,32+Math.sin(t*9)*7);
    ctx.stroke();
  }
  ctx.restore();
}

/* ── 동굴의 움직이는 기믹 — 문과 포 ─────────────────── */
function caveGimmick(){
  const g=cv2.seg[cv2.seg.length-1], p=MG.prog;
  /* 여닫는 문 — 위아래에서 뻗어 나와 길을 막았다 연다 */
  if(p>0.12 && Math.random()<0.030+0.045*p){
    cv2.gates.push({x:g.x, ph:Math.random()*7, sp:1.5+1.3*p,
                    open:Math.max(150,300-150*p)});
  }
  /* 벽에 붙은 포 — 때맞춰 탄을 뱉는다 */
  if(p>0.20 && Math.random()<0.026+0.04*p){
    const up=Math.random()<.5;
    cv2.guns.push({x:g.x, up, t:Math.random()*1.4, cd:1.5-0.6*p});
  }
}
function caveGimTick(dt){
  const flow=CAVE.speed*MG.spd;
  for(let i=cv2.gates.length-1;i>=0;i--){
    const q=cv2.gates[i];
    if(q.x<cv2.ox-90){ cv2.gates.splice(i,1); continue; }
    q.ph+=dt*q.sp;
    const sx=q.x-cv2.ox;
    if(Math.abs(sx-CAVE.px)<26){
      const g=caveAt(CAVE.px);
      const o=q.open*(0.25+0.75*(0.5+0.5*Math.sin(q.ph)));   // 열린 틈
      const mid=g.mid;
      if(Math.abs(cv2.y-mid)>o/2) miniHit();
    }
  }
  for(let i=cv2.guns.length-1;i>=0;i--){
    const q=cv2.guns[i];
    if(q.x<cv2.ox-90){ cv2.guns.splice(i,1); continue; }
    q.t-=dt;
    const sx=q.x-cv2.ox;
    if(q.t<=0 && sx>-40 && sx<VW+200){
      q.t=q.cd;
      const g=caveAt(q.x-cv2.ox);
      cv2.shots.push({x:sx, y:q.up?g.top+14:g.bot-14,
                      vy:(q.up?1:-1)*(280+220*MG.prog), vx:-60, r:11});
    }
  }
  for(let i=cv2.shots.length-1;i>=0;i--){
    const b=cv2.shots[i];
    b.x+=(b.vx-flow*0.15)*dt; b.y+=b.vy*dt;
    if(b.x<-40||b.y<CEIL_Y-40||b.y>VH+40){ cv2.shots.splice(i,1); continue; }
    if(Math.abs(b.x-CAVE.px)<b.r+20 && Math.abs(b.y-cv2.y)<b.r+20){
      cv2.shots.splice(i,1); miniHit();
    }
  }
}
function caveGimDraw(){
  const ox=cv2.ox, red='#E2453A';
  for(const q of cv2.gates){
    const sx=q.x-ox; if(sx<-90||sx>VW+90)continue;
    const g=caveAt(sx), o=q.open*(0.25+0.75*(0.5+0.5*Math.sin(q.ph)));
    ctx.save();
    ctx.strokeStyle=red; ctx.shadowColor=red; ctx.shadowBlur=16;
    ctx.fillStyle='rgba(34,10,14,.8)'; ctx.lineWidth=3.5;
    const t1=g.top, b1=g.mid-o/2, t2=g.mid+o/2, b2=g.bot;
    if(b1>t1){ ctx.fillRect(sx-16,t1,32,b1-t1); ctx.strokeRect(sx-16,t1,32,b1-t1); }
    if(b2>t2){ ctx.fillRect(sx-16,t2,32,b2-t2); ctx.strokeRect(sx-16,t2,32,b2-t2); }
    ctx.restore();
  }
  for(const q of cv2.guns){
    const sx=q.x-ox; if(sx<-90||sx>VW+90)continue;
    const g=caveAt(sx), y=q.up?g.top:g.bot;
    const warn=q.t<0.28;
    ctx.save();
    ctx.strokeStyle=red; ctx.shadowColor=red; ctx.shadowBlur=warn?26:12;
    ctx.fillStyle=warn?'rgba(120,20,24,.9)':'rgba(34,10,14,.9)'; ctx.lineWidth=3.5;
    ctx.beginPath();
    ctx.moveTo(sx-20,y); ctx.lineTo(sx+20,y);
    ctx.lineTo(sx+10,y+(q.up?28:-28)); ctx.lineTo(sx-10,y+(q.up?28:-28));
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.fillStyle=red; ctx.shadowColor=red; ctx.shadowBlur=18;
  for(const b of cv2.shots){
    ctx.beginPath(); ctx.ellipse(b.x,b.y,b.r*0.7,b.r*1.5,0,0,7); ctx.fill();
  }
  ctx.restore();
}
