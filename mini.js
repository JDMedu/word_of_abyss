/* ══════════════════════════════════════════════════════════
   구덩이가 무너진다 — 25층 보스를 잡은 뒤의 탈출
   본 게임과 떼어 둔다. 이 파일이 없거나 깨져도 본 게임은 돈다.
   ══════════════════════════════════════════════════════════ */
const MINI={
  dur:32,            // 카운트다운(초)
  hitCost:5,         // 부딪히면 깎이는 기력
  brake:0.40,        // 부딪히면 속도가 이만큼으로 떨어진다
  brakeBack:3.0,     // 원래 속도로 돌아오는 데 걸리는 시간
  hitTime:0,         // 쓰지 않는다 — 벌은 느려짐과 기력뿐
  invuln:0.9,        // 부딪힌 뒤 잠깐 무적
  heal:8,            // 옥빛 구슬이 돌려주는 기력
  clean:30.7,   // 한 번도 안 부딪히면 24초쯤에 빠져나간다          // 한 번도 안 부딪히면 이쯤에 빠져나간다(초)
};
let MG=null, mT=0, mHold=false;

/* ── 들고 나기 ───────────────────────────────────────── */
function miniStart(kind,done){
  const kinds=['cave','fall','run'];
  MG={ kind:kind&&kinds.includes(kind)?kind:kinds[Math.floor(Math.random()*kinds.length)],
      t:0, left:MINI.dur, prog:0, spd:1, brake:0, hits:0, inv:0, over:null, done,
      quit:false, fx:0, shake:0, pen:0, penFx:0, healFx:0 };
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
  MG.penFx=1;                           // 벌은 느려짐과 기력뿐이다
  S.energy-=(n||MINI.hitCost);
  vibe('hurt');
  if(S.energy<=0){ miniEnd('dead'); }
}

/* ── 매 프레임 ──────────────────────────────────────── */
function miniTick(dt){
  MG.t+=dt; MG.left=Math.max(0,MINI.dur-MG.t);
  if(MG.penFx>0) MG.penFx=Math.max(0,MG.penFx-dt*1.6);
  MG.inv=Math.max(0,MG.inv-dt);
  MG.fx=Math.max(0,MG.fx-dt*2.2);
  if(MG.healFx>0) MG.healFx=Math.max(0,MG.healFx-dt*1.8);
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
  if(MG.kind==='cave') caveDraw(); else if(MG.kind==='run') roadDraw(); else t3Draw();
  ctx.restore();
  miniHud();
  if(MG.healFx>0){                               // 옥병을 주웠다 — 옥빛이 번진다
    ctx.save(); ctx.globalAlpha=MG.healFx*0.55;
    ctx.strokeStyle=C['--jade']; ctx.shadowColor=C['--jade'];
    ctx.lineWidth=26; ctx.shadowBlur=34;
    ctx.strokeRect(13,13,VW-26,VH-26);
    ctx.restore();
  }
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
  const pf=MG.penFx||0;
  ctx.font=`700 ${Math.round(56*(1+pf*0.35))}px 'Gowun Batang',serif`;
  ctx.fillStyle=(urgent||pf>0)?'#E2453A':C['--gold'];
  if(urgent||pf>0){ ctx.shadowColor='#E2453A'; ctx.shadowBlur=18+10*Math.sin(MG.t*12)+30*pf; }
  ctx.fillText(MG.left.toFixed(1),VW/2,by+44);
  ctx.shadowBlur=0;
  if(pf>0){                                   // 무엇을 잃었는지 띄운다
    ctx.globalAlpha=pf; ctx.fillStyle='#E2453A';
    ctx.font=`700 28px 'Gowun Batang',serif`;
    ctx.fillText(`기력 −${MINI.hitCost} · 속도 뚝`,VW/2,by+86);
    ctx.globalAlpha=1;
  }
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
  cv2={ y:VH*0.5, vy:0, ox:0, seg:[], rocks:[], pills:[], gates:[], guns:[], shots:[],
        ang:0, trail:[], ch:null, chI:0, used:{}, restLeft:0, safeNow:true };
  let x=0, mid=VH*0.5, gap=700;
  for(let i=0;i<60;i++){ cv2.seg.push(caveSeg(x,mid,gap)); x+=CAVE.step;
    mid+=(Math.random()-.5)*40; gap-=1; }
  cv2.nx=x;
}
function caveSeg(x,mid,gap){
  mid=Math.max(CEIL_Y+gap/2+40, Math.min(VH-gap/2-120, mid));
  return {x, top:mid-gap/2, bot:mid+gap/2, mid, gap};
}
function pickCaveChunk(){
  const p=MG.prog;
  if(cv2.restLeft>0){ cv2.restLeft--; cv2.ch=CAVE_CH[0]; cv2.chI=0; return; }
  const pool=CAVE_CH.filter(c=>!c.rest && p>=c.min && (cv2.used[c.name]||0)<2);
  if(!pool.length){ cv2.ch=CAVE_CH[0]; cv2.chI=0; return; }
  const c=pool[Math.floor(Math.random()*pool.length)];
  cv2.used[c.name]=(cv2.used[c.name]||0)+1;
  cv2.ch=c; cv2.chI=0; cv2.restLeft=restAfter(p)-1;
}
function caveGen(){
  if(!cv2.ch || cv2.chI>=cv2.ch.seg) pickCaveChunk();
  const last=cv2.seg[cv2.seg.length-1];
  const st={x:cv2.nx, mid:last.mid, gap:last.gap};
  cv2.ch.step(cv2.chI++, st, MG.prog);
  cv2.safeNow=!!cv2.ch.rest;
  const g=caveSeg(st.x, st.mid, Math.max(220,st.gap));
  g.safe=cv2.safeNow;
  cv2.seg.push(g);
  cv2.nx+=CAVE.step;
}
function caveAt(x){                                   // 그 자리의 위아래 벽
  /* 앞에서부터 떨궈 내므로 seg[0] 이 세상 0 이 아니다. 첫 칸을 기준으로 센다 */
  if(!cv2.seg.length) return {x:0,top:CEIL_Y,bot:VH,mid:VH/2,gap:VH};
  const i=Math.round((x+cv2.ox-cv2.seg[0].x)/CAVE.step);
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
    q.ph+=dt*0.90;
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
    const safe=cv2.seg.some(g=>g.safe && Math.abs(g.x-ox-CAVE.px)<260);
    ctx.strokeStyle=safe?'rgba(243,237,223,.95)':C['--jade'];
    ctx.shadowColor=safe?'#F3EDDF':C['--jade']; ctx.shadowBlur=16;
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
    else if(MG.kind==='run' && W3 && W3.onFloor){ W3.vy=jumpV(); W3.onFloor=false; vibe('charged'); }
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
   덩이 — 낱개를 굴리지 않고 4~8초짜리 「한 가지 생각」을 이어 붙인다
   소개 → 비틀기 → 겹치기 → 마지막. 사이에는 반드시 쉼표를 둔다
   ══════════════════════════════════════════════════════════ */
const restAfter = p => (p<0.35?3 : 2);

/* ── 동굴 덩이 일곱 ─────────────────────────────────── */
const cvRock=(x,y,r)=>cv2.rocks.push({x,y,r,a:Math.random()*7,sp:(Math.random()-.5)*1.6});
const cvGem =(x,y)=>cv2.rocks.push({x,y,r:17,heal:true,a:0,sp:2.2});
const cvGate=(x,open,sp,ph)=>cv2.gates.push({x,open,sp,ph:ph||0});
const cvGun =(x,up,t,cd)=>cv2.guns.push({x,up,t:t||0,cd:cd||1.2});
const cvPill=(x,y,h,sw)=>cv2.pills.push({x,y,h,sw,ph:Math.random()*7});

const CAVE_CH=[
 {name:'쉼', seg:16, min:0, rest:true, step(i,st,p){
    st.gap=Math.min(760, st.gap+26); st.mid+=(VH*0.5-st.mid)*0.18;
    if(i===4&&Math.random()<0.5) cvGem(st.x, st.mid);
 }},
 {name:'톱니', seg:30, min:0.0, step(i,st,p){
    const k=Math.floor(i/3)%2;
    st.mid += (k? 34:-34)*(1+p);
    st.gap = Math.max(300, st.gap-6);
 }},
 {name:'좁은 목', seg:28, min:0.05, step(i,st,p){
    const u=Math.abs(i-7)/7;                       // 가운데가 가장 좁다
    st.gap = 240+ (520-240)*u*u;
    st.mid += (VH*0.5-st.mid)*0.25;
    if(i===7) cvGem(st.x, st.mid);                 // 가장 좁은 데에 둔다
 }},
 {name:'문의 방', seg:40, min:0.12, step(i,st,p){
    st.gap=Math.max(430,620-120*p); st.mid+=(VH*0.5-st.mid)*0.2;
    if(i===3||i===9||i===15) cvGate(st.x, Math.max(210,330-110*p), 0.80+0.45*p, i*0.7);
 }},
 {name:'포대', seg:40, min:0.18, step(i,st,p){
    st.gap=Math.max(400,560-100*p); st.mid+=(VH*0.5-st.mid)*0.2;
    if(i===2||i===8||i===14) cvGun(st.x, true,  0.2, 2.0-0.4*p);
    if(i===5||i===11||i===17) cvGun(st.x, false, 0.6, 2.0-0.4*p);
 }},
 {name:'돌밭', seg:36, min:0.10, step(i,st,p){
    st.gap=Math.max(430,620-120*p); st.mid+=(Math.random()-.5)*18;
    if(i%3===1){
      const side=(i%6===1)?-1:1;                   // 길이 두 갈래로 갈린다
      cvRock(st.x, st.mid+side*st.gap*0.26, 30+Math.random()*22);
    }
 }},
 {name:'긴 굴뚝', seg:32, min:0.30, step(i,st,p){
    st.gap=Math.max(230,300-60*p);                 // 아주 좁다
    st.mid+=(VH*0.45-st.mid)*0.3;
 }},
 {name:'무너짐', seg:44, min:0.45, step(i,st,p){
    const u=i/21;
    st.mid = VH*0.34 + (VH*0.62-VH*0.34)*u;        // 천장이 통째로 내려온다
    st.gap = Math.max(330, 560-230*u);
    if(i%5===2) cvRock(st.x, st.mid-st.gap*0.30, 24+Math.random()*16);
 }},
 {name:'오르내림', seg:36, min:0.22, step(i,st,p){
    st.gap=Math.max(400,560-120*p); st.mid+=(VH*0.5-st.mid)*0.15;
    if(i===4||i===11) cvPill(st.x, st.mid, st.gap*0.44, st.gap*0.24);
 }},
];

/* ── 낙하·질주 덩이 ──────────────────────────────────── */
const R=()=>Math.random(), S1=()=>R()<.5?-1:1;
const CH3={
 fall:[
  {name:'쉼', min:0, rest:true, rows:p=>[[],[],[{kind:'gem',x:(R()-.5)*T3.W*0.8,y:(R()-.5)*T3.W*0.8}]]},
  {name:'문짝 셋', min:0.0, rows:p=>{
     const hr=Math.max(110,190-70*p);
     return [[{kind:'plate',hx:-T3.W*0.45,hy:0,hr}],[],
             [{kind:'plate',hx: T3.W*0.45,hy:0,hr}],[],
             [{kind:'plate',hx:0,hy:0,hr}]];
  }},
  {name:'가위', min:0.08, rows:p=>{
     const w=34+22*p, v=0.58+0.36*p;
     return [[{kind:'bar',vert:false,o:0,w,sp:v}],[],
             [{kind:'bar',vert:true, o:0,w,sp:-v}],[],
             [{kind:'bar',vert:false,o:0,w,sp:v*1.15},
              {kind:'bar',vert:true, o:0,w,sp:-v*1.15}]];
  }},
  {name:'회전실', min:0.15, rows:p=>{
     const arm=26+16*p, sp=0.46+0.46*p;
     return [[{kind:'cross',a:0,       arm,sp}],[],
             [{kind:'cross',a:Math.PI/6,arm,sp:-sp}],[],
             [{kind:'cross',a:Math.PI/3,arm,sp}]];
  }},
  {name:'숨쉬는 방', min:0.20, rows:p=>{
     const r0=Math.max(120,205-70*p);
     return [[{kind:'iris',ph:0,r0}],[],
             [{kind:'iris',ph:2.1,r0}],[],
             [{kind:'iris',ph:4.2,r0}]];
  }},
  {name:'벽 타기', min:0.30, rows:p=>{
     const s=S1(), w=44+30*p;
     return [[{kind:'bar',vert:true,o:s*T3.W*0.55,w,sp:0}],
             [{kind:'bar',vert:true,o:s*T3.W*0.40,w,sp:0}],
             [{kind:'bar',vert:true,o:s*T3.W*0.25,w,sp:0}],
             [{kind:'bar',vert:true,o:s*T3.W*0.10,w,sp:0},
              {kind:'gem',x:-s*T3.W*0.7,y:0}]];
  }},
  {name:'소나기', min:0.45, rows:p=>{
     const hr=Math.max(125,200-60*p);
     const hx=(R()-.5)*T3.W*0.7, hy=(R()-.5)*T3.W*0.7;
     return [[{kind:'plate',hx,hy,hr}],
             [{kind:'cross',a:R()*7,arm:20+12*p,sp:0.95}],
             [{kind:'plate',hx,hy,hr}],
             [{kind:'bar',vert:R()<.5,o:0,w:28+18*p,sp:1.05}],
             [{kind:'plate',hx,hy,hr}]];
  }},
 ],
 run:[
  {name:'쉼', min:0, rest:true, rows:p=>[[],
     [{kind:'tile',tt:'give',x:0,w:70,len:T3.ring*0.8}],[]]},
  {name:'계단', min:0.0, rows:p=>{
     const x=(R()-.5)*T3.road*0.5;
     return [[{kind:'hurdle',x,w:80,hh:50}],[],
             [{kind:'hurdle',x,w:80,hh:62}],[],
             [{kind:'hurdle',x,w:80,hh:74}]];
  }},
  {name:'갈림길', min:0.05, rows:p=>[
     [{kind:'wall',x:0,w:54+22*p,h:T3.W*2}],[],
     [{kind:'wall',x:0,w:54+22*p,h:T3.W*2},
      {kind:'tile',tt:'boost',x:S1()*T3.road*0.6,w:60,len:T3.ring}],[],
     [{kind:'wall',x:S1()*T3.road*0.5,w:50+20*p,h:T3.W*2}]],
  },
  {name:'끊긴 다리', min:0.12, rows:p=>[
     [{kind:'pit',len:T3.ring*0.55}],[],
     [{kind:'pit',len:T3.ring*(0.6+0.3*p)}],[],
     [{kind:'pit',len:T3.ring*(0.6+0.3*p)},{kind:'gem',x:0,y:T3.W-150}]],
  },
  {name:'좁은 띠', min:0.15, rows:p=>{
     const s=S1(), w=T3.road*0.52;
     return [[{kind:'pit',x:s*T3.road*0.62,w,len:T3.ring}],
             [{kind:'pit',x:s*T3.road*0.62,w,len:T3.ring}],
             [{kind:'pit',x:s*T3.road*0.62,w,len:T3.ring},
              {kind:'tile',tt:'give',x:-s*T3.road*0.5,w:56,len:T3.ring}],
             [{kind:'pit',x:s*T3.road*0.62,w,len:T3.ring}],[]];
  }},
  {name:'불길', min:0.20, rows:p=>{
     const s=S1();
     return [[{kind:'tile',tt:'burn',x:s*T3.road*0.55,w:80,len:T3.ring*1.2}],[],
             [{kind:'tile',tt:'burn',x:-s*T3.road*0.55,w:80,len:T3.ring*1.2}],[],
             [{kind:'tile',tt:'burn',x:0,w:70,len:T3.ring},
              {kind:'tile',tt:'boost',x:s*T3.road*0.7,w:56,len:T3.ring}]];
  }},
  {name:'굽이', min:0.18, rows:p=>{
     const s=S1();
     return [[{kind:'wall',x:s*T3.road*0.75,w:48+20*p,h:T3.W*2}],
             [{kind:'wall',x:s*T3.road*0.66,w:48+20*p,h:T3.W*2}],[],
             [{kind:'wall',x:s*T3.road*0.58,w:48+20*p,h:T3.W*2}],
             [{kind:'gem',x:-s*T3.road*0.5,y:T3.W-110}]];
  }},
  {name:'지그재그', min:0.25, rows:p=>{
     const s=S1(), w=46+22*p;
     return [[{kind:'wall',x: s*T3.road*0.5,w,h:T3.W*2}],[],
             [{kind:'wall',x:-s*T3.road*0.5,w,h:T3.W*2}],[],
             [{kind:'wall',x: s*T3.road*0.5,w,h:T3.W*2}]];
  }},
  {name:'미끄럼', min:0.35, rows:p=>{
     const s=S1();
     return [[{kind:'tile',tt:'slip',x:0,w:T3.road,len:T3.ring*2.2}],[],
             [{kind:'wall',x:s*T3.road*0.55,w:50,h:T3.W*2}],[],
             [{kind:'pit',len:T3.ring*0.7}]];
  }},
  {name:'낭떠러지', min:0.50, rows:p=>[
     [{kind:'hurdle',x:0,w:100,hh:56}],[],
     [{kind:'pit',len:T3.ring*1.3}],[],[],
     [{kind:'tile',tt:'boost',x:0,w:80,len:T3.ring}],
     [{kind:'pit',len:T3.ring*1.5}]],
  },
 ]
};

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
  jumpH:300,        // 뛰어오르는 높이(블록은 176) — 속도가 올라도 그대로
  gravBase:5150,    // 중력은 속도 제곱에 붙는다. 그래야 점프가 늘 「세 줄 남짓」이다
  grav:7000, jump:-1900,   // (낙하·질주 옛 값 — 지금은 아래 두 함수가 대신한다)
  road:185,         // 띠 반폭 — 이 밖으로 나가면 허공이다
  /* 질주 — 스카이로드처럼 길 위에서 비스듬히 내려다본다 */
  ZCrun:380,        // 선비가 서 있는 깊이(질주). 얕으면 점프가 화면을 통째로 흔든다
  eye:520,          // 카메라가 길 위로 뜬 높이. 0이면 길이 선 하나로 눌린다
  horizon:0.30,     // 소실점이 화면 위에서 이만큼 되는 자리 — 낮출수록 멀리까지 보인다
  heroS:3.6,        // 선비 크기 — 깊이가 멀어져도 그대로 둔다
  barRX:28, barRY:52,   // 낙하 막대 판정 — 선비는 세로로 길쭉하다
  fovKick:0.18,     // 빨라지면 시야가 이만큼 넓어진다 — 속도감의 절반은 여기서 나온다
};
/* 스카이로드의 타일 — 색마다 성질이 다르다 */
const TILE={
  boost:{c:'#8FD14F', n:'빠름'},
  slow :{c:'#4A6B8A', n:'끈적'},
  slip :{c:'#6A6F78', n:'미끄럼'},
  burn :{c:'#E2453A', n:'불'},
  give :{c:'#F3EDDF', n:'보급'},
};
let W3=null;
/* 빨라지면 줄도 빨리 온다. 중력을 같이 올려야 점프가 넘는 줄 수가 안 변한다 */
const jumpG=()=>T3.gravBase*MG.spd*MG.spd;
const jumpV=()=>-Math.sqrt(2*jumpG()*T3.jumpH);
const curZ=z=>0;                       // 스카이로드는 곧게 뻗는다
const fov=()=>W3.run ? T3.F*(1-T3.fovKick*Math.min(1,Math.max(0,(MG.spd-0.9)/1.3))) : T3.F;
const p3=(x,y,z)=>{ const s=fov()/Math.max(24,z), off=curZ(z)-curZ(T3.ZC);
  /* 질주에서는 카메라가 선비가 아니라 길에 붙어 있다 — 뛰면 선비가 떠오른다 */
  const cy = W3.run ? T3.W-T3.eye : W3.cy;
  const hz = W3.run ? T3.horizon  : 0.52;
  return {x:VW/2+(x+off-W3.cx)*s, y:VH*hz+(y-cy)*s, s}; };

function t3Init(run){
  W3={ run, cx:0, cy:run?T3.W-70:0, vx:0, vy:0, onFloor:true,
       z0:0, obs:[], nextZ:T3.FAR, ang:0, lean:0, jumpHeld:false,
       seed:Math.random()*7, rolled:0, rest:0,
       chQ:[], chRest:0, restAfter:3, used:{}, chName:'', slot:0,
       slipT:0, boostT:0, slowT:0, drift:0, rowQ:[], restLeft:run?3:0,
       gone:false, respawn:0, holeRun:0, rowN:0, deco:[], roadC:3 };
  if(run) caveDecoInit();
  if(run){ W3.nextZ=T3.ring; while(W3.nextZ<T3.FAR) roadGen(); }
  else for(let z=T3.ring; z<T3.FAR; z+=T3.ring) W3.obs.push({kind:'ring',z});
}
function pick3Chunk(){
  const p=MG.prog, pool=CH3[W3.run?'run':'fall']
    .filter(c=>!c.rest && p>=c.min && (W3.used[c.name]||0)<2);
  if(!pool.length){ W3.chRest=2; return; }
  const c=pool[Math.floor(Math.random()*pool.length)];
  W3.used[c.name]=(W3.used[c.name]||0)+1;
  W3.chQ=c.rows(p).slice();
  W3.restAfter=restAfter(p);
  W3.chName=c.name;
}
function t3Gen(){
  const z=W3.nextZ;
  const resting=(W3.chRest>0)||(!W3.chQ.length);
  W3.obs.push({kind:'ring', z, safe:resting});
  const step=3;                                       // 끝까지 세 칸 간격
  W3.slot=(W3.slot||0)+1;
  if(W3.slot%step!==0){ W3.nextZ+=T3.ring; return; }   // 줄 사이를 벌린다
  if(W3.chQ.length){
    for(const sp of W3.chQ.shift()) W3.obs.push(Object.assign({z,hit:false},sp));
    if(!W3.chQ.length) W3.chRest=W3.restAfter;
  }else if(W3.chRest>0){
    W3.chRest--;
    if(W3.chRest===1 && Math.random()<0.30)
      W3.obs.push({kind:'gem', z, hit:false,
                   x:(Math.random()-.5)*T3.W*1.1,
                   y:W3.run?T3.W-110:(Math.random()-.5)*T3.W*1.1});
  }else pick3Chunk();
  W3.nextZ+=T3.ring;
}
function t3Tick(dt){
  const flow=T3.base*MG.spd*(W3.boostT>0?1.45:1)*(W3.slowT>0?0.62:1);
  /* 움직임 */
  const L=mAxis();
  const steer=(W3.run&&W3.slipT>0)?0:L.x;             // 미끄럼 — 조향이 안 먹는다
  if(W3.run&&W3.slipT>0) W3.drift=W3.drift||0; else W3.drift=steer;
  const lim=W3.run?LANEW*LANES/2+30:T3.W-40;
  W3.cx=Math.max(-lim,Math.min(lim, W3.cx+(W3.run?W3.drift:steer)*T3.move*dt));
  W3.lean+=((L.x)-W3.lean)*Math.min(1,dt*9);
  if(!W3.run){
    W3.cy=Math.max(-T3.W+40,Math.min(T3.W-40, W3.cy+L.y*T3.move*dt));
  }
  W3.ang+=dt;
  if(W3.run){ roadTick(dt,flow); }
  if(false){
    if(W3.slipT>0) W3.slipT=Math.max(0,W3.slipT-dt);
    if(W3.boostT>0) W3.boostT=Math.max(0,W3.boostT-dt);
    if(W3.slowT>0) W3.slowT=Math.max(0,W3.slowT-dt);
  }
  /* 다가온다 */
  for(let i=W3.obs.length-1;i>=0;i--){
    const o=W3.obs[i];
    o.z-=flow*dt;
    if(o.z<-120){ W3.obs.splice(i,1); continue; }
    if(o.kind==='bar' && o.sp) o.o=Math.sin(W3.ang*o.sp)*T3.W*0.62;   // sp 0 = 제자리
    if(o.kind==='cross') o.a+=o.sp*dt;
    if(o.kind==='iris')  o.ph+=dt*1.00;
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
  while(W3.nextZ<=T3.FAR && guard++<14){ W3.run?roadGen():t3Gen(); }
}
function t3Block(o){
  const x=W3.cx, y=W3.cy, R=46;
  switch(o.kind){
    case 'plate':  return Math.hypot(x-o.hx,y-o.hy) > o.hr-R;
    case 'bar':    return o.vert ? Math.abs(x-o.o)<o.w+T3.barRX
                                 : Math.abs(y-o.o)<o.w+T3.barRY;
    case 'cross':  { for(let k=0;k<4;k++){ const a=o.a+k*Math.PI/2;
                       const dx=Math.cos(a), dy=Math.sin(a);
                       const t=x*dx+y*dy; if(t<0) continue;
                       if(Math.abs(-x*dy+y*dx)<o.arm+R*0.6) return true; }
                     return false; }
    case 'iris':   { const r=o.r0*(0.72+0.42*(0.5+0.5*Math.sin(o.ph)));
                     return Math.hypot(x,y) > r-R; }
    case 'wall':   return Math.abs(x-o.x)<o.w+R;
    case 'hurdle': return Math.abs(x-o.x)<o.w+R && (T3.W-70-y)<o.hh;
    case 'pit':    return W3.onFloor && Math.abs(x-(o.x||0))<(o.w||T3.road)+R;
    case 'tile':   {                                     // 밟으면 성질이 옮는다
      if(!W3.onFloor || Math.abs(x-o.x)>o.w+R) return false;
      if(o.tt==='burn') return true;
      if(o.tt==='give'){ S.energy=Math.min(S.energyMax,S.energy+MINI.heal); vibe('right'); }
      if(o.tt==='boost') W3.boostT=1.6;
      if(o.tt==='slow')  W3.slowT=1.4;
      if(o.tt==='slip')  W3.slipT=1.6;
      return false;
    }
  }
  return false;
}
/* ── 그리기 ─────────────────────────────────────────── */
function t3Draw(){
  const jade=C['--jade'], red='#E2453A';
  ctx.save();
  if(W3.run){
    /* 허공에 뜬 띠 — 벽이 없다. 옆으로 나가면 떨어진다 */
    if(!W3.stars){ W3.stars=[]; for(let i=0;i<70;i++)
      W3.stars.push({x:Math.random()*VW, y:CEIL_Y+Math.random()*(VH-CEIL_Y-300),
                     r:Math.random()*2.2+0.6, a:0.2+Math.random()*0.5}); }
    ctx.fillStyle='#F3EDDF';
    for(const st of W3.stars){ ctx.globalAlpha=st.a*0.5;
      ctx.beginPath(); ctx.arc(st.x,st.y,st.r,0,7); ctx.fill(); }
    ctx.globalAlpha=1;
    ctx.strokeStyle=C['--jade']; ctx.shadowColor=C['--jade']; ctx.shadowBlur=16;
    ctx.lineWidth=4;
    for(const sx of [-1,1]){                      // 띠의 두 가장자리
      ctx.beginPath();
      const a=p3(sx*T3.road,T3.W,50), b=p3(sx*T3.road,T3.W,T3.FAR);
      ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    }
    ctx.shadowBlur=0;
  }else{
    /* 소실점으로 뻗는 모서리 선 넷 */
    ctx.strokeStyle='rgba(82,191,160,.30)'; ctx.lineWidth=2;
    for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
      const a=p3(sx*T3.W, sy*T3.W, 40), b=p3(sx*T3.W, sy*T3.W, T3.FAR);
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    }
  }
  const list=[...W3.obs].sort((a,b)=>b.z-a.z);        // 먼 것부터
  for(const o of list){
    if(o.z<30) continue;
    const s=T3.F/o.z, fade=Math.max(0,Math.min(1,(T3.FAR-o.z)/T3.FAR*1.6));
    const lw=Math.max(1, 5*s*1.4);
    if(o.kind==='ring'){
      ctx.globalAlpha=fade*(o.safe?0.95:0.45); ctx.strokeStyle=o.safe?C['--paper']:jade;
      ctx.lineWidth=lw*(o.safe?0.9:0.7);
      ctx.shadowColor=o.safe?C['--paper']:jade; ctx.shadowBlur=8*s*8;
      if(W3.run){                                     // 띠의 이음매 한 줄
        const f1=p3(-T3.road,T3.W,o.z), f2=p3(T3.road,T3.W,o.z);
        ctx.beginPath(); ctx.moveTo(f1.x,f1.y); ctx.lineTo(f2.x,f2.y); ctx.stroke();
      }else{
        const a=p3(-T3.W,-T3.W,o.z), b=p3(T3.W,T3.W,o.z);
        ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
      }
      ctx.shadowBlur=0; continue;
    }
    if(o.kind==='tile'){                              // 색 타일
      const d=TILE[o.tt]||TILE.boost;
      const a=p3(o.x-o.w,T3.W,o.z), b=p3(o.x+o.w,T3.W,o.z);
      const c2=p3(o.x-o.w,T3.W,o.z+o.len), d2=p3(o.x+o.w,T3.W,o.z+o.len);
      ctx.globalAlpha=fade*0.85;
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
      ctx.lineTo(d2.x,d2.y); ctx.lineTo(c2.x,c2.y); ctx.closePath();
      ctx.fillStyle=d.c+'55'; ctx.fill();
      ctx.strokeStyle=d.c; ctx.shadowColor=d.c; ctx.shadowBlur=16;
      ctx.lineWidth=Math.max(1,3*s*1.4); ctx.stroke(); ctx.shadowBlur=0;
      continue;
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
      const RW=(o.w||T3.road);
      const a=p3(-RW,T3.W,o.z), b=p3(RW,T3.W,o.z);
      const c=p3(-RW,T3.W,o.z+o.len), d=p3(RW,T3.W,o.z+o.len);
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
/* 비스듬히 위에서 본 선비 — 낙하.
   폴링 프레드처럼 카메라가 등 뒤 위쪽에 있다. 옷자락은 위로 빨려 올라간다 */
function drawSeonbiDown(x,y,s,lean,blink){
  const t=performance.now()/1000, K=s*0.46;
  ctx.save(); ctx.translate(x,y); ctx.scale(K,K); ctx.rotate(lean*0.20);
  if(blink) ctx.globalAlpha=.4+.35*Math.sin(t*40);
  const line='rgba(243,237,223,.95)';
  ctx.lineJoin='round'; ctx.lineCap='round'; ctx.shadowColor='#F3EDDF';

  /* 위로 빨려 올라가는 도포 자락 — 떨어지고 있으니 옷이 위로 뜬다 */
  ctx.strokeStyle='rgba(243,237,223,.45)'; ctx.lineWidth=3.4; ctx.shadowBlur=12;
  for(let k=0;k<4;k++){
    const sx=(k%2?1:-1), w=9+k*6, f=Math.sin(t*10+k*1.3)*7;
    ctx.beginPath(); ctx.moveTo(sx*(7+k*2), 16);
    ctx.quadraticCurveTo(sx*(18+w), -14+f, sx*(12+w*0.6), -46-k*6+f);
    ctx.stroke();
  }
  /* 다리 — 아래로 짧게 접혀 보인다 */
  ctx.strokeStyle=line; ctx.lineWidth=4.6; ctx.shadowBlur=8;
  for(const sx of [-1,1]){
    ctx.beginPath(); ctx.moveTo(sx*6,18);
    ctx.quadraticCurveTo(sx*(13+Math.sin(t*6+sx)*3), 34, sx*10, 46);
    ctx.stroke();
  }
  /* 등 — 위에서 보니 짧게 눌려 보인다 */
  ctx.lineWidth=4; ctx.fillStyle='rgba(12,18,28,.94)'; ctx.shadowBlur=13;
  ctx.beginPath();
  ctx.moveTo(-17,-6); ctx.quadraticCurveTo(0,-11,17,-6);
  ctx.quadraticCurveTo(20,12,12,22); ctx.quadraticCurveTo(0,26,-12,22);
  ctx.quadraticCurveTo(-20,12,-17,-6);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(229,178,79,.95)'; ctx.lineWidth=2.8;
  ctx.beginPath(); ctx.moveTo(-14,10); ctx.quadraticCurveTo(0,14,14,10); ctx.stroke();
  /* 팔 — 균형 잡느라 옆으로 뻗었다 */
  ctx.strokeStyle=line; ctx.lineWidth=4.2;
  for(const sx of [-1,1]){
    const f=Math.sin(t*7+sx*1.4)*5;
    ctx.beginPath(); ctx.moveTo(sx*15,-3);
    ctx.quadraticCurveTo(sx*34,-6+f, sx*41, 10+f);
    ctx.stroke();
    ctx.beginPath();                               // 소매 끝이 나부낀다
    ctx.moveTo(sx*41,10+f); ctx.quadraticCurveTo(sx*46,0+f, sx*38,-12+f);
    ctx.stroke();
  }
  /* 갓 — 비스듬히 위에서 보니 납작한 타원. 통이 살짝 뒤로 보인다 */
  ctx.lineWidth=3.6; ctx.fillStyle='rgba(8,14,22,.95)'; ctx.shadowBlur=15;
  ctx.beginPath(); ctx.ellipse(0,-16,30,15,0,0,7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,-21,11,6.5,0,0,7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,-23,10.5,6,0,0,7); ctx.stroke();
  /* 갓끈 — 위로 길게 흩날린다 */
  ctx.strokeStyle='rgba(229,178,79,.85)'; ctx.lineWidth=2.4; ctx.shadowBlur=9;
  for(const sx of [-1,1]){
    ctx.beginPath(); ctx.moveTo(sx*24,-13);
    ctx.quadraticCurveTo(sx*32,-34+Math.sin(t*12+sx)*8, sx*22,-56+Math.sin(t*9+sx)*7);
    ctx.stroke();
  }
  ctx.restore();
}

/* ══════════════════════════════════════════════════════════
   질주 — 스카이로드. 한 줄이 일곱 칸인 격자. 곡선 없이 곧게 뻗는다
     .  허공     #  보통     =  반 블록   X  전체 블록
     >  빠름     ~  끈적     /  미끄럼    !  불      +  보급
   ══════════════════════════════════════════════════════════ */
const LANES=7, LANEW=78, BLKH=88;
const laneX=i=>(i-(LANES-1)/2)*LANEW;
const laneOf=x=>Math.max(0,Math.min(LANES-1,Math.round(x/LANEW+(LANES-1)/2)));
const CELL={ '#':{h:0}, '=':{h:1}, 'X':{h:2}, 'o':{h:0} };   // 'o' 는 길 + 그 위에 옥병
/* 칸마다 새 객체를 만든다 — 같은 것을 돌려 쓰면 한 줄을 고칠 때 다른 줄까지 바뀐다 */
const rowOf=str=>str.split('').map(c=>CELL[c]?{...CELL[c]}:null);
const flip=rs=>rs.map(r=>r.split('').reverse().join(''));
const mayFlip=rs=>R()<.5?rs:flip(rs);
/* 가운데 칸 c, 폭 w 짜리 길 한 줄 */
const RB=(c,w,ch)=>{ let s='', a=c-(w-1)/2;
  for(let i=0;i<LANES;i++) s+=(i>=a&&i<a+w)?(ch||'#'):'.'; return s; };
const RO=(c,w,oc)=>{ const t=RB(c,w).split(''); t[oc]='o'; return t.join(''); };
const HOLE='.......';

/* ── 길 ──────────────────────────────────────────────
   할 일은 두 가지뿐이다 — 옆으로 옮기기, 뛰어넘기.
   좌우로 옮기는 건 길이 세 칸 이상일 때만 시킨다.
   한 칸으로 좁아지면 그 자리에서 곧게 이어진다.
   구멍은 한두 줄 — 뛰어야만 넘는다. 착지할 자리는 늘 세 줄.
   ──────────────────────────────────────────────────── */
const ROAD_CH=[
 /* 쉼 — 직전 길이 끝난 자리에서 가운데로 이어 준다 */
 {name:'쉼', min:0, rest:true, rows:()=>{
    const out=[]; let x=W3.roadC;
    while(x!==3){ x+=x>3?-1:1; out.push(RB(x,3)); }
    while(out.length<2) out.push(RB(3,3));
    return out; }},

 {name:'굽이', min:0, rows:()=>mayFlip(
   [RB(3,3),RB(2,3),RB(1,3),HOLE,RB(1,3),RB(2,3),RB(3,3),RB(4,3),RB(5,3)])},

 {name:'지그재그', min:0, rows:()=>mayFlip(
   [RB(3,3),RB(4,3),RB(5,3),RB(4,3),HOLE,RB(2,3),RB(1,3),RB(2,3),RB(3,3)])},

 {name:'좁아짐', min:0, rows:()=>
   [RB(3,3),RB(3,3),RB(3,1),RB(3,1),RB(3,1),HOLE,RB(3,3),RB(3,3),RB(3,3)]},

 {name:'건너뛰기', min:0, rows:()=>
   [RB(3,3),RB(3,3),HOLE,RB(3,3),RB(3,3),RB(3,3),HOLE,RB(3,3),RB(3,3),RB(3,3)]},

 {name:'넓은 길', min:0.03, rows:()=>mayFlip(
   [RB(3,3),RB(3,5),RO(3,5,1),RB(3,5),HOLE,RB(3,5),RB(3,5),RB(3,3)])},

 {name:'비켜선 외길', min:0.05, rows:()=>mayFlip(
   [RB(3,3),RB(4,3),RB(5,3),RB(5,1),RB(5,1),RB(5,1),HOLE,RB(5,3),RB(4,3),RB(3,3)])},

 {name:'두 갈래', min:0.07, rows:()=>
   [RB(3,3),'.##.##.','.#...#.','.......','.#...#.','.##.##.',RB(3,3),RB(3,3)]},

 {name:'긴 도약', min:0.10, rows:()=>mayFlip(
   [RB(3,3),RB(3,3),RB(3,3),HOLE,HOLE,RB(5,3),RB(5,3),RB(5,3)])},

 {name:'섬돌', min:0.12, rows:()=>
   [RB(3,3),RB(3,3),RB(3,3,'='),RB(3,3,'X'),RB(3,3,'='),RB(3,3),HOLE,RB(3,3),RB(3,3),RB(3,3)]},

 {name:'징검다리', min:0.15, rows:()=>
   [RB(3,3),RB(3,3),RB(3,3),HOLE,HOLE,RB(3,3),RB(3,3),RO(3,3,3),HOLE,HOLE,RB(3,3),RB(3,3),RB(3,3)]},

 {name:'엇갈린 도약', min:0.18, rows:()=>mayFlip(
   [RB(3,3),RB(2,3),RB(1,3),RB(1,3),HOLE,HOLE,RB(5,3),RB(5,3),RB(5,3),HOLE,HOLE,
    RB(1,3),RB(1,3),RB(1,3)])},

 {name:'연속 도약', min:0.22, rows:()=>
   [RB(3,3),RB(3,3),RB(3,3),HOLE,RB(3,3),RB(3,3),RB(3,3),HOLE,RB(3,3),RB(3,3),RB(3,3),
    HOLE,RB(3,3),RB(3,3),RB(3,3)]},

 {name:'좁은 외길', min:0.26, rows:()=>mayFlip(
   [RB(3,3),RB(2,3),RB(1,3),RB(1,1),RB(1,1),RB(1,1),RB(1,1),RO(1,1,1),RB(1,3),RB(2,3),RB(3,3)])},

 {name:'섬돌 넘기', min:0.30, rows:()=>mayFlip(
   [RB(3,3),RB(3,3),RB(3,3,'X'),HOLE,RB(5,3),RB(5,3),RB(5,3)])},

 {name:'벼랑길', min:0.34, rows:()=>mayFlip(
   [RB(3,3),RB(4,3),RB(5,3),RB(5,1),RB(5,1),HOLE,HOLE,RB(3,3),RB(3,3),RB(3,3)])},

 {name:'좁은 도약', min:0.40, rows:()=>mayFlip(
   [RB(3,3),RB(3,1),RB(3,1),HOLE,HOLE,RB(3,1),RB(3,1),RB(3,1),RB(3,3),RB(3,3)])},

 {name:'마지막 관문', min:0.55, rows:()=>mayFlip(
   [RB(3,3),RB(3,5),RB(3,5),RO(3,5,5),RB(3,3),HOLE,HOLE,RB(1,3),RB(1,3),RB(1,3),
    RB(1,1),RB(1,1),HOLE,RB(3,3),RB(4,3),RB(5,3),HOLE,HOLE,RB(3,3),RB(3,3),RB(3,3)])},
];

function pickRoadChunk(){
  const p=MG.prog;
  if(W3.restLeft>0){ W3.restLeft--; W3.rowQ=ROAD_CH[0].rows().slice(); return; }
  const pool=ROAD_CH.filter(c=>!c.rest && p>=c.min && (W3.used[c.name]||0)<2);
  if(!pool.length){ W3.rowQ=ROAD_CH[0].rows().slice(); return; }
  const c=pool[Math.floor(Math.random()*pool.length)];
  W3.used[c.name]=(W3.used[c.name]||0)+1;
  W3.rowQ=c.rows(p).slice();
  W3.restLeft=1;                                       // 이어 주는 줄만. 예전엔 절반이 빈 평지였다
  W3.chName=c.name;
}
/* 구멍이 세 줄 이어지면 점프로 못 넘는다 — 그때만 가운데를 뚫는다 */
function roadFixRow(cells){
  if(cells.some(c=>c)){ W3.holeRun=0; return; }
  if(W3.holeRun<2){ W3.holeRun++; return; }
  W3.holeRun=0; cells[3]={h:0};
}
function roadGen(){
  if(!W3.rowQ||!W3.rowQ.length) pickRoadChunk();
  const str=W3.rowQ.shift();
  const cells=rowOf(str);
  roadFixRow(cells);
  const z=W3.nextZ;
  W3.obs.push({kind:'row', z, cells, hit:false, n:W3.rowN++});
  /* 길 자리를 기억해 둔다 — 다음 덩이가 여기서 이어진다 */
  const on=cells.map((c,i)=>c?i:-1).filter(i=>i>=0);
  if(on.length) W3.roadC=Math.round((on[0]+on[on.length-1])/2);
  /* 옥병 — 길 위에 떠 있다 */
  for(let i=0;i<str.length;i++) if(str[i]==='o')
    W3.obs.push({kind:'orb', z, x:laneX(i), y:T3.W-96, got:false});
  W3.nextZ+=T3.ring;
}
/* 발밑이 어떤 칸인가 */
function roadCellAt(z){
  let best=null, bd=1e9;
  for(const o of W3.obs){ if(o.kind!=='row')continue;
    const d=Math.abs(o.z-z); if(d<bd){ bd=d; best=o; } }
  return best;
}
/* 떨어졌을 때 올라설 칸 — 가운데가 아니라 가장 가까운 성한 칸 */
function roadSafeLane(fromX){
  const rows=W3.obs.filter(o=>o.kind==='row'&&o.z>T3.ZCrun-60).sort((a,b)=>a.z-b.z);
  const c0=laneOf(fromX);
  for(const r of rows) for(let d=0;d<LANES;d++)
    for(const i of (d?[c0-d,c0+d]:[c0])){
      if(i<0||i>=LANES) continue;
      const c=r.cells[i];
      if(c && c.h===0) return i;
    }
  return c0;
}
function roadTick(dt,flow){
  caveDecoTick(dt,flow||T3.base);
  /* 밑으로 빠졌다 — 잠깐 사라졌다가 위 길에 다시 나타난다 */
  if(W3.gone){
    W3.cy+=1700*dt;
    W3.respawn-=dt;
    if(W3.respawn<=0){
      W3.gone=false;
      W3.cx=laneX(roadSafeLane(W3.cx));
      W3.cy=T3.W-460; W3.vy=0; W3.onFloor=false;
      vibe('open');
    }
    return;
  }
  const row=roadCellAt(T3.ZCrun); if(!row)return;
  const li=laneOf(W3.cx), cell=row.cells[li];
  const hasFloor=!!cell;
  const topY = hasFloor ? T3.W-cell.h*BLKH : 1e9;
  /* 블록에 정면으로 부딪혔나 */
  if(!row.hit && hasFloor && cell.h>0 && W3.cy > topY+26){
    row.hit=true; miniHit();
    W3.cy=topY; W3.vy=0; W3.onFloor=true;
  }
  /* 옥병 — 스치면 기력이 돌아온다 */
  for(const o of W3.obs){
    if(o.kind!=='orb'||o.got) continue;
    if(Math.abs(o.z-T3.ZCrun)<T3.ring*0.7 &&
       Math.abs(o.x-W3.cx)<LANEW*0.8 && Math.abs(o.y-W3.cy)<150){
      o.got=true; MG.healFx=1;
      S.energy=Math.min(S.energyMax,S.energy+MINI.heal); vibe('right');
    }
  }
  /* 떨어짐 — 마리오처럼 위에서 내려올 때만 올라선다.
     예전에는 밑에서도 끌어올려서 구멍이 없는 셈이었다 */
  const prevY=W3.cy;
  W3.vy+=jumpG()*dt; W3.cy+=W3.vy*dt;
  if(hasFloor && W3.vy>=0 && prevY<=topY+2 && W3.cy>=topY){
    W3.cy=topY; W3.vy=0; W3.onFloor=true;
  } else W3.onFloor=false;
  if(W3.cy>T3.W+420){                                  // 화면 밑으로 사라진다
    W3.gone=true; W3.respawn=0.55; MG.shake=20; miniHit();
  }
}

/* ── 굴 — 천장과 좌우 벽 · 종유석 ─────────────────────
   가까운 것이 빨리 지나가야 빠르게 느껴진다. 속도감의 절반이 여기서 나온다
   ──────────────────────────────────────────────────── */
const CAVE3={ w:620, h:840, rib:210, spk:118 };
const RIBSPAN=Math.ceil((T3.FAR+320)/CAVE3.rib)*CAVE3.rib;
const newSpike=d=>{ d.x=(R()<.5?-1:1)*(0.5+R()*0.5);
  d.len=64+R()*140; d.top=R()<0.62; d.w=0.6+R()*0.7; return d; };
function caveDecoInit(){
  W3.deco=[];
  for(let z=100; z<T3.FAR; z+=CAVE3.rib) W3.deco.push({kind:'rib',z});
  for(let z=140; z<T3.FAR; z+=CAVE3.spk) W3.deco.push(newSpike({kind:'spk',z:z+R()*70}));
}
function caveDecoTick(dt,flow){
  for(const d of W3.deco){
    d.z-=flow*dt;
    if(d.z<-160){ if(d.kind==='rib') d.z+=RIBSPAN; else { d.z+=T3.FAR+160; newSpike(d); } }
  }
}
/* 굴 테 — 밑동에서 천장까지 한 바퀴 */
const archPts=z=>{ const W=CAVE3.w, H=CAVE3.h, BOT=T3.W+320;
  return [[-W,BOT],[-W*0.96,T3.W-H*0.34],[-W*0.62,T3.W-H*0.86],[0,T3.W-H*1.12],
          [W*0.62,T3.W-H*0.86],[W*0.96,T3.W-H*0.34],[W,BOT]].map(q=>p3(q[0],q[1],z)); };
const ceilY=xn=>T3.W-CAVE3.h*(1.12-0.50*xn*xn);       // 그 자리의 천장 높이
function caveDecoDraw(){
  const stone='#6E6455';
  const list=W3.deco.filter(d=>d.z>26).sort((a,b)=>b.z-a.z);   // 먼 것부터
  ctx.save();
  ctx.lineJoin='round'; ctx.lineCap='round';
  for(const d of list){
    const near=Math.max(0,Math.min(1,(1400-d.z)/1300));        // 가까울수록 또렷
    const a=0.10+0.55*near;
    if(d.kind==='rib'){
      const P=archPts(d.z);
      ctx.globalAlpha=a*0.7; ctx.strokeStyle=stone;
      ctx.lineWidth=Math.max(1,1.8+5*near);
      ctx.beginPath(); ctx.moveTo(P[0].x,P[0].y);
      for(let i=1;i<P.length;i++) ctx.lineTo(P[i].x,P[i].y);
      ctx.stroke();
    }else{
      const xw=d.x*CAVE3.w*0.92;
      const y0=d.top ? ceilY(d.x) : T3.W+300;
      const y1=d.top ? y0+d.len   : T3.W+300-d.len;
      const hw=16*d.w;
      const q1=p3(xw-hw,y0,d.z), q2=p3(xw+hw,y0,d.z), q3=p3(xw,y1,d.z);
      ctx.globalAlpha=a; ctx.fillStyle='#141A22'; ctx.strokeStyle=stone;
      ctx.lineWidth=Math.max(1,1.4+2.6*near);
      ctx.beginPath(); ctx.moveTo(q1.x,q1.y); ctx.lineTo(q2.x,q2.y); ctx.lineTo(q3.x,q3.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  ctx.restore();
}
/* 옥병 — 기력을 돌려준다. 길 위에 떠서 오르내린다 */
function drawOrb(o){
  const p=p3(o.x, o.y+Math.sin(MG.t*3+o.x*0.01)*12, o.z), s=p.s;
  if(s<0.06) return;
  const w=30*s, h=40*s;
  ctx.save(); ctx.translate(p.x,p.y);
  ctx.shadowColor=C['--jade']; ctx.shadowBlur=Math.min(30,20*s);
  ctx.fillStyle='rgba(82,191,160,.80)'; ctx.strokeStyle='#F3EDDF';
  ctx.lineWidth=Math.max(1,2*s);
  ctx.beginPath();
  ctx.moveTo(-w*0.20,-h*0.46); ctx.lineTo(w*0.20,-h*0.46); ctx.lineTo(w*0.20,-h*0.14);
  ctx.quadraticCurveTo(w*0.60,-h*0.02, w*0.48,h*0.26);
  ctx.quadraticCurveTo(w*0.30,h*0.54, 0,h*0.54);
  ctx.quadraticCurveTo(-w*0.30,h*0.54,-w*0.48,h*0.26);
  ctx.quadraticCurveTo(-w*0.60,-h*0.02,-w*0.20,-h*0.14);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#F3EDDF';
  ctx.fillRect(-w*0.28,-h*0.60,w*0.56,h*0.16);         // 마개
  ctx.restore();
}
function roadDraw(){
  caveDecoDraw();
  const rows=W3.obs.filter(o=>o.kind==='row'&&o.z>30).sort((a,b)=>b.z-a.z);
  ctx.save();
  for(const r of rows){
    const fade=Math.max(0,Math.min(1,(T3.FAR-r.z)/T3.FAR*1.7));
    const band=(r.n%2)?1:0.66;                       // 줄무늬 — 흐름이 눈에 보인다
    for(let i=0;i<LANES;i++){
      const c=r.cells[i]; if(!c)continue;
      const col=C['--jade'];                           // 길은 한 색뿐이다
      const x0=laneX(i)-LANEW/2, x1=laneX(i)+LANEW/2;
      const y=T3.W-c.h*BLKH;
      const a=p3(x0,y,r.z), b=p3(x1,y,r.z);
      const e=p3(x0,y,r.z+T3.ring), f=p3(x1,y,r.z+T3.ring);
      ctx.globalAlpha=fade*(c.h?0.95:0.8)*band;
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
      ctx.lineTo(f.x,f.y); ctx.lineTo(e.x,e.y); ctx.closePath();
      ctx.fillStyle=col+(c.h?'66':(band>0.9?'3A':'20')); ctx.fill();
      ctx.strokeStyle=col; ctx.shadowColor=col; ctx.shadowBlur=8;
      ctx.lineWidth=Math.max(1,2.6*fov()/r.z); ctx.stroke();
      if(c.h>0){                                       // 블록 앞면
        const g=p3(x0,T3.W,r.z), h2=p3(x1,T3.W,r.z);
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.lineTo(h2.x,h2.y); ctx.lineTo(g.x,g.y); ctx.closePath();
        ctx.fillStyle='rgba(10,16,26,.92)'; ctx.fill(); ctx.stroke();
      }
      ctx.shadowBlur=0;
    }
  }
  ctx.restore();
  for(const o of W3.obs) if(o.kind==='orb'&&!o.got&&o.z>40) drawOrb(o);
  if(W3.gone) return;                                  // 빠져 있는 동안은 안 그린다
  const me=p3(W3.cx,W3.cy,T3.ZCrun);
  drawSeonbiBack(me.x, me.y, T3.heroS*(me.s*T3.ZCrun/T3.F), W3.lean, MG.inv>0, !W3.onFloor);
}

/* ── 동굴의 움직이는 기믹 — 문과 포 ─────────────────── */
/* caveGimmick 은 덩이가 대신한다 */
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
                      vy:(q.up?1:-1)*(170+105*MG.prog), vx:-45, r:11});
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
