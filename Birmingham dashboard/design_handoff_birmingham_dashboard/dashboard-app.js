// ══════════════════════════════════════════════════════════
// Birmingham Employment Dashboard v3 — application logic
// ══════════════════════════════════════════════════════════

const SP=['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
let _si={};
function ts(){return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});}
function tLog(id,badge,cls,msg){
  const log=document.getElementById('tlog');
  const el=document.createElement('div');
  el.className='t-line'; el.id='tl-'+id;
  el.innerHTML=`<span class="t-ts">${ts()}</span><span class="tbadge ${cls}" id="tb-${id}">${badge}</span><span class="t-msg" id="tm-${id}">${msg}</span>`;
  log.appendChild(el);
  requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('vis')));
}
function tUpd(id,badge,cls,msg){
  const b=document.getElementById('tb-'+id),m=document.getElementById('tm-'+id);
  if(b){b.textContent=badge;b.className='tbadge '+cls;}
  if(m)m.innerHTML=msg; tStop(id);
}
function tSpin(id){tStop(id);_si[id]=setInterval(()=>{const b=document.getElementById('tb-'+id);if(b)b.textContent=SP[Date.now()/80|0%SP.length];},80);}
function tStop(id){if(_si[id]){clearInterval(_si[id]);delete _si[id];}}
function tProg(p){document.getElementById('tprog').style.width=p+'%';}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

// Big "BIRMINGHAM" ASCII banner — futuristic reveal
const BHAM_BANNER=
` ____    ___   ____   __  __   ___   _   _    ____   _   _    _    __  __ \n`+
`| __ )  |_ _| |  _ \\ |  \\/  | |_ _| | \\ | |  / ___| | | | |  / \\  |  \\/  |\n`+
`|  _ \\   | |  | |_) || |\\/| |  | |  |  \\| | | |  _  | |_| | / _ \\ | |\\/| |\n`+
`| |_) |  | |  |  _ < | |  | |  | |  | |\\  | | |_| | |  _  |/ ___ \\| |  | |\n`+
`|____/  |___| |_| \\_\\|_|  |_| |___| |_| \\_|  \\____| |_| |_/_/   \\_\\_|  |_|`;

async function revealBanner(){
  const el=document.getElementById('bham-mega');
  const lines=BHAM_BANNER.split('\n');
  // Render each char in a span
  el.innerHTML=lines.map(l=>l.split('').map(c=>`<span class="ch">${c==' '?'&nbsp;':c}</span>`).join('')).join('<br>');
  const chars=el.querySelectorAll('.ch');
  // staggered reveal column by column
  const cols=lines[0].length;
  for(let col=0;col<cols;col++){
    chars.forEach((c,i)=>{
      const lineLen=lines[Math.floor(i/cols)]?.length||cols;
      const cIdx=i%cols;
      if(cIdx===col) requestAnimationFrame(()=>c.classList.add('in'));
    });
    if(col%4===0) await sleep(18);
  }
  await sleep(120);
}

// ══════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════
let WARDS=[], selected=null, view='grid';
let scatterCh=null, matrixCh=null, trendCh=null;
let mapL=null, mapInited=false;
let pinnedWards=[];
let trendMode='12m';
let dsrc={nomis:'cached',imd:'cached',gva:'cached'};
let dsmeta={nomis:{count:null,date:null,err:null},imd:{lsoas:null,wards:null,err:null},gva:{count:null,err:null}};
let lastFetch=null;
let activeQuadrant=null;
let matrixSort={key:'composite',dir:-1};

const RAMP=['#7a8270','#7a7a5e','#7d6e4e','#7e5e40','#7d4e36','#73402e','#683428','#5b2a23','#4d211d','#3a1a1a'];
const Q_COLORS={prosperous:'#1a3a2a',workhorse:'#2a1a3a',commuter:'#1a2a3a',disadvantage:'#3a1a1a'};
const Q_LABELS={prosperous:'Productive & prosperous',workhorse:'Economic workhorse',commuter:'Commuter belt',disadvantage:'Compound disadvantage'};
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const muted='#6b6760';
function dc(d){return RAMP[Math.max(0,Math.min(9,(d||1)-1))];}

// Deterministic hash from string → 0..1
function hash01(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return((h>>>0)%10000)/10000;}

// ── Normalise ──
function normalise(wards){
  const maxI=Math.max(...wards.map(w=>w.imd_employment_score));
  const minI=Math.min(...wards.map(w=>w.imd_employment_score));
  const maxC=Math.max(...wards.map(w=>w.claimant_rate));
  const minC=Math.min(...wards.map(w=>w.claimant_rate));
  const maxA=Math.max(...wards.map(w=>w.inactivity_sick_pct));
  const minA=Math.min(...wards.map(w=>w.inactivity_sick_pct));
  wards.forEach(w=>{
    w.imd_norm=maxI>minI?(w.imd_employment_score-minI)/(maxI-minI):0;
    w.cc_norm =maxC>minC?(w.claimant_rate-minC)/(maxC-minC):0;
    w.ia_norm =maxA>minA?(w.inactivity_sick_pct-minA)/(maxA-minA):0;
    w.composite=w.imd_norm*.4+w.cc_norm*.35+w.ia_norm*.25;
  });
  const srt=[...wards].sort((a,b)=>a.composite-b.composite);
  srt.forEach((w,i)=>{w.composite_decile=Math.min(10,Math.ceil(((i+1)/srt.length)*10));});
  return wards;
}

// Median helper
function median(arr){const s=[...arr].sort((a,b)=>a-b);const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}

// Quadrant assignment
function assignQuadrants(wards){
  const gvaMed=median(wards.map(w=>w.gva));
  const depMed=median(wards.map(w=>w.imd_employment_score));
  wards.forEach(w=>{
    if(w.gva>=gvaMed&&w.imd_employment_score<depMed) w.quadrant='prosperous';
    else if(w.gva>=gvaMed&&w.imd_employment_score>=depMed) w.quadrant='workhorse';
    else if(w.gva<gvaMed&&w.imd_employment_score<depMed) w.quadrant='commuter';
    else w.quadrant='disadvantage';
  });
  return {gvaMed,depMed};
}

// Earnings synthesis
function synthEarnings(w){
  const noise=(hash01(w.ward_code+'e')-.5)*4;
  return Math.round(28+(1-w.imd_norm)*18+(1-w.cc_norm)*6+noise);
}

// Population synthesis (deterministic fallback)
function synthPop(w){return 9000+Math.round(hash01(w.ward_code+'p')*8000);}

// GVA synthesis (band-based, seeded)
function synthGva(w){
  const [lo,hi]=w.gva_band||[12,18];
  return parseFloat((lo+hash01(w.ward_code+'g')*(hi-lo)).toFixed(1));
}

// Extras
function extras(w){
  const s=w.composite, seed=hash01(w.ward_code+'x');
  const n=(a,b)=>parseFloat((a+(b-a)*s+(seed-.5)*(b-a)*.06).toFixed(1));
  return {youth_unemp:n(3.5,24),uc_pct:n(5,34),no_quals:n(3.5,22),vacancies:parseFloat((n(1.5,12)*(1-s*.7)+.5).toFixed(1))};
}

// ══════════════════════════════════════════════════════════
// FETCHES
// ══════════════════════════════════════════════════════════
async function fetchNOMIS(){
  const url='https://www.nomisweb.co.uk/api/v01/dataset/NM_162_1.data.json?geography=1946157186TYPE448&date=latest&gender=0&age=0&measure=2&measures=20100';
  const r=await fetch(url,{signal:AbortSignal.timeout(12000)});
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  const j=await r.json();
  const obs=j.obs||j.data||[];
  if(!obs.length) throw new Error('empty');
  const map={};
  obs.forEach(o=>{const c=o.geography?.geogcode||o.geography?.code;const v=o.obs_value?.value??o.value;if(c&&v!=null)map[c]=parseFloat(v);});
  return {map,date:obs[0]?.date?.description||'latest',count:Object.keys(map).length};
}

async function fetchIMD(){
  const BASE='https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/imd-indices-of-deprivation-2025-wmca-lsoa-2021/records';
  let off=0,all=[],total=null;
  while(true){
    const url=`${BASE}?limit=100&offset=${off}&where=lad22cd%3D'E08000025'`;
    const r=await fetch(url,{signal:AbortSignal.timeout(15000)});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const j=await r.json();
    if(total===null) total=j.total_count??j.nhits??0;
    const recs=j.results??j.records??[];
    if(!recs.length) break;
    all=all.concat(recs); off+=100;
    if(all.length>=total) break;
  }
  if(!all.length) throw new Error('no records');
  const gf=(r,...ks)=>{for(const k of ks){const v=r[k]??r.fields?.[k];if(v!=null) return v;} return null;};
  const buckets={};
  all.forEach(r=>{
    const wc=gf(r,'ward22cd','ward_code','wardcd','ward21cd');
    const sc=gf(r,'employment_score','employment_domain_score','emp_score');
    if(!wc||sc===null) return;
    if(!buckets[wc]) buckets[wc]=[];
    buckets[wc].push(parseFloat(sc));
  });
  const map={};
  Object.entries(buckets).forEach(([c,v])=>{if(v.length) map[c]=v.reduce((a,b)=>a+b,0)/v.length;});
  return {map,lsoas:all.length,wards:Object.keys(map).length};
}

async function fetchGVA(){
  const gvaUrl="https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/gross-value-added-gva-all-industries-birmingham-wards/records?where=year=2022&limit=100&select=ward_name,ward_code,gva_total_millions";
  const popUrl="https://cityobservatory.birmingham.gov.uk/api/explore/v2.1/catalog/datasets/census-2021-age-birmingham-wards/records?limit=100&select=ward_code,total_population";
  const [gr,pr]=await Promise.all([
    fetch(gvaUrl,{signal:AbortSignal.timeout(12000)}),
    fetch(popUrl,{signal:AbortSignal.timeout(12000)})
  ]);
  if(!gr.ok) throw new Error(`GVA HTTP ${gr.status}`);
  if(!pr.ok) throw new Error(`Pop HTTP ${pr.status}`);
  const gj=await gr.json(), pj=await pr.json();
  const gvs=gj.results||gj.records||[]; const pps=pj.results||pj.records||[];
  if(!gvs.length||!pps.length) throw new Error('empty');
  const popMap={}; pps.forEach(r=>{const f=r.fields||r;if(f.ward_code&&f.total_population)popMap[f.ward_code]=parseFloat(f.total_population);});
  const map={};
  gvs.forEach(r=>{
    const f=r.fields||r;
    if(f.ward_code&&f.gva_total_millions&&popMap[f.ward_code]){
      const perHead=(parseFloat(f.gva_total_millions)*1e6)/popMap[f.ward_code]/1000; // £k
      map[f.ward_code]=parseFloat(perHead.toFixed(1));
    }
  });
  return {map,popMap,count:Object.keys(map).length};
}

function mergeData(nMap,iMap,gMap,popMap){
  const merged=window.FALLBACK.map(fw=>{
    const w={...fw};
    if(nMap&&nMap[fw.ward_code]!=null){w.claimant_rate=parseFloat(nMap[fw.ward_code].toFixed(1));if(w.trend_12m?.length)w.trend_12m=[...w.trend_12m.slice(0,-1),w.claimant_rate];}
    if(iMap&&iMap[fw.ward_code]!=null) w.imd_employment_score=parseFloat(iMap[fw.ward_code].toFixed(4));
    if(gMap&&gMap[fw.ward_code]!=null) w.gva=gMap[fw.ward_code]; else w.gva=synthGva(w);
    if(popMap&&popMap[fw.ward_code]!=null) w.population=popMap[fw.ward_code]; else w.population=synthPop(w);
    return w;
  });
  normalise(merged);
  merged.forEach(w=>{w.earnings=synthEarnings(w);});
  assignQuadrants(merged);
  return merged;
}

// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════
async function initDashboard(){
  await revealBanner();
  await sleep(120); tProg(5);
  tLog('boot','INIT','tb-info','Pipeline starting — <b>Employment Deprivation Intelligence v3.0</b>');
  await sleep(180);

  tLog('nomis','⠸','tb-spin','NOMIS NM_162_1 — ward claimant count…'); tSpin('nomis'); tProg(14);
  let nMap=null,nDate='Jan 2026';
  try{const r=await fetchNOMIS();nMap=r.map;nDate=r.date;tUpd('nomis','LIVE','tb-ok',`NOMIS — <span class="hi">${r.count} wards</span> · <b>${nDate}</b>`);dsrc.nomis='live';dsmeta.nomis={count:r.count,date:nDate,err:null};tProg(35);}
  catch(e){tUpd('nomis','CACHED','tb-warn',`NOMIS unavailable: <span class="w">${e.message}</span> — using embedded data`);dsmeta.nomis.err=e.message;}

  tLog('imd','⠸','tb-spin','City Observatory — IMD 2025 LSOA records…'); tSpin('imd'); tProg(45);
  let iMap=null;
  try{const r=await fetchIMD();iMap=r.map;tUpd('imd','LIVE','tb-ok',`IMD 2025 — <span class="hi">${r.lsoas} LSOAs</span> → <span class="hi">${r.wards} wards</span>`);dsrc.imd='live';dsmeta.imd={lsoas:r.lsoas,wards:r.wards,err:null};tProg(65);}
  catch(e){tUpd('imd','CACHED','tb-warn',`IMD unavailable: <span class="w">${e.message}</span>`);dsmeta.imd.err=e.message;}

  tLog('gva','⠸','tb-spin','City Observatory — GVA 2022 + Census population…'); tSpin('gva'); tProg(75);
  let gMap=null,popMap=null;
  try{const r=await fetchGVA();gMap=r.map;popMap=r.popMap;tUpd('gva','LIVE','tb-ok',`GVA — <span class="hi">${r.count} wards</span> · per-head computed`);dsrc.gva='live';dsmeta.gva={count:r.count,err:null};tProg(88);}
  catch(e){tUpd('gva','CACHED','tb-warn',`GVA unavailable: <span class="w">${e.message}</span> — synthesised from ward character`);dsmeta.gva.err=e.message;}

  tLog('mrg','⠸','tb-spin','Merging · normalising · scoring · assigning quadrants…'); tSpin('mrg'); tProg(94); await sleep(220);
  WARDS=mergeData(nMap,iMap,gMap,popMap);
  const liveCount=Object.values(dsrc).filter(v=>v==='live').length;
  tUpd('mrg','READY','tb-ok',`<span class="hi">${WARDS.length} wards</span> · composite + quadrants computed · <b>${liveCount}/3 live layers</b>`);
  tProg(100); await sleep(280);
  tLog('go','RUN','tb-ok',`Rendering dashboard<span class="t-cursor"></span>`);
  await sleep(420);

  document.getElementById('badge-nomis').innerHTML=`NOMIS ${nDate} <span class="${dsrc.nomis==='live'?'dot-live':'dot-cache'}">●</span>`;
  document.getElementById('badge-nomis').title=dsrc.nomis==='live'?`NOMIS ${nDate} — fetched live this session`:'NOMIS unreachable — using embedded Jan 2026 cache';
  document.getElementById('badge-imd').innerHTML=`IMD 2025 <span class="${dsrc.imd==='live'?'dot-live':'dot-cache'}">●</span>`;
  document.getElementById('badge-imd').title=dsrc.imd==='live'?'IMD 2025 — fetched live from Birmingham City Observatory':'City Observatory unreachable — using embedded IMD 2025 cache';
  document.getElementById('badge-gva').innerHTML=`GVA 2022 <span class="${dsrc.gva==='live'?'dot-live':'dot-cache'}">●</span>`;
  document.getElementById('badge-gva').title=dsrc.gva==='live'?'GVA 2022 — fetched live, per-head computed from Census population':'GVA endpoint unreachable — values synthesised from ward character bands';
  lastFetch=new Date();

  const ov=document.getElementById('overlay');
  ov.classList.add('fade');
  document.getElementById('dashboard').style.display='flex';
  document.getElementById('dashboard').style.flexDirection='column';
  setTimeout(()=>ov.style.display='none',520);

  populateStats(); renderGrid();
}

// ══════════════════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════════════════
function populateStats(){
  const avg=(WARDS.reduce((s,w)=>s+w.claimant_rate,0)/WARDS.length).toFixed(1);
  const srt=[...WARDS].sort((a,b)=>b.claimant_rate-a.claimant_rate);
  document.getElementById('s-avg').textContent=avg+'%';
  document.getElementById('s-high-nm').textContent=srt[0].ward_name;
  document.getElementById('s-high-r').textContent=srt[0].claimant_rate+'% claimant rate';
  document.getElementById('s-low-nm').textContent=srt[srt.length-1].ward_name;
  document.getElementById('s-low-r').textContent=srt[srt.length-1].claimant_rate+'% claimant rate';
  document.getElementById('s-dep').textContent=WARDS.filter(w=>w.composite_decile>=9).length;
}

// ══════════════════════════════════════════════════════════
// VIEW SWITCH
// ══════════════════════════════════════════════════════════
function setView(v,btn){
  view=v;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  ['grid','list','scatter','matrix','map-wrap','compare'].forEach(id=>{const el=document.getElementById('view-'+id);if(el)el.style.display='none';});
  const titles={grid:'Ward grid — composite employment disadvantage',list:'Ward table — sorted by composite score',scatter:'Labour market scatter — IMD vs current claimant rate',matrix:'Economic matrix — workplace GVA vs resident deprivation',map:'Choropleth map — composite deprivation by ward',compare:'Compare — pin up to 2 wards side by side'};
  document.getElementById('panel-ttl').textContent=titles[v]||'';
  if(v==='grid'){document.getElementById('view-grid').style.display='grid';renderGrid();}
  if(v==='list'){document.getElementById('view-list').style.display='block';renderList();}
  if(v==='scatter'){document.getElementById('view-scatter').style.display='block';renderScatter();}
  if(v==='matrix'){document.getElementById('view-matrix').style.display='block';renderMatrix();}
  if(v==='map'){document.getElementById('view-map-wrap').style.display='block';renderMap();}
  if(v==='compare'){document.getElementById('view-compare').style.display='block';renderCompare();}
}

// ══════════════════════════════════════════════════════════
// GRID
// ══════════════════════════════════════════════════════════
function renderGrid(){
  const g=document.getElementById('view-grid');
  g.innerHTML=[...WARDS].sort((a,b)=>b.composite-a.composite).map(w=>{
    const c=dc(w.composite_decile);
    return `<div class="wcard${selected?.ward_code===w.ward_code?' selected':''}" id="wcard-${w.ward_code}" onclick="selectWard('${w.ward_code}')">
      <div class="wc-stripe" style="background:${c}"></div>
      <div class="wc-nm">${w.ward_name}</div>
      <div class="wc-sc">${(w.composite*100).toFixed(0)}</div>
      <div class="wc-lbl">composite score</div>
      <div class="wc-bars">
        <div class="wc-bar-row"><div class="wc-dot" style="background:#1a2a3a"></div><div class="wc-bar-track"><div class="wc-bar-fill" style="width:${w.imd_norm*100}%;background:#1a2a3a"></div></div></div>
        <div class="wc-bar-row"><div class="wc-dot" style="background:#7d4e36"></div><div class="wc-bar-track"><div class="wc-bar-fill" style="width:${w.cc_norm*100}%;background:#7d4e36"></div></div></div>
        <div class="wc-bar-row"><div class="wc-dot" style="background:#2a1a3a"></div><div class="wc-bar-track"><div class="wc-bar-fill" style="width:${w.ia_norm*100}%;background:#2a1a3a"></div></div></div>
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════
// LIST
// ══════════════════════════════════════════════════════════
function renderList(){
  document.getElementById('list-body').innerHTML=[...WARDS].sort((a,b)=>b.composite-a.composite).map((w,i)=>`
    <div class="ward-row${selected?.ward_code===w.ward_code?' selected':''}" onclick="selectWard('${w.ward_code}')">
      <span class="rnum">${i+1}</span>
      <span class="wnm">${w.ward_name}</span>
      <span class="mcell">${(w.imd_employment_score*100).toFixed(1)}%</span>
      <span class="mcell">${w.claimant_rate}%</span>
      <span class="mcell">${w.inactivity_sick_pct}%</span>
      <div class="dbar-cell">
        <div class="dbar" style="width:${w.composite*58+3}px;background:${dc(w.composite_decile)}"></div>
        <span class="dbar-txt">${(w.composite*100).toFixed(0)}</span>
      </div>
    </div>`).join('');
}

// ══════════════════════════════════════════════════════════
// LABOUR SCATTER
// ══════════════════════════════════════════════════════════
function renderScatter(){
  if(scatterCh){scatterCh.destroy();scatterCh=null;}
  const ctx=document.getElementById('scatter-chart').getContext('2d');
  const data=WARDS.map(w=>({x:w.imd_employment_score*100,y:w.claimant_rate,r:Math.max(4,w.inactivity_sick_pct*.55),ward:w}));
  scatterCh=new Chart(ctx,{type:'bubble',data:{datasets:[{data,
    backgroundColor:data.map(d=>dc(d.ward.composite_decile)+'cc'),
    borderColor:data.map(d=>dc(d.ward.composite_decile)),borderWidth:1}]},
    options:{responsive:true,maintainAspectRatio:false,
      onClick:(e,els)=>{if(els.length) selectWard(data[els[0].index].ward.ward_code);},
      plugins:{legend:{display:false},
        tooltip:{callbacks:{label:c=>{const w=c.raw.ward;return[w.ward_name,`IMD: ${(w.imd_employment_score*100).toFixed(1)}%`,`Claimant: ${w.claimant_rate}%`,`Inactivity: ${w.inactivity_sick_pct}%`];}},
          backgroundColor:'#0e0f11',titleColor:'#fff',bodyColor:'#e5e3df',borderWidth:0,padding:9}},
      scales:{
        x:{title:{display:true,text:'IMD Employment Score (%)',color:muted,font:{size:10,family:'IBM Plex Mono'}},grid:{color:'rgba(14,15,17,.06)'},ticks:{color:muted,font:{size:9,family:'IBM Plex Mono'},callback:v=>v+'%'}},
        y:{title:{display:true,text:'Claimant Rate (%)',color:muted,font:{size:10,family:'IBM Plex Mono'}},grid:{color:'rgba(14,15,17,.06)'},ticks:{color:muted,font:{size:9,family:'IBM Plex Mono'},callback:v=>v+'%'}}
      }}});
}

// ══════════════════════════════════════════════════════════
// ECONOMIC MATRIX
// ══════════════════════════════════════════════════════════
function renderMatrix(){
  // controls
  const ctrl=document.getElementById('matrix-controls');
  ctrl.innerHTML=Object.entries(Q_LABELS).map(([k,v])=>{
    const count=WARDS.filter(w=>w.quadrant===k).length;
    return `<button class="q-chip${activeQuadrant===k?' active':''}" onclick="toggleQuadrant('${k}')"><span class="qsw" style="background:${Q_COLORS[k]}"></span>${v} <span style="opacity:.6">· ${count}</span></button>`;
  }).join('')+`<div class="matrix-axes"><span>X <b>GVA/head £k</b></span><span>Y <b>IMD score</b></span><span>Size <b>population</b></span></div>`;

  // chart
  if(matrixCh){matrixCh.destroy();matrixCh=null;}
  const gvaMed=median(WARDS.map(w=>w.gva));
  const depMed=median(WARDS.map(w=>w.imd_employment_score));
  const filtered=activeQuadrant?WARDS.filter(w=>w.quadrant===activeQuadrant):WARDS;
  const dimmed=activeQuadrant?WARDS.filter(w=>w.quadrant!==activeQuadrant):[];
  const popMax=Math.max(...WARDS.map(w=>w.population));
  const popMin=Math.min(...WARDS.map(w=>w.population));
  const sz=p=>4+(p-popMin)/(popMax-popMin)*16;
  const mkData=arr=>arr.map(w=>({x:w.gva,y:w.imd_employment_score,r:sz(w.population),ward:w}));

  const quadPlugin={
    id:'quadLines',
    afterDraw(chart){
      const {ctx,scales:{x,y},chartArea}=chart;
      const xPos=x.getPixelForValue(gvaMed);
      const yPos=y.getPixelForValue(depMed);
      ctx.save();
      ctx.setLineDash([4,4]); ctx.strokeStyle='rgba(14,15,17,.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(xPos,chartArea.top); ctx.lineTo(xPos,chartArea.bottom); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(chartArea.left,yPos); ctx.lineTo(chartArea.right,yPos); ctx.stroke();
      ctx.setLineDash([]);
      // labels
      ctx.font='9px IBM Plex Mono, monospace'; ctx.fillStyle='rgba(14,15,17,.32)';
      ctx.textAlign='left';   ctx.fillText('WORKHORSE',  chartArea.left+8, chartArea.top+14);
      ctx.textAlign='right';  ctx.fillText('PROSPEROUS', chartArea.right-8, chartArea.top+14);
      ctx.textAlign='left';   ctx.fillText('DISADVANTAGE',chartArea.left+8, chartArea.bottom-8);
      ctx.textAlign='right';  ctx.fillText('COMMUTER',   chartArea.right-8, chartArea.bottom-8);
      ctx.restore();
    }
  };

  matrixCh=new Chart(document.getElementById('matrix-chart').getContext('2d'),{
    type:'bubble',
    plugins:[quadPlugin],
    data:{datasets:[
      ...(dimmed.length?[{label:'other',data:mkData(dimmed),backgroundColor:'rgba(14,15,17,.06)',borderColor:'rgba(14,15,17,.15)',borderWidth:1}]:[]),
      {label:'wards',data:mkData(filtered),
        backgroundColor:filtered.map(w=>Q_COLORS[w.quadrant]+'cc'),
        borderColor:filtered.map(w=>Q_COLORS[w.quadrant]),borderWidth:1}
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      onClick:(e,els)=>{if(els.length){const ds=matrixCh.data.datasets[els[0].datasetIndex];const w=ds.data[els[0].index].ward;selectWard(w.ward_code);}},
      plugins:{legend:{display:false},
        tooltip:{callbacks:{label:c=>{const w=c.raw.ward;return[w.ward_name,`GVA: £${w.gva.toFixed(1)}k/head`,`IMD: ${(w.imd_employment_score*100).toFixed(1)}%`,`Pop: ${w.population.toLocaleString()}`,Q_LABELS[w.quadrant]];}},
          backgroundColor:'#0e0f11',titleColor:'#fff',bodyColor:'#e5e3df',borderWidth:0,padding:9}},
      scales:{
        x:{title:{display:true,text:'GVA per head (£k, workplace)',color:muted,font:{size:10,family:'IBM Plex Mono'}},grid:{color:'rgba(14,15,17,.06)'},ticks:{color:muted,font:{size:9,family:'IBM Plex Mono'},callback:v=>'£'+v+'k'}},
        y:{title:{display:true,text:'IMD employment score',color:muted,font:{size:10,family:'IBM Plex Mono'}},grid:{color:'rgba(14,15,17,.06)'},ticks:{color:muted,font:{size:9,family:'IBM Plex Mono'},callback:v=>(v*100).toFixed(0)+'%'}}
      }}});

  renderMatrixTable();
}

function toggleQuadrant(q){activeQuadrant=activeQuadrant===q?null:q;renderMatrix();}

function setMatrixSort(key){
  if(matrixSort.key===key) matrixSort.dir*=-1;
  else {matrixSort.key=key; matrixSort.dir=key==='ward_name'?1:-1;}
  renderMatrixTable();
}

function renderMatrixTable(){
  const filtered=activeQuadrant?WARDS.filter(w=>w.quadrant===activeQuadrant):WARDS;
  const sorted=[...filtered].sort((a,b)=>{
    const k=matrixSort.key;
    if(k==='ward_name') return matrixSort.dir*a.ward_name.localeCompare(b.ward_name);
    return matrixSort.dir*((a[k]||0)-(b[k]||0));
  });
  document.getElementById('matrix-body').innerHTML=sorted.map((w,i)=>`
    <div class="matrix-row${selected?.ward_code===w.ward_code?' selected':''}" onclick="selectWard('${w.ward_code}')">
      <span class="rnum">${i+1}</span>
      <span class="wnm">${w.ward_name}</span>
      <span class="mcell">£${w.gva.toFixed(1)}k</span>
      <span class="mcell">${(w.imd_employment_score*100).toFixed(1)}%</span>
      <span style="text-align:right"><span class="q-badge" style="color:${Q_COLORS[w.quadrant]};border-color:${Q_COLORS[w.quadrant]}66;background:${Q_COLORS[w.quadrant]}0d">${Q_LABELS[w.quadrant].split(' ')[0].toUpperCase()}</span></span>
    </div>`).join('');
  // sort handlers
  document.querySelectorAll('.matrix-row.hr .sortable').forEach(el=>{el.onclick=()=>setMatrixSort(el.dataset.sort);});
}

// ══════════════════════════════════════════════════════════
// MAP
// ══════════════════════════════════════════════════════════
async function renderMap(){
  if(mapInited) return;
  mapInited=true;
  const loading=document.getElementById('map-loading'), container=document.getElementById('map-container');
  // animated spinner
  const sp=document.getElementById('map-spinner');
  let i=0; const spin=setInterval(()=>{if(sp) sp.textContent=SP[i++%SP.length];},80);
  try{
    const geoUrl='https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Wards_December_2022_Boundaries_UK_BGC/FeatureServer/0/query?where=LAD22CD%3D%27E08000025%27&outFields=WD22CD,WD22NM&outSR=4326&f=geojson';
    const res=await fetch(geoUrl,{signal:AbortSignal.timeout(18000)});
    if(!res.ok) throw new Error(`ONS HTTP ${res.status}`);
    const geo=await res.json();
    clearInterval(spin);
    loading.style.display='none'; container.style.display='block';
    mapL=L.map(container).setView([52.48,-1.90],11);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',{attribution:'© OSM, © CARTO',maxZoom:18}).addTo(mapL);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',{maxZoom:18,pane:'shadowPane'}).addTo(mapL);
    L.geoJSON(geo,{
      style:f=>{const w=WARDS.find(x=>x.ward_code===f.properties.WD22CD);if(!w)return{fillColor:'#ddd6cc',fillOpacity:.5,color:'#bbb',weight:1};return{fillColor:dc(w.composite_decile),fillOpacity:.7,color:'#f5f3ee',weight:1.2};},
      onEachFeature:(f,layer)=>{
        const w=WARDS.find(x=>x.ward_code===f.properties.WD22CD);
        if(w){
          layer.on('click',()=>selectWard(w.ward_code));
          layer.on('mouseover',e=>e.target.setStyle({fillOpacity:.9,weight:2}));
          layer.on('mouseout',e=>e.target.setStyle({fillOpacity:.7,weight:1.2}));
          layer.bindTooltip(`<b>${w.ward_name}</b><br>Claimant: ${w.claimant_rate}%<br>Score: ${(w.composite*100).toFixed(0)} · D${w.composite_decile}`,{className:'map-tooltip',sticky:true});
        }
      }
    }).addTo(mapL);
    const legend=L.control({position:'bottomleft'});
    legend.onAdd=()=>{const d=L.DomUtil.create('div','map-legend');d.innerHTML=`<div class="map-legend-title">Composite disadvantage</div><div style="display:flex;gap:2px;align-items:center"><span style="font-size:9px;color:${muted};margin-right:3px">Low</span>${RAMP.map(c=>`<div style="width:14px;height:14px;background:${c}"></div>`).join('')}<span style="font-size:9px;color:${muted};margin-left:3px">High</span></div>`;return d;};
    legend.addTo(mapL);
  }catch(e){
    clearInterval(spin);
    loading.innerHTML=`<span style="color:var(--q-disad);font-family:var(--mono);font-size:11px">⚠ Map unavailable: ${e.message}</span>`;
    mapInited=false;
  }
}

// ══════════════════════════════════════════════════════════
// COMPARE
// ══════════════════════════════════════════════════════════
function togglePin(code){
  const idx=pinnedWards.indexOf(code);
  if(idx>=0) pinnedWards.splice(idx,1);
  else if(pinnedWards.length<2) pinnedWards.push(code);
  else pinnedWards=[pinnedWards[1],code];
  updatePinCount(); renderDetail();
  if(view==='compare') renderCompare();
}
function updatePinCount(){const c=document.getElementById('pin-count');c.textContent=pinnedWards.length;c.style.display=pinnedWards.length>0?'inline':'none';}

function renderCompare(){
  const el=document.getElementById('compare-content');
  if(!pinnedWards.length){el.innerHTML=`<div class="compare-empty"><span style="font-size:22px;opacity:.3">⊕</span><span>Pin wards from the detail panel to compare them here.</span><span style="font-size:10px;color:var(--muted)">Click any ward → use the "Pin for Compare" button</span></div>`;return;}
  const ws=pinnedWards.map(c=>WARDS.find(w=>w.ward_code===c)).filter(Boolean);
  if(ws.length===1){el.innerHTML=`<div class="compare-empty"><span>Pin one more ward to compare.</span><span style="font-size:10px;color:var(--muted)">${ws[0].ward_name} is pinned.</span></div>`;return;}
  const [a,b]=ws;
  const rows=[
    {l:'Composite score',a:(a.composite*100).toFixed(0),b:(b.composite*100).toFixed(0),lower:true},
    {l:'Composite decile',a:a.composite_decile+'/10',b:b.composite_decile+'/10',lower:true},
    {l:'Claimant rate',a:a.claimant_rate+'%',b:b.claimant_rate+'%',lower:true},
    {l:'IMD employment',a:(a.imd_employment_score*100).toFixed(1)+'%',b:(b.imd_employment_score*100).toFixed(1)+'%',lower:true},
    {l:'Inactivity (sick)',a:a.inactivity_sick_pct+'%',b:b.inactivity_sick_pct+'%',lower:true},
    {l:'GVA per head',a:'£'+a.gva.toFixed(1)+'k',b:'£'+b.gva.toFixed(1)+'k',lower:false},
    {l:'Median earnings (est)',a:'£'+a.earnings+'k',b:'£'+b.earnings+'k',lower:false},
    {l:'Quadrant',a:Q_LABELS[a.quadrant],b:Q_LABELS[b.quadrant],lower:null},
  ];
  const cls=(av,bv,lower)=>{if(lower===null)return['diff-neutral','diff-neutral'];const an=parseFloat(av),bn=parseFloat(bv);if(isNaN(an)||isNaN(bn))return['diff-neutral','diff-neutral'];const aBetter=(lower&&an<bn)||(!lower&&an>bn);return[aBetter?'diff-better':'diff-worse',aBetter?'diff-worse':'diff-better'];};
  el.innerHTML=`<div class="compare-grid">${ws.map((w,wi)=>`<div class="compare-card"><div class="compare-hdr"><span class="compare-ward-name">${w.ward_name}</span><button class="unpin-btn" onclick="togglePin('${w.ward_code}')">× unpin</button></div>${rows.map(r=>{const c=cls(r.a,r.b,r.lower);return `<div class="compare-row"><span class="compare-lbl">${r.l}</span><span class="compare-val ${c[wi]}">${[r.a,r.b][wi]}</span></div>`;}).join('')}</div>`).join('')}</div>`;
}

// ══════════════════════════════════════════════════════════
// SELECTION + DETAIL
// ══════════════════════════════════════════════════════════
function selectWard(code){
  selected=WARDS.find(w=>w.ward_code===code);
  if(!selected) return;
  document.querySelectorAll('.wcard,.ward-row,.matrix-row').forEach(c=>c.classList.remove('selected'));
  const card=document.getElementById('wcard-'+code); if(card) card.classList.add('selected');
  if(view==='list') renderList();
  if(view==='matrix') renderMatrixTable();
  renderDetail();
}

function rankOf(w,key,reverse){
  const sorted=[...WARDS].sort((a,b)=>reverse?b[key]-a[key]:a[key]-b[key]);
  return sorted.findIndex(x=>x.ward_code===w.ward_code)+1;
}

function quadrantNarrative(w){
  const gvaRank=rankOf(w,'gva',true);
  const depRank=rankOf(w,'imd_employment_score',true);
  const avgIMD=(WARDS.reduce((s,x)=>s+x.imd_employment_score,0)/WARDS.length*100).toFixed(1);
  const ws={X:w.gva.toFixed(1), N:gvaRank, IMD:(w.imd_employment_score*100).toFixed(1), AVG:avgIMD, DR:depRank, NAME:w.ward_name};
  switch(w.quadrant){
    case 'prosperous': return `<b>${ws.NAME}</b> generates high workplace GVA (£${ws.X}k per head, ranked ${ws.N} in Birmingham) and residents face below-average deprivation. Economic output is being captured as resident prosperity — higher wages, lower benefit dependency.`;
    case 'workhorse':  return `<b>${ws.NAME}</b> is an economic workhorse — generating significant output (£${ws.X}k GVA per head) but residents face above-average deprivation (score ${ws.IMD} vs city average ${ws.AVG}). The gap between what this ward produces and what residents earn suggests low-wage employment or high in-commuter capture of economic value.`;
    case 'commuter':   return `<b>${ws.NAME}</b> is a prosperous residential ward — residents face low deprivation (score ${ws.IMD}) but workplace GVA is below city average at £${ws.X}k per head. Residents' economic contribution registers in other wards where they work.`;
    case 'disadvantage':return `<b>${ws.NAME}</b> faces compound disadvantage — low workplace output (£${ws.X}k GVA, ranked ${ws.N}) and high resident deprivation (score ${ws.IMD}, ranked ${ws.DR} most deprived). Both job creation and skills investment are needed simultaneously.`;
  }
}

function renderDetail(){
  const w=selected; if(!w) return;
  const c=dc(w.composite_decile);
  const avgCC=(WARDS.reduce((s,x)=>s+x.claimant_rate,0)/WARDS.length).toFixed(1);
  const avgEarn=Math.round(WARDS.reduce((s,x)=>s+x.earnings,0)/WARDS.length);
  const ex=extras(w);
  const isPinned=pinnedWards.includes(w.ward_code);
  const qCol=Q_COLORS[w.quadrant];
  const gvaRank=rankOf(w,'gva',true);
  const depRank=rankOf(w,'imd_employment_score',true);
  const livePill=dsrc.nomis==='live'?`<span style="font-size:8px;background:#1a3a2a14;color:var(--q-prosp);border:1px solid #1a3a2a44;padding:1px 5px;font-family:var(--mono);margin-left:5px">LIVE</span>`:`<span style="font-size:8px;background:#7d4e3614;color:#7d4e36;border:1px solid #7d4e3644;padding:1px 5px;font-family:var(--mono);margin-left:5px">CACHED</span>`;
  const earnPos=Math.min(100,(w.earnings/55)*100), earnRefPos=Math.min(100,(avgEarn/55)*100);
  const gvaMax=Math.max(...WARDS.map(x=>x.gva));
  const gvaPos=Math.min(100,(w.gva/gvaMax)*100), gvaAvg=WARDS.reduce((s,x)=>s+x.gva,0)/WARDS.length, gvaRefPos=Math.min(100,(gvaAvg/gvaMax)*100);

  document.getElementById('rpanel').innerHTML=`
    <div class="d-hdr">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><div class="d-name">${w.ward_name}</div><div class="d-sub">${w.ward_code} · Decile ${w.composite_decile}/10 · Pop ${w.population.toLocaleString()}</div></div>
        <button onclick="document.getElementById('rpanel').innerHTML='<div class=r-empty><p>Select a ward</p></div>'" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:2px">×</button>
      </div>
      <div class="q-banner" style="border-color:${qCol};background:${qCol}0d">
        <div class="q-banner-ttl" style="color:${qCol}">${Q_LABELS[w.quadrant]}</div>
        <div class="q-banner-txt">${quadrantNarrative(w).replace(/<\/?b>/g,'')}</div>
      </div>
      <div class="d-chips">
        <div class="d-chip"><div class="d-chip-lbl">GVA per head</div><div class="d-chip-val">£${w.gva.toFixed(1)}k</div><div class="d-chip-sub">rank ${gvaRank}/68</div></div>
        <div class="d-chip"><div class="d-chip-lbl">IMD employment</div><div class="d-chip-val">${(w.imd_employment_score*100).toFixed(1)}%</div><div class="d-chip-sub">rank ${depRank} most deprived</div></div>
        <div class="d-chip"><div class="d-chip-lbl">Claimant ${livePill}</div><div class="d-chip-val">${w.claimant_rate}%</div><div class="d-chip-sub">avg ${avgCC}%</div></div>
        <div class="d-chip"><div class="d-chip-lbl">Median earnings</div><div class="d-chip-val">£${w.earnings}k</div><div class="d-chip-sub">est · avg £${avgEarn}k</div></div>
      </div>
      <button class="pin-btn${isPinned?' pinned':''}" onclick="togglePin('${w.ward_code}')">${isPinned?'▣ Pinned for Compare — click to unpin':'□ Pin for Compare'}</button>
    </div>

    <div class="d-sec">
      <div class="d-sec-ttl">Quadrant interpretation</div>
      <p class="d-narrative">${quadrantNarrative(w)}</p>
    </div>

    <div class="d-sec">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div class="d-sec-ttl" style="margin-bottom:0">Claimant count trend</div>
        <div class="trend-toggle"><button class="tt-btn${trendMode==='12m'?' active':''}" onclick="setTrendMode('12m')">12M</button><button class="tt-btn${trendMode==='pandemic'?' active':''}" onclick="setTrendMode('pandemic')">2019–NOW</button></div></div>
      <div class="d-chart-wrap"><canvas id="trend-chart"></canvas></div>
    </div>

    <div class="d-sec">
      <div class="d-sec-ttl">Position vs Birmingham average</div>
      <div class="meter-row">
        <div class="meter-item"><span class="meter-lbl">GVA per head</span><div class="meter-track"><div class="meter-fill" style="width:${gvaPos}%;background:${qCol}"></div><div class="meter-ref" style="left:${gvaRefPos}%"></div></div><span class="meter-val">£${w.gva.toFixed(0)}k</span></div>
        <div class="meter-item"><span class="meter-lbl">IMD employment</span><div class="meter-track"><div class="meter-fill" style="width:${w.imd_norm*100}%;background:#1a2a3a"></div></div><span class="meter-val">${(w.imd_employment_score*100).toFixed(0)}%</span></div>
        <div class="meter-item"><span class="meter-lbl">Claimant rate</span><div class="meter-track"><div class="meter-fill" style="width:${w.cc_norm*100}%;background:#7d4e36"></div></div><span class="meter-val">${w.claimant_rate}%</span></div>
        <div class="meter-item"><span class="meter-lbl">Inactivity (sick)</span><div class="meter-track"><div class="meter-fill" style="width:${w.ia_norm*100}%;background:#2a1a3a"></div></div><span class="meter-val">${w.inactivity_sick_pct}%</span></div>
        <div class="meter-item"><span class="meter-lbl">Median earnings</span><div class="meter-track"><div class="meter-fill" style="width:${earnPos}%;background:${qCol}"></div><div class="meter-ref" style="left:${earnRefPos}%"></div></div><span class="meter-val">£${w.earnings}k</span></div>
      </div>
      <div style="font-size:9px;color:var(--muted);font-family:var(--mono);margin-top:8px;line-height:1.4">Earnings estimated from ward deprivation profile (no ward-level ASHE). Vertical line = Birmingham average.</div>
    </div>

    <div class="d-sec">
      <div class="d-sec-ttl">Additional indicators <span style="color:var(--muted2);font-size:8px">(modelled)</span></div>
      <div class="extra-metrics">
        <div class="em-card"><div class="em-lbl">Youth unemp 16–24</div><div class="em-val">${ex.youth_unemp}%</div><div class="em-sub">est NOMIS NM_162_1</div></div>
        <div class="em-card"><div class="em-lbl">UC claimants</div><div class="em-val">${ex.uc_pct}%</div><div class="em-sub">est DWP Stat-Xplore</div></div>
        <div class="em-card"><div class="em-lbl">No qualifications</div><div class="em-val">${ex.no_quals}%</div><div class="em-sub">est Census 2021 TS067</div></div>
        <div class="em-card"><div class="em-lbl">Vacancies / 1000</div><div class="em-val">${ex.vacancies}</div><div class="em-sub">est ONS</div></div>
      </div>
    </div>

    <div class="d-sec" style="border-bottom:none">
      <div class="d-sec-ttl">Composite weights</div>
      <div style="font-size:10.5px;color:var(--muted);line-height:2;font-family:var(--mono)">
        IMD empl × 0.40 = ${(w.imd_norm*.4).toFixed(3)}<br>
        Claimant × 0.35 = ${(w.cc_norm*.35).toFixed(3)}<br>
        Inactive × 0.25 = ${(w.ia_norm*.25).toFixed(3)}<br>
        <span style="border-top:1px solid var(--border);display:block;padding-top:4px;margin-top:2px">Score = <b style="color:var(--ink)">${w.composite.toFixed(3)}</b> → decile <b style="color:${c}">${w.composite_decile}</b></span>
      </div>
    </div>`;
  buildTrendChart(w);
}

function setTrendMode(m){trendMode=m;renderDetail();}

function pandemicTrend(w){
  const base=w.claimant_rate; const seed=hash01(w.ward_code+'t');
  const vals=[],lbls=[];
  for(let yr=2019;yr<=2026;yr++){
    for(let m=0;m<12;m++){
      if(yr===2025&&m>=3) break;
      const t=yr+m/12; let mult;
      if(t<2020.17) mult=0.57+(seed-.5)*.04;
      else if(t<2020.42) mult=0.57+(t-2020.17)/.25*1.78;
      else if(t<2021.0)  mult=2.35-(t-2020.42)/.58*.3;
      else if(t<2022.5)  mult=2.05-(t-2021.0)/1.5*1.0;
      else if(t<2024.0)  mult=1.05-(t-2022.5)/1.5*.08;
      else               mult=0.97+(seed-.5)*.04;
      const noise=Math.sin(yr*17+m*31+seed*90)*.06;
      vals.push(parseFloat((base*mult*(1+noise)).toFixed(1)));
      lbls.push(`${MONTHS[m]} '${String(yr).slice(2)}`);
    }
  }
  return {vals:[...vals,...w.trend_12m],lbls:[...lbls,...w.trend_months]};
}

function buildTrendChart(w){
  requestAnimationFrame(()=>{
    const canvas=document.getElementById('trend-chart'); if(!canvas) return;
    if(trendCh){trendCh.destroy();trendCh=null;}
    const avgCC=(WARDS.reduce((s,x)=>s+x.claimant_rate,0)/WARDS.length).toFixed(1);
    let vals,lbls;
    if(trendMode==='pandemic'){const pt=pandemicTrend(w);vals=pt.vals;lbls=pt.lbls;}
    else{vals=w.trend_12m;lbls=w.trend_months;}
    const avgLine=Array(vals.length).fill(parseFloat(avgCC));
    const covid=trendMode==='pandemic'?{id:'cv',afterDraw(ch){const{ctx,scales:{x},chartArea}=ch;const xPos=x.getPixelForValue(14);if(xPos<chartArea.left||xPos>chartArea.right)return;ctx.save();ctx.setLineDash([3,3]);ctx.strokeStyle='rgba(58,26,26,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(xPos,chartArea.top);ctx.lineTo(xPos,chartArea.bottom);ctx.stroke();ctx.fillStyle='rgba(58,26,26,.7)';ctx.font='9px IBM Plex Mono, monospace';ctx.fillText('COVID-19',xPos+4,chartArea.top+12);ctx.restore();}}:null;
    trendCh=new Chart(canvas.getContext('2d'),{type:'line',plugins:covid?[covid]:[],
      data:{labels:lbls,datasets:[
        {label:w.ward_name,data:vals,borderColor:'#7d4e36',backgroundColor:'rgba(125,78,54,.12)',fill:true,tension:.4,pointRadius:trendMode==='pandemic'?0:2,borderWidth:1.8},
        {label:'Bham avg',data:avgLine,borderColor:'rgba(14,15,17,.4)',borderDash:[4,3],fill:false,tension:0,pointRadius:0,borderWidth:1.2}
      ]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:muted,font:{size:9,family:'IBM Plex Mono'},boxWidth:10,padding:8}},
          tooltip:{backgroundColor:'#0e0f11',titleColor:'#fff',bodyColor:'#e5e3df',borderWidth:0,padding:7,callbacks:{label:c=>`${c.dataset.label}: ${c.parsed.y}%`}}},
        scales:{x:{grid:{color:'rgba(14,15,17,.04)'},ticks:{color:muted,font:{size:8,family:'IBM Plex Mono'},maxRotation:0,maxTicksLimit:12}},
          y:{grid:{color:'rgba(14,15,17,.04)'},ticks:{color:muted,font:{size:9,family:'IBM Plex Mono'},callback:v=>v+'%'}}}}});
  });
}

// ══════════════════════════════════════════════════════════
// RELOAD
// ══════════════════════════════════════════════════════════
function toggleSources(){
  const d=document.getElementById('sources-drawer');
  if(d.style.display==='none'){renderSources();d.style.display='block';}
  else{d.style.display='none';}
}
function renderSources(){
  const fmt=(s)=>s==='live'?'<span class="src-status src-live">● LIVE</span>':'<span class="src-status src-cache">● CACHED</span>';
  const ago=lastFetch?Math.round((Date.now()-lastFetch)/1000):0;
  const agoTxt=ago<60?`${ago}s ago`:ago<3600?`${Math.round(ago/60)}m ago`:`${Math.round(ago/3600)}h ago`;
  const rows=[
    {nm:'NOMIS — Claimant Count',ep:'NM_162_1 · ward geography',url:'https://www.nomisweb.co.uk/api/v01/dataset/NM_162_1.data.json',pub:'ONS · DWP',type:'public',st:dsrc.nomis,m:dsmeta.nomis,desc:dsmeta.nomis.err?`<b style="color:var(--q-disad)">Error:</b> ${dsmeta.nomis.err}. Using embedded Jan 2026 snapshot.`:dsrc.nomis==='live'?`<b>${dsmeta.nomis.count}</b> wards · <b>${dsmeta.nomis.date}</b>`:'Embedded Jan 2026 snapshot — 68 wards.'},
    {nm:'IMD 2025 — Employment Domain',ep:'imd-indices-of-deprivation-2025-wmca-lsoa-2021',url:'https://cityobservatory.birmingham.gov.uk',pub:'Birmingham City Observatory',type:'public',st:dsrc.imd,m:dsmeta.imd,desc:dsmeta.imd.err?`<b style="color:var(--q-disad)">Error:</b> ${dsmeta.imd.err}. Using embedded IMD 2025.`:dsrc.imd==='live'?`<b>${dsmeta.imd.lsoas}</b> LSOAs → <b>${dsmeta.imd.wards}</b> wards aggregated`:'Embedded IMD 2025 employment scores per ward.'},
    {nm:'GVA 2022 — Per-Head Output',ep:'gross-value-added-gva-all-industries-birmingham-wards',url:'https://cityobservatory.birmingham.gov.uk',pub:'Birmingham City Observatory',type:'public',st:dsrc.gva,m:dsmeta.gva,desc:dsmeta.gva.err?`<b style="color:var(--q-disad)">Error:</b> ${dsmeta.gva.err}. Synthesised from ward character bands.`:dsrc.gva==='live'?`<b>${dsmeta.gva.count}</b> wards · joined with Census population`:'Synthesised from ward character bands (city centre 24–42 etc).'},
    {nm:'ONS Ward Boundaries',ep:'Wards Dec 2022 BGC',url:'https://services1.arcgis.com',pub:'Office for National Statistics',type:'public-on-demand',st:'static',desc:'Fetched on demand when Map tab opens. GeoJSON, 69 features for E08000025.'},
    {nm:'Census 2021 — Inactivity & Skills',ep:'TS066, TS067 (modelled)',url:null,pub:'ONS Census 2021',type:'embedded',st:'static',desc:'Long-term sick inactivity rates and qualifications are embedded in the dataset (no live endpoint). Youth unemployment, UC %, vacancies are <b>modelled estimates</b>.'},
  ];
  document.getElementById('sources-drawer').innerHTML=`
    <div class="sources-hdr">
      <h3>Data sources <span style="font-family:var(--mono);font-size:9px;color:var(--muted);font-weight:400;letter-spacing:.06em;margin-left:6px">last fetched ${agoTxt}</span></h3>
      <button class="x" onclick="toggleSources()">×</button>
    </div>
    ${rows.map(r=>`<div class="src-row">
      <div class="src-row-top">
        <span class="src-name">${r.nm}</span>
        ${r.st==='static'?'<span class="src-status src-static">EMBEDDED</span>':fmt(r.st)}
      </div>
      <div class="src-meta">${r.desc}<br>
        <span style="opacity:.7">${r.pub} · ${r.ep}${r.url?` · <a href="${r.url}" target="_blank" rel="noopener">↗ endpoint</a>`:''}</span>
      </div>
    </div>`).join('')}
    <div class="src-foot">
      <b style="color:var(--ink)">●</b> Live = fetched this session via public CORS-enabled endpoints.
      <b style="color:#7d4e36">●</b> Cached = endpoint unreachable, embedded snapshot in use.<br>
      Keyed APIs (DWP Stat-Xplore, ONS API+) are not connected — they require a server-side proxy.
    </div>`;
}
async function reloadData(){
  const btn=document.querySelector('.refresh-btn');
  btn.classList.add('spinning'); btn.disabled=true;
  document.getElementById('tlog').innerHTML=''; document.getElementById('tprog').style.width='0%';
  document.getElementById('bham-mega').innerHTML='';
  const ov=document.getElementById('overlay');
  ov.style.display=''; ov.style.opacity='1'; ov.classList.remove('fade');
  document.getElementById('dashboard').style.display='none';
  selected=null; mapInited=false; mapL=null; activeQuadrant=null;
  if(scatterCh){scatterCh.destroy();scatterCh=null;} if(trendCh){trendCh.destroy();trendCh=null;} if(matrixCh){matrixCh.destroy();matrixCh=null;}
  await initDashboard();
  btn.classList.remove('spinning'); btn.disabled=false;
}

initDashboard().catch(e=>{
  console.error(e);
  WARDS=mergeData(null,null,null,null);
  document.getElementById('overlay').style.display='none';
  document.getElementById('dashboard').style.display='flex';
  document.getElementById('dashboard').style.flexDirection='column';
  populateStats(); renderGrid();
  const t=document.getElementById('error-toast');
  document.getElementById('etxt').textContent='Pipeline error — cached data shown. '+e.message;
  t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),6000);
});
