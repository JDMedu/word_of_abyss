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
const M=(id,hard,name,key,goal,ok)=>({id,hard,name,key,goal,ok});

const DAILY=[
  /* ── 쉬움 15 ── */
  M('d01','easy','한 판을 끝까지 하기','runs',1),
  M('d02','easy','석판 50개 깨기','brick',50),
  M('d03','easy','5층까지 내려가기','floor',5),
  M('d04','easy','경보 1번 맞히기','alertOk',1),
  M('d05','easy','보스 1명 잡기','boss',1),
  M('d06','easy','낱말 10개 익히기','words',10),
  M('d07','easy','먹 100 벌기','ink',100),
  M('d08','easy','카드 3장 고르기','card',3),
  M('d09','easy','기력을 한 번 가득 채우기','full',1),
  M('d10','easy','두 판 하기','runs',2),
  M('d11','easy','금석판 3개 깨기','k_gold',3),
  M('d12','easy','굳은석판 5개 깨기','k_hard',5),
  M('d13','easy','경보를 연속 2번 맞히기','alertRun',2),
  M('d14','easy','8층까지 내려가기','floor',8),
  M('d15','easy','낱말 20개 익히기','words',20),
  /* ── 보통 35 ── */
  M('d16','mid','석판 150개 깨기','brick',150),
  M('d17','mid','석판 250개 깨기','brick',250),
  M('d18','mid','15층까지 내려가기','floor',15),
  M('d19','mid','20층까지 내려가기','floor',20),
  M('d20','mid','25층까지 내려가기','floor',25, OK.f20),
  M('d21','mid','보스 3명 잡기','boss',3),
  M('d22','mid','보스 5명 잡기','boss',5),
  M('d23','mid','세 판 하기','runs',3),
  M('d24','mid','먹 300 벌기','ink',300),
  M('d25','mid','먹 600 벌기','ink',600),
  M('d26','mid','낱말 30개 익히기','words',30),
  M('d27','mid','낱말 60개 익히기','words',60),
  M('d28','mid','카드 10장 고르기','card',10),
  M('d29','mid','금석판 10개 깨기','k_gold',10),
  M('d30','mid','굳은석판 20개 깨기','k_hard',20),
  M('d31','mid','미니게임 한 번 하기','mini',1, OK.f25),
  M('d32','mid','경보 5번 맞히기','alertOk',5),
  M('d33','mid','경보 10번 맞히기','alertOk',10),
  M('d34','mid','경보를 연속 4번 맞히기','alertRun',4),
  M('d35','mid','경보를 연속 6번 맞히기','alertRun',6),
  M('d36','mid','경보 15번 맞히기','alertOk',15),
  M('d37','mid','틀렸던 낱말 3개 다시 맞히기','weak',3, OK.weak(3)),
  M('d38','mid','틀렸던 낱말 6개 다시 맞히기','weak',6, OK.weak(6)),
  M('d39','mid','되살아나지 않고 10층 내려가기','noRev',10),
  M('d40','mid','되살아나지 않고 15층 내려가기','noRev',15),
  M('d41','mid','기력을 세 번 가득 채우기','full',3),
  M('d42','mid','카드 20장 고르기','card',20),
  M('d43','mid','구슬을 융합하기','fuse',1),
  M('d44','mid','구슬을 진화시키기','evo',1, OK.abyss),
  M('d45','mid','미니게임을 한 번도 안 부딪히고 빠져나오기','miniClean',1, OK.f25),
  M('d46','mid','한 판에서 콤보 15 잇기','combo',15),
  M('d47','mid','한 판에서 콤보 25 잇기','combo',25),
  M('d48','mid','심연에서 한 판 하기','abyssRun',1, OK.abyss),
  M('d49','mid','백옥경 축복 하나 받기','fate',1),
  M('d50','mid','죽은 자리를 되찾기','grave',1, OK.grave),
];

const WEEKLY=[
  /* ── 쉬움 15 ── */
  M('w01','easy','세 날에 걸쳐 게임하기','days',3),
  M('w02','easy','다섯 판 하기','runs',5),
  M('w03','easy','석판 400개 깨기','brick',400),
  M('w04','easy','보스 8명 잡기','boss',8),
  M('w05','easy','낱말 100개 익히기','words',100),
  M('w06','easy','먹 1000 벌기','ink',1000),
  M('w07','easy','경보 20번 맞히기','alertOk',20),
  M('w08','easy','20층까지 내려가기','floor',20),
  M('w09','easy','노름꾼을 한 번 만나기','gamMeet',1),
  M('w10','easy','미니게임 두 번 하기','mini',2, OK.f25),
  M('w11','easy','카드 30장 고르기','card',30),
  M('w12','easy','금석판 25개 깨기','k_gold',25),
  M('w13','easy','오늘의 미션 세 개 완료하기','misDone',3),
  M('w14','easy','구슬을 한 번 융합하기','fuse',1),
  M('w15','easy','기력을 열 번 가득 채우기','full',10),
  /* ── 보통 35 ── */
  M('w16','mid','다섯 날에 걸쳐 게임하기','days',5),
  M('w17','mid','열 판 하기','runs',10),
  M('w18','mid','석판 900개 깨기','brick',900),
  M('w19','mid','석판 1500개 깨기','brick',1500),
  M('w20','mid','보스 15명 잡기','boss',15),
  M('w21','mid','보스 25명 잡기','boss',25),
  M('w22','mid','낱말 200개 익히기','words',200),
  M('w23','mid','낱말 350개 익히기','words',350),
  M('w24','mid','먹 2500 벌기','ink',2500),
  M('w25','mid','먹 5000 벌기','ink',5000),
  M('w26','mid','미니게임 다섯 번 하기','mini',5, OK.f25),
  M('w27','mid','굳은석판 100개 깨기','k_hard',100),
  M('w28','mid','카드 70장 고르기','card',70),
  M('w29','mid','오늘의 미션 열 개 완료하기','misDone',10),
  M('w30','mid','판을 열다섯 번 하기','runs',15),
  M('w31','mid','경보 50번 맞히기','alertOk',50),
  M('w32','mid','경보 80번 맞히기','alertOk',80),
  M('w33','mid','경보를 연속 8번 맞히기','alertRun',8),
  M('w34','mid','틀렸던 낱말 15개 다시 맞히기','weak',15, OK.weak(15)),
  M('w35','mid','틀렸던 낱말 30개 다시 맞히기','weak',30, OK.weak(30)),
  M('w36','mid','30층까지 내려가기','floor',30, OK.f25),
  M('w37','mid','40층까지 내려가기','floor',40, OK.f35),
  M('w38','mid','되살아나지 않고 20층 내려가기','noRev',20),
  M('w39','mid','노름꾼에게 한 판 이기기','gamRound',1),
  M('w40','mid','노름꾼을 두 판 이겨 조각 받기','gamWin',1),
  M('w41','mid','노름꾼을 세 판 다 이기기','gamPerfect',1),
  M('w42','mid','노름꾼을 두 번 만나기','gamMeet',2),
  M('w43','mid','구슬을 세 번 융합하기','fuse',3),
  M('w44','mid','구슬을 두 번 진화시키기','evo',2, OK.abyss),
  M('w45','mid','미니게임을 세 번 무사히 빠져나오기','miniClean',3, OK.f25),
  M('w46','mid','백옥경 축복 세 번 받기','fate',3),
  M('w47','mid','심연에서 세 판 하기','abyssRun',3, OK.abyss),
  M('w48','mid','뒷세계에서 한 판 하기','deepRun',1, OK.deep),
  M('w49','mid','한 판에서 콤보 40 잇기','combo',40),
  M('w50','mid','구덩이를 한 번 완주하기','clearAll',1, OK.f35),
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
let misTab='오늘';
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
function renderMis(){
  const tabs=el('misTabs'); tabs.innerHTML='';
  for(const t of ['오늘','이번 주']){
    const b=document.createElement('button');
    b.className='btn ghost'+(t===misTab?' on':'');
    b.textContent=t; b.onclick=()=>{ misTab=t; renderMis(); };
    tabs.appendChild(b);
  }
  const week=misTab==='이번 주';
  const list=el('misList'); list.innerHTML='';
  for(const m of (week?misWeek():misToday())) list.appendChild(misRow(m,week));

  const foot=el('misFoot'); foot.innerHTML='';
  if(week){
    const B=mBox(), all=misWeek().every(m=>misDone(m,1));
    const d=document.createElement('div');
    d.className='misItem'+(B.wBonus?' got':(all?' done':''));
    d.innerHTML=`<div class="mi"><div class="mn">여섯을 다 이루면</div>
        <div class="mh">작가의 조각 하나</div></div>
      <button class="btn ${all&&!B.wBonus?'gold':'ghost'} mget"${all&&!B.wBonus?'':' disabled'}>${
        B.wBonus?'✓':'조각'}</button>`;
    const b=d.querySelector('.mget');
    if(all&&!B.wBonus) b.onclick=misClaimBonus;
    foot.appendChild(d);
  }else{
    foot.innerHTML=`<div id="misNote">새벽 네 시에 새 미션으로 바뀐다.<br>`
      +`받지 않은 것은 그때 사라진다.</div>`;
  }
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
  btn.onclick=()=>{ misTab='오늘'; renderMis(); show('vMis'); };

  /* 화면 */
  const host=el('vPro')?el('vPro').parentNode:document.body;
  const v=document.createElement('div');
  v.className='veil'; v.id='vMis';
  v.innerHTML=`<div class="eyebrow">도전과제</div>
    <h2>오늘의 <em>미션</em></h2>
    <div id="misTabs"></div>
    <div id="misList"></div>
    <div id="misFoot"></div>
    <div class="row"><button class="btn gold" id="misBack">돌아간다</button></div>`;
  host.appendChild(v);
  el('misBack').onclick=()=>{ show('vTitle'); if(typeof refreshTitle==='function') refreshTitle(); };

  const st=document.createElement('style');
  st.textContent=
    '#vMis{justify-content:flex-start;padding-top:11%}'
   +'#vMis>*{flex-shrink:0}'
   +'#misTabs{display:flex;gap:.4em;margin-bottom:.8em}'
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
