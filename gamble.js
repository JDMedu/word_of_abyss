/* ══════════════════════════════════════════════════════════
   노름꾼 — 보약과 사약
   본 게임과 떼어 둔다. 이 파일이 없거나 깨져도 본 게임은 돈다.
   지금은 관리자 화면에서만 부른다. 층에서 나오게 하려면
   nextStage() 에 한 줄만 넣으면 된다.
   ══════════════════════════════════════════════════════════ */
const GAM={
  /* 세 판 — 목숨과 잔이 판마다 다르다 */
  rounds:[{life:2,d:2,t:2},{life:3,d:3,t:3},{life:3,d:4,t:3}],
  loseEnergy:0.15,     // 한 판 지면 기력을 이만큼 잃는다(최소 1은 남는다)
  tonicHeal:0.05,      // 보약 한 잔
  wait:1.5,            // 노름꾼이 뜸 들이는 시간
  quizN:3,             // 앉기 전에 묻는 낱말 수
};
/* 맞힌 순서대로 받는다. 셋 다 맞히면 셋 다 */
const GITEM=[
  {id:'peek', name:'엿보기',   tip:'다음 잔이 무엇인지 나만 본다'},
  {id:'toss', name:'털어내기', tip:'다음 잔을 마시지 않고 엎는다'},
  {id:'cuff', name:'오랏줄',   tip:'노름꾼의 다음 차례를 건너뛴다'},
];

/* ── 대사 ─────────────────────────────────────────────
   문인이 아닌 자다. 저마다 문체가 있는 스물과 겹치지 않게
   노름판의 반말 하나로 민다                            */
const GLINE={
  meet:'앉아라.\n셈은 네가 하고, 마시는 것도 네가 고른다.',
  round:[ '사약 둘, 보약 둘. 섞는다.\n잘 보아 두어라. 두 번은 안 보여준다.',
          '한 판 갔다. 잔을 새로 놓는다.\n이번엔 목숨이 셋이다. 길어질 것이야.',
          '마지막이다.\n여기서 지면 하나를 두고 간다.' ],
  refill:'잔이 떨어졌다. 다시 놓는다.',
  /* 짧은 것들은 화면을 멈추지 않는다. 노름꾼 아래에 잠깐 떴다 사라진다 */
  meDeath:['셈이 틀렸구나.','아까 그 잔을 건넸어야지.','아직 견딜 만하지?'],
  meTonic:['그건 알고 마신 게냐, 운이 좋은 게냐.','한 잔 더 집어 보아라.'],
  hisDeath:['…좋다. 셈을 할 줄 아는구나.','한 번은 맞겠지. 한 번은.'],
  hisTonic:['이것을 나에게 주다니. 네가 마셨어야지.'],
  last:'하나 남았다. 무엇인지 너도 알고 나도 안다.',
  cuff:'…손을 묶어 두었구나.',
  roundWin:'한 판 내주었다. 그뿐이다.',
  roundLose:'한 판 가져간다.',
  win:'가져가라. 어차피 내 것이 아니었다.',
  lose:'두고 가거라. 다음에 또 앉으면 될 일이다.',
};
const gPick=a=>a[Math.floor(Math.random()*a.length)];

let GB=null, gT=0;

/* ── 들고 나기 ───────────────────────────────────────── */
function gambleStart(done){
  GB={ round:0, wins:0, losses:0, mine:0, his:0,
       cups:[], taken:0, peek:-1, cuffed:false, items:[],
       turn:'me', cam:0, camTo:0, wait:0,
       st:'idle', p:0, who:null, actor:null, cup:null,
       shake:0, flash:0, veil:0, jade:0, knock:0, red:0, back:true,
       lamp:0, line:null, lineT:0, t:0, done:done||null };
  gT=performance.now();
  say('노름꾼', GLINE.meet, C['--gold'], ()=>gAskQuiz(0));
}
function gambleEnd(win){
  const done=GB?GB.done:null;
  if(win){ META.wshard=(META.wshard||0)+1; try{ saveMeta(); }catch(e){} }
  GB=null; S.screen='play'; show(null);
  if(done) done(win);
}

/* ── 앉기 전 — 낱말 셋 ────────────────────────────────
   오답으로 적힌 게 있으면 거기서, 없으면 통에서 뽑는다   */
function gAskQuiz(n){
  if(n>=GAM.quizN){ gRoundStart(); return; }
  S.screen='gamble-quiz'; if(typeof dropTouches==='function') dropTouches();
  const ans=pickWord(new Set(), 1.0);
  if(typeof noteAsked==='function') noteAsked(ans.w);
  const wrong=WORDS.filter(x=>x.w!==ans.w).sort(()=>Math.random()-.5).slice(0,3);
  const opts=[ans,...wrong].sort(()=>Math.random()-.5);
  el('gqHead').textContent=`상에 앉기 전에  ·  ${n+1} / ${GAM.quizN}`;
  const src=ans.b?`${BOOKNAME[ans.b]} ${ans.l}회`:'';
  el('gqDef').innerHTML=`<span class="gqpos">${src}</span>${ans.def}`;
  el('gqNote').textContent='';
  const box=el('gqOpts'); box.innerHTML=''; let done=false;
  for(const o of opts){
    const b=document.createElement('div');
    b.className='qOpt'; b.textContent=o.w; b.tabIndex=0;
    b.setAttribute('role','button');
    const go=()=>{
      if(done)return; done=true;
      const ok=o.w===ans.w;
      b.classList.add(ok?'right':'wrong');
      if(!ok)[...box.children].find(c=>c.textContent===ans.w)?.classList.add('right');
      if(ok){ if(typeof weakHit==='function') weakHit(ans.w);
              const it=GITEM[GB.items.length]; if(it) GB.items.push(it.id);
              el('gqNote').innerHTML=`맞혔다 — <b>${GITEM[GB.items.length-1].name}</b>을 받았다.`; }
      else  { if(typeof weakAdd==='function') weakAdd(ans.w);
              el('gqNote').textContent=`정답은 ‘${ans.w}’. 빈손이다.`; }
      setTimeout(()=>gAskQuiz(n+1), ok?900:1500);
    };
    b.onclick=go;
    b.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } };
    box.appendChild(b);
  }
  show('vGam');
}

/* ── 한 판 ───────────────────────────────────────────── */
function gRoundStart(){
  const r=GAM.rounds[GB.round];
  GB.mine=r.life; GB.his=r.life;
  gDeal(); GB.turn='me'; GB.camTo=0; GB.cam=0; GB.peek=-1;
  S.screen='gamble'; show(null);
  say('노름꾼', GLINE.round[GB.round], C['--gold'], ()=>{ S.screen='gamble'; show(null); });
}
function gDeal(){
  const r=GAM.rounds[GB.round], a=[];
  for(let i=0;i<r.d;i++) a.push({kind:'death'});
  for(let i=0;i<r.t;i++) a.push({kind:'tonic'});
  GB.cups=a.sort(()=>Math.random()-.5); GB.taken=0; GB.peek=-1;
}
const gLeft  =()=>GB.cups.slice(GB.taken);
const gDeath =()=>gLeft().filter(c=>c.kind==='death').length;
const gTonic =()=>gLeft().filter(c=>c.kind==='tonic').length;
function gSay(t){ GB.line=t; GB.lineT=2.4; }

/* ── 잔 하나 ─────────────────────────────────────────── */
const GPH={ lift:0.55, hold:0.30, tilt:0.35, res:1.10, calm:0.60 };
const GTOT=GPH.lift+GPH.hold+GPH.tilt+GPH.res+GPH.calm;

function gTake(who, actor){
  if(GB.st!=='idle' || !gLeft().length) return;
  GB.st='run'; GB.p=0; GB.who=who; GB.actor=actor||'me'; GB.cup=GB.cups[GB.taken];
  GB.peek=-1;
}
function gLand(){
  const dead=GB.cup.kind==='death';
  if(GB.who==='toss'){ gSay(dead?'사약을 엎었다.':'보약을 엎었다.'); return; }
  if(GB.who==='me'){
    if(dead){ GB.flash=1; GB.veil=1; GB.shake=34; GB.mine--; vibe('hurt');
              gSay(gPick(GLINE.meDeath)); }
    else    { GB.jade=1;
              S.energy=Math.min(S.energyMax, S.energy+Math.round(S.energyMax*GAM.tonicHeal));
              vibe('charged'); gSay(gPick(GLINE.meTonic)); }
  }else{
    if(dead){ GB.knock=1; GB.red=1; GB.shake=44; GB.lamp=1;
              GB.back=Math.random()<0.5; GB.his--; vibe('boss');
              gSay(gPick(GLINE.hisDeath)); }
    else    { gSay(gPick(GLINE.hisTonic)); }
  }
}
/* 차례는 하나로 정해진다 — 제가 마신 잔이 보약이면 그대로, 그 밖에는 넘어간다 */
function gPass(){
  if(GB.who==='toss'){ GB.turn=GB.actor; GB.camTo=GB.turn==='dealer'?1:0; GB.wait=GAM.wait; return; }
  const keep=(GB.who===GB.actor && GB.cup.kind==='tonic');
  let next=keep?GB.actor:(GB.actor==='me'?'dealer':'me');
  if(next==='dealer' && GB.cuffed){ next='me'; GB.cuffed=false; gSay(GLINE.cuff); }
  GB.turn=next; GB.camTo=next==='dealer'?1:0; GB.wait=GAM.wait;
}
/* 판이 끝났나 */
function gCheck(){
  if(GB.mine>0 && GB.his>0){
    if(!gLeft().length){ gDeal(); gSay(GLINE.refill); }
    else if(gLeft().length===1) gSay(GLINE.last);
    return;
  }
  const won=GB.his<=0;
  if(won) GB.wins++;
  else { GB.losses++;
         S.energy=Math.max(1, S.energy-Math.round(S.energyMax*GAM.loseEnergy)); }
  const over=GB.wins>=2||GB.losses>=2;
  GB.st='hold';
  setTimeout(()=>{
    if(!GB) return;
    if(over){ say('노름꾼', won?GLINE.win:GLINE.lose, C['--gold'],
                  ()=>{ if(GB.wins>=2) gambleEnd(true); else gPenalty(); }); return; }
    say('노름꾼', won?GLINE.roundWin:GLINE.roundLose, C['--gold'],
        ()=>{ GB.round++; GB.st='idle'; gRoundStart(); });
  }, 1400);
}

/* ── 진 값 — 구슬 하나를 버리거나 위력을 내준다 ────────── */
function gPenalty(){
  S.screen='gamble-pen'; if(typeof dropTouches==='function') dropTouches();
  const slots=S.ballSlots||[];
  if(!slots.length){ gambleEnd(false); return; }
  const box=el('gpBody'); box.innerHTML='';
  const mk=(label,sub,fn)=>{
    const b=document.createElement('button');
    b.className='btn ghost'; b.style.cssText='width:100%;margin:.3em 0;text-align:left';
    b.innerHTML=`${label}<br><span style="font-size:.72em;color:var(--stone-deep)">${sub}</span>`;
    b.onclick=fn; box.appendChild(b);
  };
  const head=(t)=>{ const d=document.createElement('div');
    d.style.cssText='margin:.9em 0 .3em;font-size:.78em;letter-spacing:.16em;color:var(--gold)';
    d.textContent=t; box.appendChild(d); };
  head('구슬 하나를 두고 간다');
  slots.forEach((s,i)=>mk(s.def.name, `${s.lv}단 — 통째로 사라진다`, ()=>{
    if(slots.length<=1){ s.lv=Math.max(1,s.lv-1); }      // 마지막 하나는 안 지운다
    else S.ballSlots.splice(i,1);
    recalc(); gambleEnd(false);
  }));
  const up=slots.filter(s=>s.lv>1);
  if(up.length){
    head('위력을 내준다');
    up.forEach(s=>mk(s.def.name, `${s.lv}단 → ${s.lv-1}단`, ()=>{
      s.lv--; recalc(); gambleEnd(false);
    }));
  }
  el('gpNote').textContent = up.length ? ''
    : '한 단짜리뿐이라 내줄 위력이 없다. 구슬을 두고 가야 한다.';
  show('vGamPen');
}

/* ── 셈 ──────────────────────────────────────────────── */
function gTick(dt){
  GB.t+=dt;
  if(GB.st==='run'){
    const was=GB.p; GB.p+=dt;
    const mark=GPH.lift+GPH.hold+GPH.tilt;
    if(was<mark && GB.p>=mark) gLand();
    if(GB.p>=GTOT){ gPass(); GB.st='idle'; GB.taken++; GB.cup=null; GB.who=null; gCheck(); }
  }
  const ease=(v,k)=>Math.max(0,v-dt*k);
  GB.shake=ease(GB.shake,90); GB.flash=ease(GB.flash,3.4);
  GB.veil =ease(GB.veil,0.85); GB.jade=ease(GB.jade,1.5);
  GB.lamp =ease(GB.lamp,2.2);  GB.knock=ease(GB.knock,1.6);
  GB.red  =ease(GB.red,1.05);  GB.lineT=ease(GB.lineT,1);
  GB.cam += (GB.camTo-GB.cam)*Math.min(1,dt*3.4);
  if(GB.turn==='dealer' && GB.st==='idle' && gLeft().length){
    GB.wait-=dt;
    if(GB.wait<=0){
      const d=gDeath(), t=gTonic();
      gTake(d>t?'me':(t>d?'dealer':(Math.random()<0.6?'me':'dealer')),'dealer');
    }
  }
}
/* 넘어가는 꼴 — 0.06초에 확 날아갔다가 반대로 조금 넘치며 돌아온다 */
function gKnock(){
  if(GB.knock<=0) return 0;
  const u=1-GB.knock;
  if(u<0.10) return u/0.10;
  const q=(u-0.10)/0.90;
  return Math.pow(1-q,2)*Math.cos(q*4.2);
}

/* ══════════════════════════════════════════════════════
   그림
   ══════════════════════════════════════════════════════ */
const GHX=VW/2, GHY=352, GRX=88, GRY=106, GWAIST=700, GNECK=470;
const GTOP=760, GBOT=1250, GTHW=300, GBHW=640;
const GCUPY=915, GCUPGAP=132;
const gCupX=(i,n)=>VW/2+(i-(n-1)/2)*GCUPGAP;
const gFlick=()=>0.86+0.14*Math.sin(GB.t*11)+0.05*Math.sin(GB.t*23.7);
function gRR(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

function gBodyPath(){
  ctx.beginPath();
  ctx.moveTo(GHX-56,452); ctx.lineTo(GHX+56,452);
  ctx.bezierCurveTo(GHX+128,470, GHX+236,540, GHX+262,690);
  ctx.lineTo(GHX-262,690);
  ctx.bezierCurveTo(GHX-236,540, GHX-128,470, GHX-56,452);
  ctx.closePath();
}
function gHeadPath(){ ctx.beginPath(); ctx.ellipse(GHX,GHY,GRX,GRY,0,0,7); }
/* 허리를 축으로 몸이 통째로 날아가고, 목을 축으로 머리가 한 겹 더 —
   따로 굴려야 허리가 꺾인 것으로 보인다 */
function gTfBody(k,back){
  ctx.translate(GHX,GWAIST);
  if(back){ ctx.rotate(-0.085*k); ctx.scale(1-0.24*k,1-0.24*k); ctx.translate(-GHX,-GWAIST-124*k); }
  else    { ctx.rotate( 0.065*k); ctx.scale(1+0.20*k,1+0.20*k); ctx.translate(-GHX,-GWAIST+58*k); }
}
function gTfHead(k,back){
  ctx.translate(GHX,GNECK);
  if(back){ ctx.rotate(-0.10*k); ctx.scale(1-0.10*k,1-0.10*k); ctx.translate(-GHX,-GNECK-74*k); }
  else    { ctx.rotate( 0.08*k); ctx.scale(1+0.09*k,1+0.09*k); ctx.translate(-GHX,-GNECK+92*k); }
}
function gGat(){
  const by=286;
  ctx.strokeStyle='rgba(243,237,223,.62)'; ctx.lineWidth=3;
  ctx.fillStyle='rgba(5,8,15,.94)';
  ctx.beginPath();
  ctx.moveTo(GHX-64,by); ctx.lineTo(GHX-56,by-104);
  ctx.lineTo(GHX+56,by-104); ctx.lineTo(GHX+64,by);
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(GHX,by-104,56,15,0,0,7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(GHX,by,182,40,0,0,7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(243,237,223,.3)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(GHX-74,by+22); ctx.quadraticCurveTo(GHX-52,436,GHX-30,470); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(GHX+74,by+22); ctx.quadraticCurveTo(GHX+52,436,GHX+30,470); ctx.stroke();
}
function gInk(tt,y0,y1){
  ctx.fillStyle='rgba(5,8,15,.96)'; ctx.fillRect(0,y0-40,VW,y1-y0+80);
  for(let i=0;i<5;i++){
    const a=tt*(0.24+i*0.07)+i*1.7;
    const x=GHX+Math.cos(a)*(46+i*17), y=(y0+y1)/2+Math.sin(a*1.31)*((y1-y0)*0.3);
    const r=70+i*26;
    const g=ctx.createRadialGradient(x,y,2,x,y,r);
    g.addColorStop(0,`rgba(243,237,223,${0.11-i*0.014})`);
    g.addColorStop(1,'rgba(243,237,223,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();
  }
}
function gEdge(pathFn){                       // 테두리가 달아올랐다 돌아온다
  const r=GB.red;
  ctx.save();
  ctx.shadowColor=r>0?C['--vermilion']:'rgba(243,237,223,.4)';
  ctx.shadowBlur=18+r*46;
  ctx.strokeStyle=`rgba(${243+(226-243)*r},${237+(89-237)*r},${223+(63-223)*r},${.55+.4*r})`;
  ctx.lineWidth=3+r*3.6;
  pathFn(); ctx.stroke(); ctx.restore();
}
function gLit(pathFn){
  ctx.save(); pathFn(); ctx.clip();
  const g=ctx.createLinearGradient(0,690,0,GHY-60);
  g.addColorStop(0,'rgba(229,178,79,.26)'); g.addColorStop(1,'rgba(229,178,79,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,VW,760); ctx.restore();
}
function gDealer(){
  const k=gKnock(), back=GB.back, breath=Math.sin(GB.t*0.8)*3;
  const tt=GB.t*(1-GB.red);                   // 사약을 받으면 일렁임이 멎는다
  ctx.save(); ctx.translate(0,breath); gTfBody(k,back);
    ctx.save(); gBodyPath(); ctx.clip(); gInk(tt,452,690); ctx.restore();
    gEdge(gBodyPath);
  ctx.restore();
  ctx.save(); ctx.translate(0,breath); gTfBody(k,back); gTfHead(k,back);
    ctx.save(); gHeadPath(); ctx.clip(); gInk(tt+2.1,GHY-GRY,GHY+GRY); ctx.restore();
    gEdge(gHeadPath); gLit(gHeadPath); gGat();
  ctx.restore();
}
function gRoom(){
  const g=ctx.createRadialGradient(VW/2,880,120, VW/2,880,900);
  g.addColorStop(0,'rgba(229,178,79,.10)'); g.addColorStop(1,'rgba(5,8,15,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH);
  ctx.globalAlpha=.30; ctx.fillStyle='rgba(243,237,223,.5)';
  for(let i=0;i<34;i++){
    const s=i*97.3, x=(s*13.7)%VW, y=((s*29.1)+GB.t*(9+i%7)*3)%VH;
    ctx.fillRect(x,y,2,2);
  }
  ctx.globalAlpha=1;
}
function gTable(){
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(VW/2-GTHW,GTOP); ctx.lineTo(VW/2+GTHW,GTOP);
  ctx.lineTo(VW/2+GBHW,GBOT); ctx.lineTo(VW/2-GBHW,GBOT); ctx.closePath();
  const g=ctx.createLinearGradient(0,GTOP,0,GBOT);
  g.addColorStop(0,'rgba(243,237,223,.13)');
  g.addColorStop(.34,'rgba(243,237,223,.07)');
  g.addColorStop(1,'rgba(5,8,15,.85)');
  ctx.fillStyle=g; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.strokeStyle='rgba(243,237,223,.055)'; ctx.lineWidth=2;
  for(let i=-7;i<=7;i++){
    ctx.beginPath(); ctx.moveTo(VW/2+i*44,GTOP); ctx.lineTo(VW/2+i*118,GBOT); ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle='rgba(243,237,223,.34)'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(VW/2-GTHW,GTOP); ctx.lineTo(VW/2+GTHW,GTOP); ctx.stroke();
  ctx.restore();
}
function gLamp(x,y){
  const f=gFlick()*(1-GB.lamp*0.72);
  ctx.save();
  const g=ctx.createRadialGradient(x,y-26,4,x,y-26,240);
  g.addColorStop(0,`rgba(229,178,79,${.30*f})`); g.addColorStop(1,'rgba(229,178,79,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y-26,240,0,7); ctx.fill();
  ctx.strokeStyle='rgba(243,237,223,.5)'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.ellipse(x,y,34,11,0,0,7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x-34,y); ctx.quadraticCurveTo(x,y+26,x+34,y); ctx.stroke();
  ctx.fillStyle='rgba(5,8,15,.8)'; ctx.fill();
  ctx.save(); ctx.translate(x,y-8); ctx.rotate((1-f)*0.32);
  ctx.shadowColor=C['--gold']; ctx.shadowBlur=34*f;
  ctx.fillStyle=`rgba(229,178,79,${.92*f})`;
  ctx.beginPath(); ctx.moveTo(0,-34*f); ctx.quadraticCurveTo(11,-9,0,3);
  ctx.quadraticCurveTo(-11,-9,0,-34*f); ctx.fill();
  ctx.fillStyle=`rgba(243,237,223,${.85*f})`;
  ctx.beginPath(); ctx.ellipse(0,-9,3.4,8*f,0,0,7); ctx.fill();
  ctx.restore(); ctx.restore();
}
function gCup(x,y,s,tilt,show,kind){
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.rotate(tilt);
  ctx.strokeStyle='rgba(243,237,223,.78)'; ctx.lineWidth=3.2;
  ctx.beginPath(); ctx.moveTo(-27,-20);
  ctx.quadraticCurveTo(-23,17,0,21); ctx.quadraticCurveTo(23,17,27,-20);
  ctx.fillStyle='rgba(5,8,15,.92)'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-11,24); ctx.lineTo(11,24); ctx.stroke();
  if(show>0){
    const col=kind==='death'?C['--vermilion']:C['--jade'];
    ctx.save(); ctx.globalAlpha=show; ctx.shadowColor=col; ctx.shadowBlur=22;
    ctx.fillStyle=col; ctx.beginPath();
    ctx.ellipse(0,-17,25,7.5,0,0,7); ctx.fill(); ctx.restore();
  }
  ctx.strokeStyle='rgba(243,237,223,.9)'; ctx.lineWidth=3.2;
  ctx.beginPath(); ctx.ellipse(0,-20,27,8,0,0,7); ctx.stroke();
  ctx.restore();
}
function gDots(n,max,y){
  ctx.save();
  for(let i=0;i<max;i++){
    const x=VW/2+(i-(max-1)/2)*44;
    ctx.beginPath(); ctx.arc(x,y,12,0,7);
    if(i<n){ ctx.fillStyle=C['--gold']; ctx.shadowColor=C['--gold']; ctx.shadowBlur=16; ctx.fill(); }
    else   { ctx.strokeStyle='rgba(243,237,223,.24)'; ctx.lineWidth=2.4; ctx.stroke(); }
    ctx.shadowBlur=0;
  }
  ctx.restore();
}
/* 시점 — 내 차례엔 상을 내려다보고, 노름꾼 차례엔 그 얼굴로 올라간다 */
function gCam(){
  const c=GB.cam;
  ctx.translate(GHX,352); ctx.scale(1+0.34*c,1+0.34*c); ctx.translate(-GHX,-352+214*c);
}
const GBTN=[ {x:60, y:1160, w:360, h:104, k:'me',     s:'내가 마신다'},
             {x:460,y:1160, w:360, h:104, k:'dealer', s:'건넨다'} ];
const gMyTurn=()=>GB.turn==='me'&&GB.st==='idle'&&gLeft().length>0;
function gItemBox(i){ return {x:60+i*266, y:1300, w:250, h:76}; }

function gDraw(){
  const sh=GB.shake;
  ctx.save();
  if(sh>0) ctx.translate((Math.random()-.5)*sh,(Math.random()-.5)*sh);
  ctx.fillStyle=C['--pit-void']||'#05080F'; ctx.fillRect(0,0,VW,VH);
  gRoom();

  ctx.save(); gCam();                                  // ── 시점을 탄다
  gDealer();
  gDots(GB.his, GAM.rounds[GB.round].life, 668);
  if(GB.lineT>0){                                      // 짧은 말은 화면을 멈추지 않는다
    ctx.save(); ctx.globalAlpha=Math.min(1,GB.lineT);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font=`400 30px 'Gowun Batang',serif`;
    ctx.fillStyle='rgba(243,237,223,.86)';
    ctx.fillText(GB.line, VW/2, 726); ctx.restore();
  }
  gTable(); gLamp(150,822); gLamp(730,822);
  const n=GB.cups.length;
  for(let i=GB.taken;i<n;i++){
    if(GB.st==='run' && i===GB.taken) continue;
    gCup(gCupX(i,n),GCUPY,1,0, i===GB.peek?0.5:0, GB.cups[i].kind);
  }
  if(GB.st==='run'){
    const p=GB.p, sx=gCupX(GB.taken,n);
    const to = GB.who==='dealer' ? {x:GHX,y:470,s:0.8}
             : GB.who==='toss'   ? {x:VW/2,y:1040,s:1.2}
                                 : {x:VW/2,y:1120,s:1.9};
    let x=sx,y=GCUPY,s=1,tilt=0,show=0;
    if(p<GPH.lift){ const k=p/GPH.lift, e=k*k*(3-2*k);
      x=sx+(to.x-sx)*e; y=GCUPY+(to.y-GCUPY)*e; s=1+(to.s-1)*e; }
    else{ x=to.x; y=to.y; s=to.s;
      const q=p-GPH.lift;
      if(q>=GPH.hold){ const k=Math.min(1,(q-GPH.hold)/GPH.tilt);
        tilt=(GB.who==='dealer'?1:-1)*k*(GB.who==='toss'?1.4:0.62); show=k; }
      if(q>=GPH.hold+GPH.tilt) show=1;
    }
    gCup(x,y,s,tilt,show,GB.cup.kind);
  }
  ctx.restore();                                       // ── 시점 끝

  /* 붙박이 — 시점이 올라가도 셈은 끊기지 않는다 */
  const fade=1-GB.cam;
  ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font=`400 34px 'Gowun Batang',serif`;
  ctx.fillStyle=C['--vermilion']; ctx.fillText(`사약 ${gDeath()}`, VW/2-96, 1418);
  ctx.fillStyle=C['--jade'];      ctx.fillText(`보약 ${gTonic()}`, VW/2+96, 1418);
  ctx.globalAlpha=.5; ctx.font=`400 24px 'Gowun Batang',serif`;
  ctx.fillStyle=C['--paper'];
  ctx.fillText(`${GB.round+1}판  ·  ${GB.wins}승 ${GB.losses}패`, VW/2, 1064);
  ctx.restore();
  gDots(GB.mine, GAM.rounds[GB.round].life, 1490);

  if(fade>0.02){
    const on=gMyTurn();
    ctx.save(); ctx.globalAlpha=fade;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const b of GBTN){
      ctx.globalAlpha=fade*(on?1:.3);
      ctx.strokeStyle='rgba(243,237,223,.4)'; ctx.lineWidth=2.4;
      ctx.fillStyle='rgba(243,237,223,.05)';
      gRR(b.x,b.y,b.w,b.h,12); ctx.fill(); ctx.stroke();
      ctx.font=`400 38px 'Gowun Batang',serif`; ctx.fillStyle=C['--paper'];
      ctx.fillText(b.s, b.x+b.w/2, b.y+b.h/2+2);
    }
    GB.items.forEach((id,i)=>{                          // 가진 도구
      const it=GITEM.find(o=>o.id===id), r=gItemBox(i);
      ctx.globalAlpha=fade*(on?1:.3);
      ctx.strokeStyle=C['--gold']; ctx.lineWidth=2;
      ctx.fillStyle='rgba(229,178,79,.10)';
      gRR(r.x,r.y,r.w,r.h,10); ctx.fill(); ctx.stroke();
      ctx.font=`400 28px 'Gowun Batang',serif`; ctx.fillStyle=C['--gold'];
      ctx.fillText(it.name, r.x+r.w/2, r.y+r.h/2+1);
    });
    ctx.restore();
  }
  ctx.restore();

  if(GB.jade>0){
    ctx.save(); ctx.globalAlpha=GB.jade*.5; ctx.strokeStyle=C['--jade'];
    ctx.shadowColor=C['--jade']; ctx.shadowBlur=40; ctx.lineWidth=26;
    ctx.strokeRect(13,13,VW-26,VH-26); ctx.restore();
  }
  if(GB.veil>0){
    const g=ctx.createRadialGradient(VW/2,VH/2,120, VW/2,VH/2,1000);
    g.addColorStop(0,'rgba(5,8,15,0)');
    g.addColorStop(1,`rgba(5,8,15,${Math.min(.94,GB.veil)})`);
    ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH);
  }
  if(GB.flash>0){
    ctx.save(); ctx.globalAlpha=Math.min(1,GB.flash)*.55;
    ctx.fillStyle=C['--vermilion']; ctx.fillRect(0,0,VW,VH); ctx.restore();
  }
}

/* ── 도구 쓰기 ───────────────────────────────────────── */
function gUse(i){
  const id=GB.items[i]; if(!id||!gMyTurn()) return;
  if(id==='peek'){ GB.peek=GB.taken; gSay('다음 잔을 보았다.'); }
  else if(id==='toss'){ GB.items.splice(i,1); gTake('toss','me'); return; }
  else if(id==='cuff'){ GB.cuffed=true; gSay('오랏줄을 걸어 두었다.'); }
  GB.items.splice(i,1);
  vibe('charged');
}

/* ── 본 게임에 얹기 — mini.js 와 같은 방식 ──────────── */
(function(){
  const prev=draw;
  draw=function(){
    prev();
    if(!GB||!S||S.screen!=='gamble') return;
    const now=performance.now();
    const dt=Math.min(0.05,(now-gT)/1000); gT=now;
    gTick(dt);
    if(GB) gDraw();
  };
})();

cv.addEventListener('pointerdown',e=>{
  if(!GB||!S||S.screen!=='gamble') return;
  e.stopPropagation();
  const r=cv.getBoundingClientRect();
  const x=(e.clientX-r.left)/r.width*VW, y=(e.clientY-r.top)/r.height*VH;
  if(!gMyTurn()) return;
  for(let i=0;i<GB.items.length;i++){
    const b=gItemBox(i);
    if(x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h){ gUse(i); return; }
  }
  for(const b of GBTN)
    if(x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h){ gTake(b.k,'me'); return; }
},true);

/* ── 화면 둘을 만들어 붙인다 ────────────────────────── */
(function(){
  const host=el('vAdmin')?el('vAdmin').parentNode:document.body;
  const q=document.createElement('div');
  q.className='veil'; q.id='vGam';
  q.innerHTML=
   `<div class="eyebrow" id="gqHead"></div>
    <div id="gqDef" style="font-family:var(--font-carve);font-size:1.24em;line-height:1.7;
         text-align:center;margin:.4em 0 1.1em;max-width:22em"></div>
    <div id="gqOpts" style="display:flex;flex-direction:column;gap:.5em;width:100%;max-width:22em"></div>
    <div id="gqNote" style="margin-top:1em;min-height:2.2em;text-align:center;
         font-family:var(--font-carve);font-size:1.02em"></div>`;
  host.appendChild(q);

  const p=document.createElement('div');
  p.className='veil'; p.id='vGamPen';
  p.innerHTML=
   `<div class="eyebrow">노름꾼이 손을 내민다</div>
    <div id="gpNote" style="font-family:var(--font-carve);margin:.3em 0 .8em;
         text-align:center;color:var(--stone-deep)"></div>
    <div id="gpBody" style="width:100%;max-width:24em;overflow-y:auto"></div>`;
  host.appendChild(p);

  const st=document.createElement('style');
  st.textContent='#vGam .gqpos{display:block;font-family:var(--font-ui);font-size:.52em;'
    +'font-weight:700;letter-spacing:.2em;color:var(--gold);margin-bottom:.9em}';
  document.head.appendChild(st);
})();

/* ── 관리자 시험 ─────────────────────────────────────── */
function admGamble(){
  if(!S||S.screen==='title'){ newRun(); }
  S.screen='play'; show(null);
  gambleStart(win=>{
    S.screen='title'; show('vTitle');
    if(typeof refreshTitle==='function') refreshTitle();
    alert(win?'이겼다 — 작가의 조각 하나':'졌다');
  });
}
