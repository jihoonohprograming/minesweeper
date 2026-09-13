(()=>{
'use strict';
const REWARD_BY_LEVEL={1:100,2:200,3:300,4:400,5:500,6:600,7:700,8:800};
const lang=()=>{try{return currentLang==='en'?'en':'ko'}catch(_){return'ko'}};
const tx=(ko,en)=>lang()==='en'?en:ko;

function currentArenaLevel(){
  const b=document.querySelector('.arena-level-btn.active');
  const lv=Number(b?.dataset?.level||1);
  return lv>=1&&lv<=8?lv:1;
}

function installRewardMultiplier(){
  try{
    if(!sb||!sb.rpc||sb.__arenaRewardWrapped)return;
    const original=sb.rpc.bind(sb);
    sb.rpc=async function(name,args,options){
      if(name!=='arena_win_reward')return original(name,args,options);
      const lv=currentArenaLevel();
      let last=null;
      for(let i=0;i<lv;i++){
        last=await original(name,args,options);
        if(last?.error)return last;
      }
      return last;
    };
    sb.__arenaRewardWrapped=true;
  }catch(_){ }
}

function updateArenaRewardText(){
  const lv=currentArenaLevel(),reward=REWARD_BY_LEVEL[lv];
  const box=document.querySelector('.arena-challenge-summary');
  if(box&&!box.dataset.rewardAdded){
    box.dataset.rewardAdded='1';
  }
  if(box){
    const base=box.textContent.replace(/ · 보상 \d+코인/g,'').replace(/ · Reward \d+ coins/g,'');
    box.textContent=base+(lang()==='en'?` · Reward ${reward} coins/board`:` · 보상 판당 ${reward}코인`);
  }
  const st=document.getElementById('arenaStatus');
  if(st){
    st.textContent=st.textContent
      .replace(/판당 100코인/g,`판당 ${reward}코인`)
      .replace(/100 coins per clear/g,`${reward} coins per clear`);
  }
}

function installEquipmentView(){
  if(document.getElementById('equipmentView'))return;
  const marketBtn=document.querySelector('.nav-item[data-view="market"]');
  const sidebar=marketBtn?.parentNode;
  if(!marketBtn||!sidebar)return;
  const btn=document.createElement('button');
  btn.className='nav-item';btn.type='button';btn.dataset.view='equipment';btn.textContent=tx('🧰 장비','🧰 Equipment');
  sidebar.insertBefore(btn,marketBtn);
  const marketView=document.getElementById('marketView');
  const view=document.createElement('div');view.id='equipmentView';view.className='view-note';
  view.innerHTML=`<h2>${tx('🧰 장비','🧰 Equipment')}</h2><p class="mode-desc">${tx('보유 장비와 장착 슬롯을 확인하는 목록이야.','View your equipment and equipped slots.')}</p><div class="equipment-grid"><div class="equipment-card"><b>${tx('머리','Head')}</b><span>${tx('비어 있음','Empty')}</span></div><div class="equipment-card"><b>${tx('도구','Tool')}</b><span>${tx('비어 있음','Empty')}</span></div><div class="equipment-card"><b>${tx('장갑','Gloves')}</b><span>${tx('비어 있음','Empty')}</span></div><div class="equipment-card"><b>${tx('부적','Charm')}</b><span>${tx('비어 있음','Empty')}</span></div></div>`;
  marketView?.parentNode?.insertBefore(view,marketView);
  const style=document.createElement('style');
  style.textContent='.equipment-grid{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:10px;margin-top:14px}.equipment-card{border:1px solid #d1d5db;border-radius:14px;background:#f8fafc;padding:16px}.equipment-card b,.equipment-card span{display:block}.equipment-card span{margin-top:8px;color:#6b7280}.market-filter-bar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.market-filter-bar button.active{background:#111827;color:#fff}.ticket-levels{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;font-size:12px}.ticket-levels span{padding:3px 7px;border-radius:999px;background:#eef2f7}@media(max-width:700px){.equipment-grid{grid-template-columns:repeat(2,1fr)}}';
  document.head.appendChild(style);
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
    document.querySelectorAll('.view-note').forEach(v=>v.classList.remove('active'));
    const game=document.getElementById('gameView');if(game)game.classList.add('hidden');
    view.classList.add('active');
  });
  document.querySelectorAll('.nav-item:not([data-view="equipment"])').forEach(n=>n.addEventListener('click',()=>view.classList.remove('active')));
}

let marketFilter='all';
function ensureMarketFilters(){
  const mv=document.getElementById('marketView');if(!mv||document.getElementById('marketFilterBar'))return;
  const bar=document.createElement('div');bar.id='marketFilterBar';bar.className='market-filter-bar';
  [['all','전체','All'],['ticket','🎟️ 투기장 티켓','🎟️ Arena Tickets'],['gem','💎 보석','💎 Gems']].forEach(([k,ko,en])=>{
    const b=document.createElement('button');b.type='button';b.dataset.filter=k;b.textContent=tx(ko,en);if(k==='all')b.classList.add('active');
    b.onclick=()=>{marketFilter=k;bar.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));postProcessMarket()};bar.appendChild(b);
  });
  const grid=document.getElementById('marketGrid');grid?.parentNode?.insertBefore(bar,grid);
}
function classifyCard(card){
  const t=card.textContent||'';return /보석|💎|gem/i.test(t)?'gem':'ticket';
}
function priceOf(card){
  const m=(card.textContent||'').match(/(?:가격\s*)?(\d+)\s*코인/i);return m?Number(m[1]):Number.MAX_SAFE_INTEGER;
}
function sellerOf(card){return card.querySelector('.seller')?.textContent?.replace(/^판매자:\s*/,'').trim()||''}
function postProcessMarket(){
  ensureMarketFilters();
  const grid=document.getElementById('marketGrid');if(!grid)return;
  const cards=[...grid.querySelectorAll('.market-card')];
  const best=new Map();
  for(const c of cards){
    const type=classifyCard(c),seller=sellerOf(c),key=`${seller}|${type}`,p=priceOf(c),old=best.get(key);
    if(!old||p<old.price)best.set(key,{card:c,price:p});
  }
  const keep=new Set([...best.values()].map(x=>x.card));
  cards.forEach(c=>{const type=classifyCard(c);c.style.display=keep.has(c)&&(marketFilter==='all'||marketFilter===type)?'':'none'});
}
function wrapMarketRefresh(){
  try{
    if(typeof refreshMarket!=='function'||refreshMarket.__upgraded)return;
    const old=refreshMarket;
    refreshMarket=async function(...a){const r=await old.apply(this,a);postProcessMarket();return r};
    refreshMarket.__upgraded=true;
  }catch(_){ }
}

function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function localCounts(){try{return JSON.parse(localStorage.getItem('arenaTicketLevelCounts')||'{}')}catch(_){return{}}}
async function upgradedRanking(){
  const g=document.getElementById('rankingGrid');
  if(!g)return;
  try{
    if(!sb||!currentUser){g.innerHTML=`<div class="empty-note">${tx('로그인하면 랭킹을 볼 수 있어.','Log in to view rankings.')}</div>`;return}
    const {data,error}=await sb.rpc('get_asset_ranking');
    if(error)throw error;
    const ids=(data||[]).map(x=>x.user_id).filter(Boolean);
    let levelRows=[];
    if(ids.length){const q=await sb.from('arena_ticket_levels').select('*').in('user_id',ids);if(!q.error)levelRows=q.data||[]}
    const map=new Map(levelRows.map(r=>[r.user_id,r]));
    g.innerHTML='';
    for(const p of data||[]){
      let r=map.get(p.user_id)||{};
      if(currentUser?.id===p.user_id&&!levelRows.length){const lc=localCounts();r={l1:lc[1]||0,l2:lc[2]||0,l3:lc[3]||0,l4:lc[4]||0,l5:lc[5]||0,l6:lc[6]||0,l7:lc[7]||0,l8:lc[8]||0}}
      const levels=Array.from({length:8},(_,i)=>`<span>Lv.${i+1} <b>${Number(r['l'+(i+1)]||0)}</b></span>`).join('');
      const c=document.createElement('div');c.className='rank-card';
      c.innerHTML=`<div class="rank-num">${p.rank_no}</div><div><b class="player-link">${esc(p.username||'플레이어')}</b><div class="ticket-levels">${levels}</div></div><div>🪙 ${p.coins}</div><div>🎟️ ${p.ticket}</div><div>💎 ${p.gem}</div><div class="rank-value rank-extra">${tx('추정가','Estimated value')} ${p.estimated_value} ${tx('코인','coins')}</div>`;
      c.querySelector('.player-link')?.addEventListener('click',()=>{try{openPublicProfile(p.user_id,p.username)}catch(_){}});g.appendChild(c);
    }
    if(!(data||[]).length)g.innerHTML=`<div class="empty-note">${tx('랭킹 데이터가 없어.','No ranking data.')}</div>`;
  }catch(e){g.innerHTML=`<div class="empty-note">${tx('랭킹 오류','Ranking error')}: ${esc(e?.message||e)}</div>`}
}
function wrapRanking(){
  try{refreshRanking=upgradedRanking;document.getElementById('refreshRankingBtn')?.addEventListener('click',upgradedRanking)}catch(_){ }
}

function boot(){
  installRewardMultiplier();installEquipmentView();ensureMarketFilters();wrapMarketRefresh();wrapRanking();postProcessMarket();updateArenaRewardText();
  document.querySelectorAll('.arena-level-btn').forEach(b=>b.addEventListener('click',()=>setTimeout(updateArenaRewardText,0)));
  const s=document.getElementById('arenaStatus');if(s)new MutationObserver(updateArenaRewardText).observe(s,{childList:true,subtree:true,characterData:true});
}
setTimeout(boot,0);setTimeout(boot,500);setTimeout(boot,1500);
})();
