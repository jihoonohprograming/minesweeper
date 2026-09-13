(()=>{
'use strict';
const LS='minesweeperEquipmentV3',SUITE='msSuiteV3';
const GEMS=[['ruby','루비','🔻'],['sapphire','사파이어','🔵'],['topaz','토파즈','🟠'],['amethyst','자수정','🟣'],['onyx','오닉스','⚫'],['aquamarine','아쿠아마린','💠'],['emerald','에메랄드','🌵'],['garnet','가넷','🔴'],['jade','제이드','🟢'],['diamond','다이아몬드','💎']];
function load(){try{const a=JSON.parse(localStorage.getItem(LS)||'[]');return Array.isArray(a)?a:[]}catch(_){return[]}}
function save(a){localStorage.setItem(LS,JSON.stringify(a))}
function suite(){try{return JSON.parse(localStorage.getItem(SUITE)||'{}')||{}}catch(_){return{}}}
function saveSuite(s){localStorage.setItem(SUITE,JSON.stringify(s));window.dispatchEvent(new CustomEvent('mso-state-changed'))}
function db(){try{return window.__msGetSb?.()||window.sb||null}catch(_){return window.sb||null}}
function user(){try{return window.__msGetUser?.()||window.currentUser||null}catch(_){return window.currentUser||null}}
async function coins(){const d=db(),u=user();if(!d||!u)throw Error('로그인이 필요해.');const {data,error}=await d.from('wallets').select('coins').eq('user_id',u.id).maybeSingle();if(error)throw error;return Number(data?.coins||0)}
async function pay(n){const d=db(),u=user(),c=await coins();if(c<n)throw Error(`코인이 부족해. 필요 ${n.toLocaleString()}코인`);const {error}=await d.from('wallets').update({coins:c-n}).eq('user_id',u.id);if(error)throw error}
function gemName(k){return GEMS.find(x=>x[0]===k)?.[1]||k}
function gemIcon(k){return GEMS.find(x=>x[0]===k)?.[2]||'💎'}
function takeGem(k){const s=suite();s.gems??={};if(Number(s.gems[k]||0)<1)throw Error(`${gemName(k)}가 필요해.`);s.gems[k]--;saveSuite(s)}
function putGem(k){const s=suite();s.gems??={};s.gems[k]=Number(s.gems[k]||0)+1;saveSuite(s)}
function upgradeCount(it,k){it.seriesUpgrades??={};return Number(it.seriesUpgrades[k]||0)}
function upgradeCost(it,k){const n=upgradeCount(it,k);return Math.round((500+Math.max(0,Number(it.quality||0))*35)*(1+n*.5))}
function msg(t,bad=false){const v=document.getElementById('equipmentView');if(!v)return;let e=v.querySelector('#eqCraftStatus');if(!e){e=document.createElement('div');e.id='eqCraftStatus';v.querySelector('.eq-craft')?.after(e)}e.textContent=t;e.style.cssText=`margin:9px 0;font-weight:900;color:${bad?'#b91c1c':'#166534'}`}
async function seriesUpgrade(btn){const card=btn.closest('[data-eqid]'),a=load(),it=a.find(x=>x.id===card?.dataset.eqid);if(!it)return;const k=card.querySelector('.eq-series-gem')?.value||'emerald',n=upgradeCount(it,k),limit=k==='diamond'?10:5;if(n>=limit)return msg(`${gemName(k)} 강화는 최대 ${limit}회야.`,true);const cost=upgradeCost(it,k);if(!confirm(`${gemIcon(k)} ${gemName(k)} 1개 + 🪙 ${cost.toLocaleString()}코인으로 강화할까?`))return;let took=false;try{takeGem(k);took=true;await pay(cost);it.seriesUpgrades??={};it.seriesUpgrades[k]=n+1;it.stats??={};it.stats[k]=Number(it.stats[k]||0)+(k==='diamond'?1:4);it.quality=Object.values(it.stats).reduce((s,v)=>s+Number(v||0),0);save(a);msg(`✅ ${gemName(k)} 강화 ${n+1}/${limit} · ${gemName(k)} +${it.stats[k]}%`);document.querySelector('.nav-item[data-view="equipment"]')?.click()}catch(e){if(took)putGem(k);msg(`❌ ${e?.message||e}`,true)}}
function decorate(){const v=document.getElementById('equipmentView');if(!v)return;v.querySelectorAll('[data-eqid]').forEach(card=>{const old=card.querySelector('.eq-upgrade');if(!old)return;old.style.display='none';if(card.querySelector('.eq-series-upgrade'))return;const wrap=document.createElement('div');wrap.className='eq-series-upgrade';wrap.style.cssText='display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 12px';wrap.innerHTML=`<select class="eq-series-gem">${GEMS.map(([k,n,i])=>`<option value="${k}">${i} ${n}</option>`).join('')}</select><button class="eq-series-btn">시리즈 강화</button><small style="width:100%">R~J 보석 강화: +4%씩 최대 5회 · 다이아몬드: +1%씩 최대 10회</small>`;card.querySelector('.eq-actions')?.before(wrap)})}
document.addEventListener('click',e=>{const b=e.target.closest?.('.eq-series-btn');if(b){e.preventDefault();e.stopImmediatePropagation();seriesUpgrade(b)}},true);
new MutationObserver(()=>requestAnimationFrame(decorate)).observe(document.documentElement,{childList:true,subtree:true});setTimeout(decorate,300);
})();