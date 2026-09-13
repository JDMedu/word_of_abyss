/* ══════════════════════════════════════════════════════════
   노름꾼 — 보약과 사약
   본 게임과 떼어 둔다. 이 파일이 없거나 깨져도 본 게임은 돈다.
   지금은 관리자 화면에서만 부른다. 층에서 나오게 하려면
   nextStage() 에 한 줄만 넣으면 된다.
   ══════════════════════════════════════════════════════════ */
const GAM={
  /* 세 판 — 목숨과 잔 수가 판마다 다르다. 잔은 그때그때 뽑는다 */
  rounds:[{life:1,cup:[2,3]},{life:4,cup:[3,4]},{life:4,cup:[4,6]}],
  loseEnergy:0.15,     // 한 판 지면 기력을 이만큼 잃는다(최소 1은 남는다)
  tonicHeal:0.05,      // 보약 한 잔
  wait:1.5,            // 노름꾼이 뜸 들이는 시간
  ink3:200, ink2:100,  // 세 판을 다 이기면 200먹, 두 판이면 100먹
  quizN:4,             // 앉기 전에 묻는 낱말 수
};
/* 맞힌 순서대로 받는다. 넷 다 맞히면 넷 다 */
const GITEM=[
  {id:'peek', name:'엿보기',   tip:'다음 잔이 무엇인지 나만 본다'},
  {id:'toss', name:'털어내기', tip:'다음 잔을 마시지 않고 엎는다'},
  {id:'dbl',  name:'덧칠',     tip:'다음 잔이 사약이면 두 몫으로 든다'},
  {id:'cuff', name:'오랏줄',   tip:'노름꾼의 다음 차례를 건너뛴다'},
];

/* ── 대사 ─────────────────────────────────────────────
   문인이 아닌 자다. 저마다 문체가 있는 스물과 겹치지 않게
   노름판의 반말 하나로 민다                            */
const GLINE={
  meet:'앉아라.\n셈은 네가 하고, 마시는 것도 네가 고른다.',
  /* 셈에 쓸 수는 오직 여기서만 나온다. 화면에는 안 적는다 */
  round:[ (d,t)=>`주전자에 사약 ${d}, 보약 ${t}을 붓는다.\n잘 새겨 두어라. 두 번은 안 일러준다.`,
          (d,t)=>`한 판 갔다. 주전자를 비우고 새로 붓는다.\n사약 ${d}, 보약 ${t}이다.`,
          (d,t)=>`마지막이다. 사약 ${d}, 보약 ${t}.\n여기서 지면 하나를 두고 간다.` ],
  refill:(d,t)=>`주전자가 비었다. 다시 붓는다.\n사약 ${d}, 보약 ${t}이다.`,
  /* 짧은 것들은 화면을 멈추지 않는다. 노름꾼 아래에 잠깐 떴다 사라진다 */
  /* 내가 마셨을 때 — 내가 따른 것인가, 그가 건넨 것인가 */
  me:{
    ownDeath:['셈이 틀렸구나.','아까 그 잔은 건넸어야지.','따른 손이 네 손이다.'],
    ownTonic:['알고 마신 게냐, 운이 좋은 게냐.','한 잔 더 따라 보아라.'],
    givenDeath:['받아라. 내가 따른 것이다.','차례를 너무 오래 쥐고 있었다.'],
    givenTonic:['…아깝게 되었다.','살려 주려던 것은 아니다.'],
  },
  /* 그가 마셨을 때 — 제가 따라 제가 마신 것인가, 내가 건넨 것인가 */
  his:{
    ownDeath:['내가 마실 줄은 몰랐겠지.','…이것도 셈에 넣어 두어라.'],
    ownTonic:['나는 이것을 마셔도 낫지 않는다.\n차례를 잇는 것뿐이다.'],
    givenDeath:['…좋다. 셈을 할 줄 아는구나.','한 번은 맞겠지. 한 번은.'],
    givenTonic:['이것을 나에게 주다니.','나에게는 물이나 같다. 네가 마셨어야지.'],
  },
  last:'하나 남았다. 무엇인지 너도 알고 나도 안다.',
  cuff:'…손을 묶어 두었구나.',
  roundWin:'한 판 내주었다. 그뿐이다.',
  roundLose:'한 판 가져간다.',
  win3:'세 판을 다 가져갔구나.\n가져가라, 전부. 어차피 내 것이 아니었다.',
  win2:'두 판이면 네 것이다.\n가져가라. 한 판은 내가 가진다.',
  lose:'두고 가거라. 다음에 또 앉으면 될 일이다.',
};
const gPick=a=>a[Math.floor(Math.random()*a.length)];

let GB=null, gT=0;

/* ── 들고 나기 ───────────────────────────────────────── */
function gambleStart(done){
  GB={ round:0, wins:0, losses:0, mine:0, his:0,
       cups:[], taken:0, peekKind:null, cuffed:false, dbl:false, hitDbl:false, items:[],
       turn:'me', cam:0, camTo:0, wait:0,
       st:'idle', p:0, who:null, actor:null, cup:null,
       wipe:0, wiped:false, onWipe:null, flashW:0,
       shake:0, flash:0, veil:0, jade:0, knock:0, red:0, back:true,
       lamp:0, line:null, lineT:0, t:0, done:done||null };
  gT=performance.now();
  const go=()=>say('노름꾼', GLINE.meet, C['--gold'], ()=>gAskQuiz(0));
  if(META.gamSeen){ go(); return; }
  META.gamSeen=1; try{ saveMeta(); }catch(e){}
  S.screen='gamble-help'; if(typeof dropTouches==='function') dropTouches();
  el('ghGo').onclick=()=>{ show(null); go(); };
  show('vGamHelp');
}
/* 세 판을 다 치르고 나서 셈한다 */
function gambleEnd(wins){
  const done=GB?GB.done:null;
  if(wins>=2){
    S.bonusInk += (wins>=3 ? GAM.ink3 : GAM.ink2);
    META.wshard=(META.wshard||0)+1; try{ saveMeta(); }catch(e){}
  }
  GB=null; S.screen='play'; show(null);
  if(done) done(wins);
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
  const n=gDeal();
  GB.turn='me'; GB.camTo=0; GB.cam=0;
  GB.wipe=1; GB.st='open'; GB.flashW=1;          // 새 판이 밝아지며 열린다
  S.screen='gamble'; show(null);
  say('노름꾼', GLINE.round[GB.round](n.d,n.t), C['--gold'],
      ()=>{ S.screen='gamble'; show(null); });
}
/* 잔 수는 판마다 뽑고, 사약은 하나 이상 · 잔 수보다 하나 적게까지 */
function gDeal(){
  const r=GAM.rounds[GB.round];
  const n=r.cup[0]+Math.floor(Math.random()*(r.cup[1]-r.cup[0]+1));
  const d=1+Math.floor(Math.random()*(n-1));     // 1 ~ n-1
  const a=[];
  for(let i=0;i<d;i++)   a.push({kind:'death'});
  for(let i=0;i<n-d;i++) a.push({kind:'tonic'});
  GB.cups=a.sort(()=>Math.random()-.5); GB.taken=0;
  GB.peekKind=null; GB.dbl=false;
  return {d, t:n-d};
}
const gLeft  =()=>GB.cups.slice(GB.taken);
const gDeath =()=>gLeft().filter(c=>c.kind==='death').length;
const gTonic =()=>gLeft().filter(c=>c.kind==='tonic').length;
function gSay(t){ GB.line=t; GB.lineT=2.4; }

/* ── 잔 하나 ─────────────────────────────────────────── */
/* 따른다 → 옮긴다 → 뜸 → 기운다 → 결과.
   따르는 동안에도 잔 속은 검다. 입에 댈 때만 드러난다 */
const GPH={ pour:0.55, move:0.40, hold:0.62, tilt:0.35, res:1.10, calm:0.60 };
const GMARK=GPH.pour+GPH.move+GPH.hold+GPH.tilt;
const GTOT=GMARK+GPH.res+GPH.calm;

function gTake(who, actor){
  if(GB.st!=='idle' || !gLeft().length) return;
  GB.st='run'; GB.p=0; GB.who=who; GB.actor=actor||'me'; GB.cup=GB.cups[GB.taken];
  GB.hitDbl=GB.dbl; GB.dbl=false; GB.peekKind=null;
}
function gLand(){
  const dead=GB.cup.kind==='death';
  if(GB.who==='toss'){ gSay(dead?'사약을 엎었다.':'보약을 엎었다.'); return; }
  const dmg=(dead&&GB.hitDbl)?2:1;
  const given=(GB.actor!==GB.who);                  // 따른 손과 마신 입이 다른가
  const key=(given?'given':'own')+(dead?'Death':'Tonic');
  if(GB.who==='me'){
    if(dead){ GB.flash=1; GB.veil=1; GB.shake=34+GB.hitDbl*16; GB.mine-=dmg; vibe('hurt');
              gSay(GB.hitDbl?'덧칠한 사약이다. 두 몫으로 든다.':gPick(GLINE.me[key])); }
    else    { GB.jade=1;
              S.energy=Math.min(S.energyMax, S.energy+Math.round(S.energyMax*GAM.tonicHeal));
              vibe('charged'); gSay(gPick(GLINE.me[key])); }
  }else{
    if(dead){ GB.knock=1; GB.red=1; GB.shake=44+GB.hitDbl*18; GB.lamp=1;
              GB.back=Math.random()<0.5; GB.his-=dmg; vibe('boss');
              gSay(GB.hitDbl?'덧칠이 먹었다.':gPick(GLINE.his[key])); }
    else    { gSay(gPick(GLINE.his[key])); }
  }
}
/* 차례는 하나로 정해진다 — 제가 마신 잔이 보약이면 그대로, 그 밖에는 넘어간다 */
function gPass(){
  if(GB.who==='toss'){ GB.turn=GB.actor; GB.camTo=GB.turn==='dealer'?1:0; GB.wait=GAM.wait; return; }
  /* 누가 마셨든 상관없다. 보약이면 따른 사람이 한 번 더, 사약이면 넘어간다 */
  const keep=(GB.cup.kind==='tonic');
  let next=keep?GB.actor:(GB.actor==='me'?'dealer':'me');
  if(next==='dealer' && GB.cuffed){ next='me'; GB.cuffed=false; gSay(GLINE.cuff); }
  GB.turn=next; GB.camTo=next==='dealer'?1:0; GB.wait=GAM.wait;
}
/* 판이 끝났나 */
function gCheck(){
  if(GB.mine>0 && GB.his>0){
    if(!gLeft().length){
      const n=gDeal();
      say('노름꾼', GLINE.refill(n.d,n.t), C['--gold'],
          ()=>{ S.screen='gamble'; show(null); });
    }
    else if(gLeft().length===1) gSay(GLINE.last);
    return;
  }
  const won=GB.his<=0;
  if(won) GB.wins++;
  else { GB.losses++;
         S.energy=Math.max(1, S.energy-Math.round(S.energyMax*GAM.loseEnergy)); }
  const over=(GB.round>=GAM.rounds.length-1);     // 두 판을 이겨도 세 판은 다 친다
  GB.st='hold';
  /* 판이 갈리면 화면이 통째로 꺼졌다가 새 판이 밝아지며 열린다 */
  setTimeout(()=>{
    if(!GB) return;
    GB.st='wipe'; GB.wiped=false;
    GB.onWipe=()=>{
      if(over){
        const w=GB.wins;
        const t = w>=3?GLINE.win3 : w>=2?GLINE.win2 : GLINE.lose;
        say('노름꾼', t, C['--gold'], ()=>{ if(w>=2) gambleEnd(w); else gPenalty(w); });
        return;
      }
      say('노름꾼', won?GLINE.roundWin:GLINE.roundLose, C['--gold'],
          ()=>{ GB.round++; gRoundStart(); });
    };
  }, 1200);
}

/* ── 진 값 — 구슬 하나를 버리거나 위력을 내준다 ────────── */
function gPenalty(wins){
  S.screen='gamble-pen'; if(typeof dropTouches==='function') dropTouches();
  const slots=S.ballSlots||[];
  if(!slots.length){ gambleEnd(wins||0); return; }
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
    recalc(); gambleEnd(wins||0);
  }));
  const up=slots.filter(s=>s.lv>1);
  if(up.length){
    head('위력을 내준다');
    up.forEach(s=>mk(s.def.name, `${s.lv}단 → ${s.lv-1}단`, ()=>{
      s.lv--; recalc(); gambleEnd(wins||0);
    }));
  }
  el('gpNote').textContent = up.length ? ''
    : '한 단짜리뿐이라 내줄 위력이 없다. 구슬을 두고 가야 한다.';
  show('vGamPen');
}

/* ── 셈 ──────────────────────────────────────────────── */
function gTick(dt){
  GB.t+=dt;
  GB.dustT=(GB.dustT||0)+dt*(1-gHush());          // 뜸 동안에는 먼지도 멎는다
  if(GB.st==='run'){
    const was=GB.p; GB.p+=dt;
    if(was<GMARK && GB.p>=GMARK) gLand();
    if(GB.p>=GTOT){ gPass(); GB.st='idle'; GB.taken++; GB.cup=null; GB.who=null; gCheck(); }
  }
  else if(GB.st==='wipe'){
    GB.wipe=Math.min(1,(GB.wipe||0)+dt*2.2);
    if(GB.wipe>=1 && !GB.wiped){ GB.wiped=true; const f=GB.onWipe; GB.onWipe=null; if(f) f(); }
  }
  else if(GB.st==='open'){
    GB.wipe=Math.max(0,(GB.wipe||0)-dt*1.7);
    if(GB.wipe<=0) GB.st='idle';
  }
  const ease=(v,k)=>Math.max(0,v-dt*k);
  GB.shake=ease(GB.shake,90); GB.flash=ease(GB.flash,3.4);
  GB.veil =ease(GB.veil,0.85); GB.jade=ease(GB.jade,1.5);
  GB.lamp =ease(GB.lamp,2.2);  GB.knock=ease(GB.knock,1.6);
  GB.red  =ease(GB.red,1.05);  GB.lineT=ease(GB.lineT,1);
  GB.flashW=ease(GB.flashW||0,1.6);
  GB.cam += (GB.camTo-GB.cam)*Math.min(1,dt*3.4);
  if(GB.turn==='dealer' && GB.st==='idle' && !GB.wipe && gLeft().length){
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
/* 주전자와 잔은 차례를 따라 상 이쪽저쪽으로 건너간다.
   늘어놓지 않으니 셀 것은 대사로 들은 수뿐이다 */
function gRest(){
  const c=GB.cam;
  return { px:VW/2-165, py:1000+(700-1000)*c,
           cx:VW/2+95,  cy:1000+(700-1000)*c,
           s:1.15+(0.80-1.15)*c };
}
/* 입에 대기 직전 — 불도 먼지도 멎는다. 아무것도 안 움직이는 편이 무섭다 */
function gHush(){
  if(GB.st!=='run') return 0;
  const q=GB.p-GPH.pour-GPH.move;
  if(q<0 || q>=GPH.hold) return 0;
  return Math.min(1, Math.min(q, GPH.hold-q)/0.18);
}
const gFlick=()=>{
  const h=gHush();
  return (0.86+0.14*Math.sin(GB.t*11)+0.05*Math.sin(GB.t*23.7))*(1-h)+1.0*h;
};
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
  const dt=GB.dustT||(GB.dustT=0);
  for(let i=0;i<34;i++){
    const s=i*97.3, x=(s*13.7)%VW, y=((s*29.1)+dt*(9+i%7)*3)%VH;
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
function gPot(x,y,s,tilt){
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.rotate(tilt);
  ctx.strokeStyle='rgba(243,237,223,.74)'; ctx.lineWidth=3.2;
  ctx.fillStyle='rgba(5,8,15,.94)';
  ctx.beginPath();                                   // 몸통
  ctx.moveTo(-34,-22);
  ctx.bezierCurveTo(-46,4,-38,30,0,30);
  ctx.bezierCurveTo(38,30,46,4,34,-22);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,-22,34,10,0,0,7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-8,-30); ctx.lineTo(8,-30);   // 꼭지
  ctx.moveTo(0,-30); ctx.lineTo(0,-22); ctx.stroke();
  ctx.beginPath();                                   // 부리
  ctx.moveTo(30,-12); ctx.quadraticCurveTo(56,-16,62,-34);
  ctx.lineWidth=6; ctx.stroke();
  ctx.beginPath();                                   // 손잡이
  ctx.moveTo(-30,-14); ctx.quadraticCurveTo(-58,-4,-30,16);
  ctx.lineWidth=4.6; ctx.stroke();
  ctx.restore();
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
function gItemBox(i){ return {x:36+i*204, y:1300, w:192, h:76}; }

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

  const R=gRest(), run=GB.st==='run';
  let potTilt=0, pouring=0;
  if(run && GB.p<GPH.pour){ pouring=Math.sin((GB.p/GPH.pour)*Math.PI); potTilt=-0.62*pouring; }
  gPot(R.px,R.py,R.s,potTilt);
  if(GB.peekKind){                                   // 엿본 것 — 주전자 옆에 표가 앉는다
    ctx.save(); ctx.globalAlpha=.72;
    ctx.fillStyle=GB.peekKind==='death'?C['--vermilion']:C['--jade'];
    ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=18;
    ctx.beginPath(); ctx.arc(R.px-64*R.s, R.py-34*R.s, 11*R.s, 0, 7); ctx.fill();
    ctx.restore();
  }
  if(pouring>0.08){                                  // 떨어지는 줄기 — 색은 없다
    ctx.save(); ctx.globalAlpha=pouring;
    ctx.strokeStyle='rgba(243,237,223,.5)'; ctx.lineWidth=3.4*R.s;
    ctx.beginPath();
    ctx.moveTo(R.px+62*R.s, R.py-34*R.s);
    ctx.quadraticCurveTo(R.cx-6*R.s, R.py-26*R.s, R.cx, R.cy-22*R.s);
    ctx.stroke(); ctx.restore();
  }
  /* 잔 — 따르는 동안은 제자리, 그 뒤에 마실 사람에게 간다 */
  let x=R.cx, y=R.cy, cs=R.s, tilt=0, show=0;
  if(run && GB.p>=GPH.pour){
    const to = GB.who==='dealer' ? {x:GHX,y:500,s:0.9}
             : GB.who==='toss'   ? {x:VW/2,y:1040,s:1.2}
                                 : {x:VW/2,y:1120,s:1.9};
    const q=GB.p-GPH.pour;
    if(q<GPH.move){ const k=q/GPH.move, e=k*k*(3-2*k);
      x=R.cx+(to.x-R.cx)*e; y=R.cy+(to.y-R.cy)*e; cs=R.s+(to.s-R.s)*e; }
    else{ x=to.x; y=to.y; cs=to.s;
      const w=q-GPH.move;
      if(w>=GPH.hold){ const k=Math.min(1,(w-GPH.hold)/GPH.tilt);
        tilt=(GB.who==='dealer'?1:-1)*k*(GB.who==='toss'?1.4:0.62); show=k; }
      if(w>=GPH.hold+GPH.tilt) show=1;
    }
  }
  gCup(x,y,cs,tilt,show,run?GB.cup.kind:null);
  ctx.restore();                                       // ── 시점 끝

  /* 남은 수는 적지 않는다. 들은 것을 머리에 담고 있어야 한다 */
  const fade=1-GB.cam;
  ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
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
      ctx.font=`400 25px 'Gowun Batang',serif`; ctx.fillStyle=C['--gold'];
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
  if(GB.flashW>0){                                  // 새 판 — 종이빛이 한 번 친다
    ctx.save(); ctx.globalAlpha=Math.min(1,GB.flashW)*.7;
    ctx.fillStyle=C['--paper']; ctx.fillRect(0,0,VW,VH); ctx.restore();
  }
  if(GB.wipe>0){                                    // 판이 갈린다 — 통째로 꺼진다
    ctx.save(); ctx.globalAlpha=Math.min(1,GB.wipe);
    ctx.fillStyle=C['--pit-void']||'#05080F'; ctx.fillRect(0,0,VW,VH); ctx.restore();
  }
}

/* ── 도구 쓰기 ───────────────────────────────────────── */
function gUse(i){
  const id=GB.items[i]; if(!id||!gMyTurn()) return;
  if(id==='peek'){ const c=GB.cups[GB.taken];
    GB.peekKind=c?c.kind:null;
    gSay(c&&c.kind==='death'?'다음은 사약이다.':'다음은 보약이다.'); }
  else if(id==='toss'){ GB.items.splice(i,1); gTake('toss','me'); return; }
  else if(id==='dbl'){ GB.dbl=true; gSay('먹을 한 번 더 칠했다.'); }
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

/* ── 처음 만날 때 읽는 설명 ─────────────────────────── */
const GHELP=[
 {h:'무엇을 하는 자리인가', t:`주전자에 <b>보약</b>과 <b>사약</b>이 섞여 있습니다.<br>
    몇 잔씩인지는 노름꾼이 판이 시작할 때 <b>말로만</b> 일러줍니다.<br>
    어느 잔이 무엇인지는 아무도 모릅니다.`},
 {h:'한 잔이 도는 법', t:`차례가 된 사람이 한 잔 따릅니다.<br>
    <b>자기가 마시거나, 상대에게 건넵니다.</b><br>
    잔 속은 입에 댈 때까지 검습니다.`},
 {h:'사약', t:`마신 사람이 <b>목숨을 하나</b> 잃습니다.<br>
    그리고 <b>차례가 넘어갑니다.</b>`},
 {h:'보약', t:`마신 사람의 <b>기력이 오릅니다.</b><br>
    그리고 <b>따른 사람이 한 번 더</b> 따릅니다.<br>
    노름꾼은 몸이 없어 마셔도 낫지 않습니다. 차례만 이어갑니다.`},
 {h:'판', t:`세 판 중 <b>두 판을 먼저 이기면</b> 작가의 조각을 받습니다.<br>
    두 판을 지면 <b>구슬 하나를 두고</b> 가야 합니다.<br>
    한 판 질 때마다 기력도 깎입니다.`},
 {h:'도구 — 앉기 전 낱말 넷', t:`맞힌 수만큼 받고, <b>세 판을 그것으로 다 치릅니다.</b><br>
    <b>엿보기</b> · 다음 잔이 무엇인지 나만 봅니다.<br>
    <b>털어내기</b> · 다음 잔을 마시지 않고 엎습니다.<br>
    <b>덧칠</b> · 다음 잔이 사약이면 두 몫으로 듭니다. 보약이면 헛됩니다.<br>
    <b>오랏줄</b> · 노름꾼의 다음 차례를 건너뜁니다.`},
];
(function(){
  const host=el('vAdmin')?el('vAdmin').parentNode:document.body;
  const h=document.createElement('div');
  h.className='veil'; h.id='vGamHelp'; h.style.cssText='justify-content:flex-start;padding-top:10%;overflow-y:auto';
  h.innerHTML=`<div class="eyebrow">노름꾼</div><h2>보약과 <em>사약</em></h2>`
    + GHELP.map(g=>`<div style="width:100%;max-width:24em;margin:.55em 0">
        <div style="font-family:var(--font-ui);font-size:.72em;font-weight:700;
             letter-spacing:.16em;color:var(--gold);margin-bottom:.25em">${g.h}</div>
        <div style="font-family:var(--font-carve);line-height:1.65">${g.t}</div></div>`).join('')
    + `<div class="row"><button class="btn gold" id="ghGo">앉는다</button></div>`;
  host.appendChild(h);
  /* 게임 설명에도 한 장 넣는다 — 언제든 다시 본다 */
  try{
    if(typeof GUIDE==='object' && typeof HELP!=='undefined' && !GUIDE.gamble){
      GUIDE.gamble=GHELP.map(g=>({h:g.h,t:g.t}));
      HELP.push(['gamble','노름꾼 — 보약과 사약']);
    }
  }catch(e){}
})();

/* ── 관리자 시험 ─────────────────────────────────────── */
function admGamble(){
  if(!S||S.screen==='title'){ newRun(); }
  S.screen='play'; show(null);
  gambleStart(wins=>{
    S.screen='title'; show('vTitle');
    if(typeof refreshTitle==='function') refreshTitle();
    alert(wins>=3?'3승 — 작가의 조각 하나, 먹 200'
         :wins>=2?'2승 — 작가의 조각 하나, 먹 100'
         :`${wins}승 — 졌다`);
  });
}
