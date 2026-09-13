(()=>{
'use strict';
let bypass=false,pendingRestore=null,normalizing=false;
const tx=(ko,en)=>{try{return currentLang==='en'?en:ko}catch(_){return ko}};
const LEGACY_WEIGHTS=[50,30,10,4,2,1,1,2];
function activeLevel(){const b=document.querySelector('.arena-level-btn.active');const n=Number(b?.dataset?.level||1);return n>=1&&n<=8?n:1}
function status(msg){const s=document.getElementById('arenaStatus');if(s)s.textContent=msg}
function sumCounts(c){let n=0;for(let i=1;i<=8;i++)n+=Number(c?.[i]||0);return n}
async function dbCounts(){
  try{
    if(window.fetchArenaTicketLevelCounts)return await window.fetchArenaTicketLevelCounts();
    if(!sb||!currentUser)return{};
    const {data}=await sb.from('arena_ticket_levels').select('l1,l2,l3,l4,l5,l6,l7,l8').eq('user_id',currentUser.id).maybeSingle();
    const o={};for(let i=1;i<=8;i++)o[i]=Number(data?.['l'+i]||0);return o;
  }catch(_){return{}}
}
async function totalGenericTickets(){
  try{
    if(typeof getTradeAssets==='function'){
      const a=await getTradeAssets();
      if(a&&a.ticket!=null)return Number(a.ticket||0);
    }
  }catch(_){ }
  try{
    const {data}=await sb.from('wallets').select('ticket').eq('user_id',currentUser.id).maybeSingle();
    return Number(data?.ticket||0);
  }catch(_){return 0}
}
function splitByRatio(total){
  total=Math.max(0,Math.floor(Number(total)||0));
  const raw=LEGACY_WEIGHTS.map(w=>total*w/100);
  const out=raw.map(Math.floor);
  let remain=total-out.reduce((a,b)=>a+b,0);
  const order=raw.map((v,i)=>({i,f:v-Math.floor(v)})).sort((a,b)=>b.f-a.f||a.i-b.i);
  for(let i=0;i<remain;i++)out[order[i].i]++;
  return out;
}
async function normalizeExistingTickets(){
  if(normalizing)return;
  try{
    if(!sb||!currentUser)return;
    normalizing=true;
    const counts=await dbCounts(),total=await totalGenericTickets();
    const missing=Math.max(0,total-sumCounts(counts));
    if(!missing)return;
    const add=splitByRatio(missing),next={};
    for(let i=1;i<=8;i++)next[i]=Number(counts?.[i]||0)+add[i-1];
    const row={user_id:currentUser.id,updated_at:new Date().toISOString()};
    for(let i=1;i<=8;i++)row['l'+i]=next[i];
    const {error}=await sb.from('arena_ticket_levels').upsert(row,{onConflict:'user_id'});
    if(error)throw error;
    try{localStorage.setItem('arenaTicketLevelCounts',JSON.stringify(next))}catch(_){ }
    window.dispatchEvent(new CustomEvent('arena-ticket-levels-changed',{detail:{converted:missing}}));
    await refreshLevelLabels();
    status(tx(`🎟️ 기존 투기장 티켓 ${missing.toLocaleString()}개를 레벨별 티켓으로 한 번에 변환했어.`,`🎟️ Converted ${missing.toLocaleString()} existing Arena Tickets into level tickets.`));
  }catch(e){console.warn('Arena ticket conversion failed',e)}finally{normalizing=false}
}
async function setLevelCount(level,next){
  const col='l'+level;
  const {data,error}=await sb.from('arena_ticket_levels').update({[col]:next,updated_at:new Date().toISOString()}).eq('user_id',currentUser.id).select('user_id').maybeSingle();
  return !error&&!!data;
}
async function consume(level){
  const c=await dbCounts(),now=Number(c[level]||0);
  if(now<1)return false;
  const ok=await setLevelCount(level,now-1);
  if(ok){pendingRestore={level,count:now};await refreshLevelLabels()}
  return ok;
}
async function restorePending(){
  const p=pendingRestore;if(!p||!sb||!currentUser)return;
  pendingRestore=null;
  const c=await dbCounts();
  await setLevelCount(p.level,Number(c[p.level]||0)+1);
  await refreshLevelLabels();
}
function wrapArenaEnter(){
  try{
    if(!sb||!sb.rpc||sb.__levelEntryWrapped)return;
    const old=sb.rpc.bind(sb);
    sb.rpc=async function(name,args,opts){
      const r=await old(name,args,opts);
      if(name==='arena_enter'&&pendingRestore){
        if(r?.error)await restorePending();else{pendingRestore=null;refreshLevelLabels()}
      }
      return r;
    };
    sb.__levelEntryWrapped=true;
  }catch(_){ }
}
async function refreshLevelLabels(){
  const c=await dbCounts();
  document.querySelectorAll('.arena-level-btn').forEach(b=>{
    const lv=Number(b.dataset.level||0);if(!lv)return;
    const base=(b.textContent||'').replace(/\s*·\s*보유\s*[\d,]+개.*$/,'').replace(/\s*·\s*Owned\s*[\d,]+.*$/,'');
    b.textContent=`${base} · ${tx('보유','Owned')} ${Number(c[lv]||0).toLocaleString()}${tx('개','')}`;
  });
}
function installEntryGuard(){
  const btn=document.getElementById('arenaStartBtn');if(!btn||btn.dataset.levelGuard)return;
  btn.dataset.levelGuard='1';
  btn.addEventListener('click',async e=>{
    if(bypass)return;
    e.preventDefault();e.stopImmediatePropagation();
    try{
      if(!sb||!currentUser){status(tx('로그인 후 투기장을 시작할 수 있어.','Log in to start the Arena.'));return}
      const lv=activeLevel();
      const ok=await consume(lv);
      if(!ok){status(tx(`🎟️ ${lv}레벨 투기장 티켓이 없어.`,`🎟️ You do not have a Level ${lv} Arena Ticket.`));return}
      bypass=true;btn.click();bypass=false;
    }catch(err){await restorePending();status(tx(`입장 실패: ${err?.message||err}`,`Entry failed: ${err?.message||err}`))}
  },true);
}
function boot(){wrapArenaEnter();installEntryGuard();refreshLevelLabels();normalizeExistingTickets()}
window.addEventListener('arena-ticket-levels-changed',()=>refreshLevelLabels());
document.addEventListener('click',e=>{if(e.target?.classList?.contains('arena-level-btn'))setTimeout(refreshLevelLabels,0)});
setTimeout(boot,400);setTimeout(boot,1200);setInterval(()=>{if(document.getElementById('arenaView')?.classList.contains('active')){refreshLevelLabels();normalizeExistingTickets()}},3000);
})();