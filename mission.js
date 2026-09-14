/* ══════════════════════════════════════════════════════════
   오늘의 미션 · 이주의 미션
   세는 일은 index.html 의 mBump/mMax 가 한다. 이 파일은
   무엇을 뽑고, 무엇이 깨졌고, 무엇을 줄지만 맡는다.
   이 파일이 없으면 단추도 화면도 같이 사라지고 본 게임은 그대로 돈다.
   ══════════════════════════════════════════════════════════ */
const MSBUILD='m01';
try{ console.log('mission.js '+MSBUILD); }catch(e){}

const MIS={ dayN:3, weekN:6, ink:50, dayEasy:1, weekEasy:2 };

/* ── 자격 — 지금 할 수 없는 미션은 뽑지 않는다 ────────── */
const OK={
  f20 :()=>(META.best||0)>=20,
  f25 :()=>(META.best||0)>=25,
  f35 :()=>(META.best||0)>=35,
  weak:n=>()=>Object.keys(META.weak||{}).length>=n,
  abyss:()=>(META.abyss||0)>0,
  deep:()=>typeof deepOpen==='function' && deepOpen(META.char),
  grave:()=>typeof graveList==='function' && graveList().length>0,
};

/* ── 미션 ────────────────────────────────────────────
   n  : 이 칸에 쌓인 수를 본다        goal : 채워야 할 수
   hard: 'easy' | 'mid'              ok   : 자격(없으면 누구나)    */
const MK=(id,hard,name,key,goal,ok)=>({id,hard,name,key,goal,ok});

const DAILY=[
  /* ── 쉬움 15 ── */
  MK('d01','easy','한 판을 끝까지 하기','runs',1),
  MK('d02','easy','석판 50개 깨기','brick',50),
  MK('d03','easy','5층까지 내려가기','floor',5),
  MK('d04','easy','경보 1번 맞히기','alertOk',1),
  MK('d05','easy','보스 1명 잡기','boss',1),
  MK('d06','easy','낱말 10개 익히기','words',10),
  MK('d07','easy','먹 100 벌기','ink',100),
  MK('d08','easy','카드 3장 고르기','card',3),
  MK('d09','easy','기력을 한 번 가득 채우기','full',1),
  MK('d10','easy','두 판 하기','runs',2),
  MK('d11','easy','금석판 3개 깨기','k_gold',3),
  MK('d12','easy','굳은석판 5개 깨기','k_hard',5),
  MK('d13','easy','경보를 연속 2번 맞히기','alertRun',2),
  MK('d14','easy','8층까지 내려가기','floor',8),
  MK('d15','easy','낱말 20개 익히기','words',20),
  /* ── 보통 35 ── */
  MK('d16','mid','석판 150개 깨기','brick',150),
  MK('d17','mid','석판 250개 깨기','brick',250),
  MK('d18','mid','15층까지 내려가기','floor',15),
  MK('d19','mid','20층까지 내려가기','floor',20),
  MK('d20','mid','25층까지 내려가기','floor',25, OK.f20),
  MK('d21','mid','보스 3명 잡기','boss',3),
  MK('d22','mid','보스 5명 잡기','boss',5),
  MK('d23','mid','세 판 하기','runs',3),
  MK('d24','mid','먹 300 벌기','ink',300),
  MK('d25','mid','먹 600 벌기','ink',600),
  MK('d26','mid','낱말 30개 익히기','words',30),
  MK('d27','mid','낱말 60개 익히기','words',60),
  MK('d28','mid','카드 10장 고르기','card',10),
  MK('d29','mid','금석판 10개 깨기','k_gold',10),
  MK('d30','mid','굳은석판 20개 깨기','k_hard',20),
  MK('d31','mid','미니게임 한 번 하기','mini',1, OK.f25),
  MK('d32','mid','경보 5번 맞히기','alertOk',5),
  MK('d33','mid','경보 10번 맞히기','alertOk',10),
  MK('d34','mid','경보를 연속 4번 맞히기','alertRun',4),
  MK('d35','mid','경보를 연속 6번 맞히기','alertRun',6),
  MK('d36','mid','경보 15번 맞히기','alertOk',15),
  MK('d37','mid','틀렸던 낱말 3개 다시 맞히기','weak',3, OK.weak(3)),
  MK('d38','mid','틀렸던 낱말 6개 다시 맞히기','weak',6, OK.weak(6)),
  MK('d39','mid','되살아나지 않고 10층 내려가기','noRev',10),
  MK('d40','mid','되살아나지 않고 15층 내려가기','noRev',15),
  MK('d41','mid','기력을 세 번 가득 채우기','full',3),
  MK('d42','mid','카드 20장 고르기','card',20),
  MK('d43','mid','구슬을 융합하기','fuse',1),
  MK('d44','mid','구슬을 진화시키기','evo',1, OK.abyss),
  MK('d45','mid','미니게임을 한 번도 안 부딪히고 빠져나오기','miniClean',1, OK.f25),
  MK('d46','mid','한 판에서 콤보 15 잇기','combo',15),
  MK('d47','mid','한 판에서 콤보 25 잇기','combo',25),
  MK('d48','mid','심연에서 한 판 하기','abyssRun',1, OK.abyss),
  MK('d49','mid','백옥경 축복 하나 받기','fate',1),
  MK('d50','mid','죽은 자리를 되찾기','grave',1, OK.grave),
];

const WEEKLY=[
  /* ── 쉬움 15 ── */
  MK('w01','easy','세 날에 걸쳐 게임하기','days',3),
  MK('w02','easy','다섯 판 하기','runs',5),
  MK('w03','easy','석판 400개 깨기','brick',400),
  MK('w04','easy','보스 8명 잡기','boss',8),
  MK('w05','easy','낱말 100개 익히기','words',100),
  MK('w06','easy','먹 1000 벌기','ink',1000),
  MK('w07','easy','경보 20번 맞히기','alertOk',20),
  MK('w08','easy','20층까지 내려가기','floor',20),
  MK('w09','easy','노름꾼을 한 번 만나기','gamMeet',1),
  MK('w10','easy','미니게임 두 번 하기','mini',2, OK.f25),
  MK('w11','easy','카드 30장 고르기','card',30),
  MK('w12','easy','금석판 25개 깨기','k_gold',25),
  MK('w13','easy','오늘의 미션 세 개 완료하기','misDone',3),
  MK('w14','easy','구슬을 한 번 융합하기','fuse',1),
  MK('w15','easy','기력을 열 번 가득 채우기','full',10),
  /* ── 보통 35 ── */
  MK('w16','mid','다섯 날에 걸쳐 게임하기','days',5),
  MK('w17','mid','열 판 하기','runs',10),
  MK('w18','mid','석판 900개 깨기','brick',900),
  MK('w19','mid','석판 1500개 깨기','brick',1500),
  MK('w20','mid','보스 15명 잡기','boss',15),
  MK('w21','mid','보스 25명 잡기','boss',25),
  MK('w22','mid','낱말 200개 익히기','words',200),
  MK('w23','mid','낱말 350개 익히기','words',350),
  MK('w24','mid','먹 2500 벌기','ink',2500),
  MK('w25','mid','먹 5000 벌기','ink',5000),
  MK('w26','mid','미니게임 다섯 번 하기','mini',5, OK.f25),
  MK('w27','mid','굳은석판 100개 깨기','k_hard',100),
  MK('w28','mid','카드 70장 고르기','card',70),
  MK('w29','mid','오늘의 미션 열 개 완료하기','misDone',10),
  MK('w30','mid','판을 열다섯 번 하기','runs',15),
  MK('w31','mid','경보 50번 맞히기','alertOk',50),
  MK('w32','mid','경보 80번 맞히기','alertOk',80),
  MK('w33','mid','경보를 연속 8번 맞히기','alertRun',8),
  MK('w34','mid','틀렸던 낱말 15개 다시 맞히기','weak',15, OK.weak(15)),
  MK('w35','mid','틀렸던 낱말 30개 다시 맞히기','weak',30, OK.weak(30)),
  MK('w36','mid','30층까지 내려가기','floor',30, OK.f25),
  MK('w37','mid','40층까지 내려가기','floor',40, OK.f35),
  MK('w38','mid','되살아나지 않고 20층 내려가기','noRev',20),
  MK('w39','mid','노름꾼에게 한 판 이기기','gamRound',1),
  MK('w40','mid','노름꾼을 두 판 이겨 조각 받기','gamWin',1),
  MK('w41','mid','노름꾼을 세 판 다 이기기','gamPerfect',1),
  MK('w42','mid','노름꾼을 두 번 만나기','gamMeet',2),
  MK('w43','mid','구슬을 세 번 융합하기','fuse',3),
  MK('w44','mid','구슬을 두 번 진화시키기','evo',2, OK.abyss),
  MK('w45','mid','미니게임을 세 번 무사히 빠져나오기','miniClean',3, OK.f25),
  MK('w46','mid','백옥경 축복 세 번 받기','fate',3),
  MK('w47','mid','심연에서 세 판 하기','abyssRun',3, OK.abyss),
  MK('w48','mid','뒷세계에서 한 판 하기','deepRun',1, OK.deep),
  MK('w49','mid','한 판에서 콤보 40 잇기','combo',40),
  MK('w50','mid','구덩이를 한 번 완주하기','clearAll',1, OK.f35),
];

/* ── 뽑기 — 날마다 같은 것이 나오도록 날짜로 씨를 삼는다 ── */
function misSeed(str){
  let h=2166136261;
  for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
  return ()=>{ h^=h<<13; h>>>=0; h^=h>>17; h^=h<<5; h>>>=0; return h/4294967296; };
}
const misCan=m=>{ try{ return !m.ok || !!m.ok(); }catch(e){ return false; } };
/* 결이 같은 것은 한 번에 하나만 — 노름꾼 미션 셋이 한 주에 몰리면 안 된다 */
function misFam(k){
  if(k.indexOf('gam')===0)   return 'gam';
  if(k.indexOf('mini')===0)  return 'mini';
  if(k.indexOf('alert')===0) return 'alert';
  if(k==='floor'||k==='noRev')            return 'floor';
  if(k==='fuse' ||k==='evo')              return 'ball';
  if(k==='brick'||k==='k_gold'||k==='k_hard') return 'brick';
  if(k==='runs' ||k==='days'||k==='clearAll') return 'runs';
  return k;
}
function misPick(pool, key, nEasy, nTotal){
  const rnd=misSeed(key);
  const used=new Set();                            // 결이 같은 미션은 한 번에 하나만
  const take=(list,n)=>{
    const a=list.filter(misCan);
    const out=[];
    while(out.length<n && a.length){
      const m=a.splice(Math.floor(rnd()*a.length),1)[0];
      const f=misFam(m.key);
      if(used.has(f)) continue;
      used.add(f); out.push(m);
    }
    return out;
  };
  const easy=take(pool.filter(m=>m.hard==='easy'), nEasy);
  const mid =take(pool.filter(m=>m.hard==='mid'),  nTotal-easy.length);
  const all=easy.concat(mid);
  /* 자격이나 겹침으로 덜 뽑혔으면 남은 것으로 채운다 */
  if(all.length<nTotal){
    for(const m of pool){
      if(all.length>=nTotal) break;
      const f=misFam(m.key);
      if(all.includes(m)||used.has(f)||!misCan(m)) continue;
      used.add(f); all.push(m);
    }
  }
  return all.map(m=>m.id);
}
const misById=id=>DAILY.find(m=>m.id===id)||WEEKLY.find(m=>m.id===id);

/* 오늘·이번 주의 미션. 아직 안 뽑았으면 뽑아서 적어 둔다 */
function misToday(){
  const B=mBox();
  if(!B.dPick||!B.dPick.length){ B.dPick=misPick(DAILY,'d'+B.day,MIS.dayEasy,MIS.dayN); saveMeta(); }
  return B.dPick.map(misById).filter(Boolean);
}
function misWeek(){
  const B=mBox();
  if(!B.wPick||!B.wPick.length){ B.wPick=misPick(WEEKLY,'w'+B.week,MIS.weekEasy,MIS.weekN); saveMeta(); }
  return B.wPick.map(misById).filter(Boolean);
}
const misNow=(m,week)=>{ const B=mBox(); return (week?B.w:B.d)[m.key]||0; };
const misDone=(m,week)=>misNow(m,week)>=m.goal;
const misGot =(m,week)=>{ const B=mBox(); return (week?B.wGot:B.dGot||[]).includes(m.id); };

/* 받을 것이 하나라도 있나 — 제목 화면 단추에 금빛 점을 달 때 쓴다 */
function misClaimable(){
  try{
    const a=misToday().some(m=>misDone(m,0)&&!misGot(m,0));
    const w=misWeek();
    const b=w.some(m=>misDone(m,1)&&!misGot(m,1));
    const B=mBox();
    const c=w.every(m=>misDone(m,1)) && !B.wBonus;
    return a||b||c;
  }catch(e){ return false; }
}

/* ── 받기 ───────────────────────────────────────────── */
function misClaim(m,week){
  const B=mBox();
  if(!misDone(m,week)||misGot(m,week)) return;
  (week?B.wGot:B.dGot).push(m.id);
  META.ink=(META.ink||0)+MIS.ink;
  if(!week){                                       // 주간의 「오늘의 미션 N개」를 센다
    B.w.misDone=(B.w.misDone||0)+1;
  }
  saveMeta(); if(typeof vibe==='function') vibe('right');
  renderMis();
}
function misClaimBonus(){
  const B=mBox();
  if(B.wBonus||!misWeek().every(m=>misDone(m,1))) return;
  B.wBonus=1; META.wshard=(META.wshard||0)+1;
  saveMeta(); if(typeof vibe==='function') vibe('boss');
  renderMis();
}

/* ── 화면 ───────────────────────────────────────────── */
function misRow(m,week){
  const now=misNow(m,week), done=misDone(m,week), got=misGot(m,week);
  const d=document.createElement('div');
  d.className='misItem'+(got?' got':(done?' done':''));
  d.innerHTML=`<div class="mi">
      <div class="mn">${m.name}</div>
      ${got?'<div class="mh">받았다</div>'
           :`<div class="mbar"><i style="width:${Math.min(100,now/m.goal*100)}%"></i></div>
             <div class="mnum">${Math.min(now,m.goal)} / ${m.goal}</div>`}
    </div>
    <button class="btn ${done&&!got?'gold':'ghost'} mget"${done&&!got?'':' disabled'}>${
      got?'✓':`먹 ${MIS.ink}`}</button>`;
  const b=d.querySelector('.mget');
  if(done&&!got) b.onclick=()=>misClaim(m,week);
  return d;
}
function misHead(text, note){
  const d=document.createElement('div');
  d.className='misHead';
  d.innerHTML=`<span>${text}</span>${note?`<i>${note}</i>`:''}`;
  return d;
}
function renderMis(){
  const list=el('misList'); list.innerHTML='';
  const done=(a,w)=>a.filter(m=>misDone(m,w)).length;

  const t=misToday();
  list.appendChild(misHead('오늘', `${done(t,0)} / ${t.length}`));
  for(const m of t) list.appendChild(misRow(m,0));

  const w=misWeek(), B=mBox(), all=w.every(m=>misDone(m,1));
  list.appendChild(misHead('이번 주', `${done(w,1)} / ${w.length}`));
  for(const m of w) list.appendChild(misRow(m,1));

  const d=document.createElement('div');                 // 여섯을 다 이루면
  d.className='misItem bonus'+(B.wBonus?' got':(all?' done':''));
  d.innerHTML=`<div class="mi"><div class="mn">여섯을 다 이루면</div>
      <div class="mh">작가의 조각 하나</div></div>
    <button class="btn ${all&&!B.wBonus?'gold':'ghost'} mget"${all&&!B.wBonus?'':' disabled'}>${
      B.wBonus?'✓':'조각'}</button>`;
  const bb=d.querySelector('.mget');
  if(all&&!B.wBonus) bb.onclick=misClaimBonus;
  list.appendChild(d);

  el('misFoot').innerHTML=`<div id="misNote">오늘 것은 새벽 네 시에, `
    +`이번 주 것은 월요일 새벽 네 시에 바뀐다.<br>받지 않은 것은 그때 사라진다.</div>`;
  misDot();
}
/* 제목 화면 단추의 금빛 점 */
function misDot(){
  const b=el('btnMis'); if(!b) return;
  b.classList.toggle('misOn', misClaimable());
}

/* ── 본 게임에 얹는다 ───────────────────────────────── */
(function(){
  if(typeof el!=='function'){ console.warn('mission.js — el 을 못 찾았다'); return; }
  const pro=el('btnPro');
  if(!pro){ console.warn('mission.js — 제목 화면 단추 자리를 못 찾았다'); return; }
  /* 단추 — 복선 옆에 둔다 */
  const btn=document.createElement('button');
  btn.className='btn ghost'; btn.id='btnMis'; btn.textContent='도전과제';
  pro.parentNode.insertBefore(btn, pro);
  btn.onclick=()=>{ renderMis(); show('vMis'); };

  /* 화면 */
  const host=el('vPro')?el('vPro').parentNode:document.body;
  const v=document.createElement('div');
  v.className='veil'; v.id='vMis';
  v.innerHTML=`<div class="eyebrow">도전과제</div>
    <h2>오늘의 <em>미션</em></h2>
    <div id="misList"></div>
    <div id="misFoot"></div>
    <div class="row"><button class="btn gold" id="misBack">돌아간다</button></div>`;
  host.appendChild(v);
  el('misBack').onclick=()=>{ show('vTitle'); if(typeof refreshTitle==='function') refreshTitle(); };

  const st=document.createElement('style');
  st.textContent=
    '#vMis{justify-content:flex-start;padding-top:11%}'
   +'#vMis>*{flex-shrink:0}'
   +'.misHead{display:flex;justify-content:space-between;align-items:baseline;'
   +'margin:1.1em 0 .1em;padding-bottom:.35em;border-bottom:1px solid rgba(229,178,79,.34)}'
   +'.misHead:first-child{margin-top:.2em}'
   +'.misHead span{font-family:var(--font-ui);font-size:.72em;font-weight:700;'
   +'letter-spacing:.24em;color:var(--gold)}'
   +'.misHead i{font-family:var(--font-ui);font-size:.7em;font-style:normal;color:var(--stone-deep)}'
   +'.misItem.bonus{border-bottom:none}'
   +'.misItem.bonus .mn{color:var(--gold)}'
   +'#misList{flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;'
   +'width:100%;max-width:26em}'
   +'#misFoot{width:100%;max-width:26em;margin-top:.6em}'
   +'.misItem{display:flex;align-items:center;gap:.8em;padding:.7em .2em;'
   +'border-bottom:1px solid rgba(243,237,223,.12)}'
   +'.misItem .mi{flex:1 1 auto;min-width:0}'
   +'.misItem .mn{font-family:var(--font-carve);font-size:1.05em;line-height:1.4}'
   +'.misItem .mh{font-family:var(--font-carve);font-size:.85em;color:var(--stone-deep);margin-top:.2em}'
   +'.misItem .mbar{height:5px;border-radius:3px;background:rgba(243,237,223,.14);'
   +'margin-top:.45em;overflow:hidden}'
   +'.misItem .mbar i{display:block;height:100%;background:var(--gold)}'
   +'.misItem .mnum{font-family:var(--font-ui);font-size:.68em;color:var(--stone-deep);margin-top:.25em}'
   +'.misItem.done .mn{color:var(--gold)}'
   +'.misItem.got{opacity:.45}'
   +'.misItem .mget{flex:0 0 auto;padding:.5em .8em;font-size:.78em;min-width:5em}'
   +'.misItem .mget[disabled]{opacity:.35}'
   +'#misNote{font-family:var(--font-carve);font-size:.88em;color:var(--stone-deep);'
   +'text-align:center;line-height:1.6;margin-top:.4em}'
   /* 받을 것이 있으면 금빛 점 */
   +'#btnMis.misOn{position:relative;color:var(--gold);border-color:var(--gold)}'
   +'#btnMis.misOn::after{content:"";position:absolute;top:.35em;right:.45em;'
   +'width:.5em;height:.5em;border-radius:50%;background:var(--gold);'
   +'box-shadow:0 0 8px var(--gold);animation:misPulse 1.6s infinite}'
   +'@keyframes misPulse{0%,100%{opacity:1}50%{opacity:.35}}';
  document.head.appendChild(st);

  /* 제목 화면으로 돌아올 때마다 점을 다시 본다 */
  if(typeof refreshTitle==='function'){
    const prev=refreshTitle;
    refreshTitle=function(){ const r=prev(); try{ misDot(); }catch(e){} return r; };
  }
  try{ misDot(); }catch(e){}
})();
