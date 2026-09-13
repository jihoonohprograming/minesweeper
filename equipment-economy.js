(()=>{
'use strict';
const LS='minesweeperEquipmentV3';
const SLOTS=[
 {id:'engine',name:'엔진',prefix:'UE'},
 {id:'hull',name:'선체',prefix:'UH'},
 {id:'torpedo',name:'어뢰',prefix:'UT'},
 {id:'radar',name:'레이더',prefix:'LR'},
 {id:'sonar',name:'음파탐지기',prefix:'US'}
];
const RARITIES=[
 {name:'일반',w:50,m:.65,min:20,max:45},
 {name:'희귀',w:28,m:.85,min:35,max:60},
 {name:'특별',w:17,m:1.05,min:45,max:78},
 {name:'전설',w:5,m:1.3,min:65,max:100}
];
const STAT_POOL=[
 {id:'xp',min:5,max:40},{id:'coin',min:6,max:38},{id:'gem',min:5,max:40},
 {id:'ticket',min:5,max:40},{id:'arenaCoin',min:5,max:30},{id:'activity',min:5,max:30},
 {id:'event',min:5,max:35},{id:'emerald',min:8,max:40},{id:'ruby',min:4,max:20}
];
function rnd(a,b){return Math.floor(a+Math.random()*(b-a+1))}
function pickRarity(){let r=Math.random()*100;for(const x of RARITIES){if(r<x.w)return x;r-=x.w}return RARITIES[0]}
function codeFor(slot,rarity){const s=SLOTS.find(x=>x.id===slot)||SLOTS[0],chars='ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';const part=n=>Array.from({length:n},()=>chars[Math.floor(Math.random()*chars.length)]).join('');return `${s.prefix}-${part(5)}-${rarity==='전설'?'R1':rarity==='특별'?'E5':rarity==='희귀'?'B3':'C1'}`}
function makeItem(slot){const r=pickRarity(),quality=rnd(r.min,r.max),count=r.name==='전설'?6:r.name==='특별'?5:r.name==='희귀'?4:3,pool=[...STAT_POOL].sort(()=>Math.random()-.5).slice(0,count),stats={};for(const s of pool){const base=rnd(s.min,s.max),q=.7+quality/200;stats[s.id]=Math.max(1,Math.round(base*r.m*q))}return{id:'eq-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),slot,rarity:r.name,code:codeFor(slot,r.name),quality,boostDays:rnd(5,20),stats,equipped:false}}
function price(it){const s=it.stats||{},coin=Number(s.coin||0),gem=Number(s.gem||0),ticket=Number(s.ticket||0),arena=Number(s.arenaCoin||0),power=coin+gem*1.5+ticket*1.8+arena*1.3,rarityMul=it.rarity==='전설'?2.2:it.rarity==='특별'?1.6:it.rarity==='희귀'?1.25:1;return{coinCost:Math.max(100,Math.round((150+power*22)*rarityMul)),gemCost:Math.max(1,Math.ceil((1+power/35)*rarityMul)),power}}
function upgradePrice(it){const q=Math.max(0,Number(it.quality||0)),rarityMul=it.rarity==='전설'?2.4:it.rarity==='특별'?1.7:it.rarity==='희귀'?1.3:1;return Math.max(100,Math.round((120+q*q*1.8)*rarityMul))}
function load(){try{const a=JSON.parse(localStorage.getItem(LS)||'[]');return Array.isArray(a)?a:[]}catch(_){return[]}}
function save(a){localStorage.setItem(LS,JSON.stringify(a))}
function getDb(){try{return window.__msGetSb?.()||window.sb||null}catch(_){return window.sb||null}}
function getUser(){try{return window.__msGetUser?.()||window.currentUser||null}catch(_){return window.currentUser||null}}
async function wallet(){const sb=getDb(),user=getUser();if(!sb||!user)return null;const {data,error}=await sb.from('wallets').select('coins,gem').eq('user_id',user.id).maybeSingle();if(error)throw error;return data}
async function pay(cost){const sb=getDb(),user=getUser(),w=await wallet();if(!w||!sb||!user)throw new Error('로그인이 필요해.');const coins=Number(w.coins||0),gems=Number(w.gem||0);if(coins<cost.coinCost)throw new Error(`코인이 부족해. 필요 ${cost.coinCost.toLocaleString()}코인`);if(gems<cost.gemCost)throw new Error(`보석이 부족해. 필요 ${cost.gemCost.toLocaleString()}개`);const {error}=await sb.from('wallets').update({coins:coins-cost.coinCost,gem:gems-cost.gemCost}).eq('user_id',user.id);if(error)throw error}
async function payCoins(amount){const sb=getDb(),user=getUser(),w=await wallet();if(!w||!sb||!user)throw new Error('로그인이 필요해.');const coins=Number(w.coins||0);if(coins<amount)throw new Error(`코인이 부족해. 필요 ${amount.toLocaleString()}코인`);const {error}=await sb.from('wallets').update({coins:coins-amount}).eq('user_id',user.id);if(error)throw error}
function message(text,bad=false){const v=document.getElementById('equipmentView');if(!v)return;let e=v.querySelector('#eqCraftStatus');if(!e){e=document.createElement('div');e.id='eqCraftStatus';const c=v.querySelector('.eq-craft');c?.after(e)}if(e.textContent!==text)e.textContent=text;e.style.cssText=`margin:8px 0 0;font-weight:800;color:${bad?'#b91c1c':'#166534'}`}
async function craftPaid(){const sel=document.getElementById('eqCraftSlot');if(!sel)return;const item=makeItem(sel.value),cost=price(item);if(!confirm(`이 장비의 제작 비용은 🪙 ${cost.coinCost.toLocaleString()}코인 + 💎 ${cost.gemCost.toLocaleString()}보석이야.\n제작할까?`))return;try{await pay(cost);const a=load();a.push(item);save(a);message(`✅ 제작 완료! ${item.rarity} 장비 · 🪙 ${cost.coinCost.toLocaleString()} + 💎 ${cost.gemCost.toLocaleString()} 사용`);try{refreshProfile();refreshMarket()}catch(_){}setTimeout(()=>{document.querySelector('.nav-item[data-view="equipment"]')?.click()},50)}catch(e){message(`❌ ${e?.message||e}`,true)}}
async function upgradePaid(button){const card=button.closest('[data-eqid]'),id=card?.dataset.eqid,a=load(),it=a.find(x=>x.id===id);if(!it)return;if(Number(it.quality||0)>=100)return message('이미 품질 100%야.',true);const cost=upgradePrice(it);if(!confirm(`강화 비용은 🪙 ${cost.toLocaleString()}코인이야.\n강화할까?`))return;try{await payCoins(cost);it.quality=Math.min(100,Number(it.quality||0)+rnd(1,4));for(const k of Object.keys(it.stats||{}))if(Math.random()<.45)it.stats[k]=Number(it.stats[k]||0)+1;save(a);message(`✅ 강화 완료! 🪙 ${cost.toLocaleString()}코인 사용 · 품질 ${it.quality}%`);try{refreshProfile();refreshMarket()}catch(_){}document.querySelector('.nav-item[data-view="equipment"]')?.click()}catch(e){message(`❌ ${e?.message||e}`,true)}}
document.addEventListener('click',e=>{const craft=e.target?.closest?.('#eqCraftBtn');if(craft){e.preventDefault();e.stopImmediatePropagation();craftPaid();return}const up=e.target?.closest?.('.eq-upgrade');if(up){e.preventDefault();e.stopImmediatePropagation();upgradePaid(up)}},true);
let decorateQueued=false;
function decorate(){decorateQueued=false;const v=document.getElementById('equipmentView');if(!v)return;const p=v.querySelector('.eq-craft p');if(p&&!p.dataset.costNote){p.dataset.costNote='1';p.textContent='종류를 고르면 장비가 랜덤 제작돼. 제작에는 동전과 보석이 필요하고, 강화에는 동전이 필요해.'}const items=load();v.querySelectorAll('[data-eqid]').forEach(card=>{const id=card.dataset.eqid,it=items.find(x=>x.id===id),btn=card.querySelector('.eq-upgrade');if(it&&btn){const text=`강화하기 (${upgradePrice(it).toLocaleString()} 코인)`;if(btn.textContent!==text)btn.textContent=text}})}
function queueDecorate(){if(decorateQueued)return;decorateQueued=true;requestAnimationFrame(decorate)}
function installEffects(){const sb=getDb();try{if(!sb?.rpc||sb.__equipmentEffectsV3)return;const old=sb.rpc.bind(sb);sb.rpc=async function(name,args,opts){if(name==='normal_cell_reward'||name==='arena_cell_reward'){let res=await old(name,args,opts);if(res?.error||res?.data?.ticket_awarded)return res;const b=window.getEquipmentBonuses?.()||{},p=Math.max(0,Number(b.ticket||0)),n=Math.floor(p/100)+(Math.random()*100<p%100?1:0);for(let i=0;i<n;i++){const x=await old(name,args,opts);if(x?.error)return res;if(x?.data?.ticket_awarded)return x}return res}if(name==='arena_cell_reward_test')return old(name,args,opts);if(name==='arena_win_reward'){const first=await old(name,args,opts);if(first?.error)return first;const b=window.getEquipmentBonuses?.()||{},p=Math.max(0,Number(b.arenaCoin||0)),n=Math.floor(p/100)+(Math.random()*100<p%100?1:0);for(let i=0;i<n;i++){const x=await old(name,args,opts);if(x?.error)break}return first}return old(name,args,opts)};sb.__equipmentEffectsV3=true}catch(_){}}
new MutationObserver(()=>{queueDecorate();installEffects()}).observe(document.documentElement,{subtree:true,childList:true});
setTimeout(()=>{queueDecorate();installEffects()},500);
})();