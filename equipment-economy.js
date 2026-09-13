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
function makeItem(slot){
 const r=pickRarity(),quality=rnd(r.min,r.max),count=r.name==='전설'?6:r.name==='특별'?5:r.name==='희귀'?4:3;
 const pool=[...STAT_POOL].sort(()=>Math.random()-.5).slice(0,count),stats={};
 for(const s of pool){const base=rnd(s.min,s.max),q=.7+quality/200;stats[s.id]=Math.max(1,Math.round(base*r.m*q))}
 return {id:'eq-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),slot,rarity:r.name,code:codeFor(slot,r.name),quality,boostDays:rnd(5,20),stats,equipped:false};
}
function price(it){
 const s=it.stats||{},coin=Number(s.coin||0),gem=Number(s.gem||0),ticket=Number(s.ticket||0),arena=Number(s.arenaCoin||0);
 const power=coin*1.0+gem*1.5+ticket*1.8+arena*1.3;
 const rarityMul=it.rarity==='전설'?2.2:it.rarity==='특별'?1.6:it.rarity==='희귀'?1.25:1;
 const coinCost=Math.max(100,Math.round((150+power*22)*rarityMul));
 const gemCost=Math.max(1,Math.ceil((1+power/35)*rarityMul));
 return {coinCost,gemCost,power};
}
function load(){try{const a=JSON.parse(localStorage.getItem(LS)||'[]');return Array.isArray(a)?a:[]}catch(_){return[]}}
function save(a){localStorage.setItem(LS,JSON.stringify(a))}
async function wallet(){if(!window.sb||!window.currentUser)return null;const {data,error}=await sb.from('wallets').select('coins,gem').eq('user_id',currentUser.id).maybeSingle();if(error)throw error;return data}
async function pay(cost){
 const w=await wallet();if(!w)throw new Error('로그인이 필요해.');
 const coins=Number(w.coins||0),gems=Number(w.gem||0);
 if(coins<cost.coinCost)throw new Error(`코인이 부족해. 필요 ${cost.coinCost.toLocaleString()}코인`);
 if(gems<cost.gemCost)throw new Error(`보석이 부족해. 필요 ${cost.gemCost.toLocaleString()}개`);
 const {error}=await sb.from('wallets').update({coins:coins-cost.coinCost,gem:gems-cost.gemCost}).eq('user_id',currentUser.id);
 if(error)throw error;
}
function message(text,bad=false){
 const v=document.getElementById('equipmentView');if(!v)return;
 let e=v.querySelector('#eqCraftStatus');if(!e){e=document.createElement('div');e.id='eqCraftStatus';const c=v.querySelector('.eq-craft');c?.after(e)}
 e.textContent=text;e.style.cssText=`margin:8px 0 0;font-weight:800;color:${bad?'#b91c1c':'#166534'}`;
}
async function craftPaid(){
 const sel=document.getElementById('eqCraftSlot');if(!sel)return;
 const item=makeItem(sel.value),cost=price(item);
 const ok=confirm(`이 장비의 제작 비용은 🪙 ${cost.coinCost.toLocaleString()}코인 + 💎 ${cost.gemCost.toLocaleString()}보석이야.\n제작할까?`);
 if(!ok)return;
 try{
  await pay(cost);
  const a=load();a.push(item);save(a);
  message(`✅ 제작 완료! ${item.rarity} 장비 · 🪙 ${cost.coinCost.toLocaleString()} + 💎 ${cost.gemCost.toLocaleString()} 사용`);
  try{refreshProfile();refreshMarket()}catch(_){}
  setTimeout(()=>{document.querySelector('.nav-item[data-view="equipment"]')?.click()},50);
 }catch(e){message(`❌ ${e?.message||e}`,true)}
}
document.addEventListener('click',e=>{
 const b=e.target?.closest?.('#eqCraftBtn');if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();craftPaid();
},true);
function decorate(){const v=document.getElementById('equipmentView');if(!v)return;const p=v.querySelector('.eq-craft p');if(p&&!p.dataset.costNote){p.dataset.costNote='1';p.textContent='종류를 고르면 장비가 랜덤 제작돼. 동전·보석·투기장 효과가 높을수록 제작 비용도 올라가.'}}
new MutationObserver(decorate).observe(document.documentElement,{subtree:true,childList:true});setTimeout(decorate,500);
})();