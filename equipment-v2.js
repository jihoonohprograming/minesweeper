(()=>{
'use strict';
const SLOTS=[
 {id:'engine',name:'엔진',icon:'⚙️',prefix:'UE'},
 {id:'hull',name:'선체',icon:'🛡️',prefix:'UH'},
 {id:'torpedo',name:'어뢰',icon:'🚀',prefix:'UT'},
 {id:'radar',name:'레이더',icon:'📡',prefix:'LR'},
 {id:'sonar',name:'음파탐지기',icon:'🔊',prefix:'US'}
];
const RARITIES=[
 {name:'일반',w:50,m:.65,min:20,max:45},
 {name:'희귀',w:28,m:.85,min:35,max:60},
 {name:'특별',w:17,m:1.05,min:45,max:78},
 {name:'전설',w:5,m:1.3,min:65,max:100}
];
const STAT_POOL=[
 {id:'xp',name:'경험치',min:5,max:40},
 {id:'coin',name:'동전',min:6,max:38},
 {id:'gem',name:'보석',min:5,max:40},
 {id:'ticket',name:'투기장 티켓',min:5,max:40},
 {id:'arenaCoin',name:'투기장 동전',min:5,max:30},
 {id:'activity',name:'활동 점수',min:5,max:30},
 {id:'event',name:'이벤트 자원',min:5,max:35},
 {id:'ruby',name:'루비',min:8,max:40},
 {id:'sapphire',name:'사파이어',min:8,max:40},
 {id:'topaz',name:'토파즈',min:8,max:40},
 {id:'amethyst',name:'자수정',min:8,max:40},
 {id:'onyx',name:'오닉스',min:8,max:40},
 {id:'aquamarine',name:'아쿠아마린',min:8,max:40},
 {id:'emerald',name:'에메랄드',min:8,max:40},
 {id:'garnet',name:'가넷',min:8,max:40},
 {id:'jade',name:'제이드',min:8,max:40},
 {id:'diamond',name:'다이아몬드',min:4,max:25}
];
const DEFAULTS=[
 {id:'starter-engine',slot:'engine',rarity:'특별',code:'UE-59A88-E5',quality:46,boostDays:10,stats:{xp:10,coin:18,gem:22,ticket:16,emerald:40},equipped:true},
 {id:'starter-hull',slot:'hull',rarity:'특별',code:'UH-P0H7E-E5',quality:65,boostDays:19,stats:{xp:40,gem:36,ticket:14,emerald:40},equipped:true},
 {id:'starter-torpedo',slot:'torpedo',rarity:'특별',code:'UT-6H088-E5',quality:45,boostDays:7,stats:{xp:12,coin:36,ticket:16,activity:16,emerald:40},equipped:true},
 {id:'starter-radar',slot:'radar',rarity:'전설',code:'LR-BXPBF-R1',quality:71,boostDays:7,stats:{xp:24,coin:20,gem:40,ticket:24,event:32,ruby:8},equipped:true},
 {id:'starter-sonar',slot:'sonar',rarity:'특별',code:'US-670I8-E5',quality:45,boostDays:9,stats:{xp:12,coin:14,ticket:38,arenaCoin:16,emerald:40},equipped:true}
];
const LS='minesweeperEquipmentV3';
function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){try{const x=JSON.parse(localStorage.getItem(LS)||'null');return Array.isArray(x)?x:clone(DEFAULTS)}catch(_){return clone(DEFAULTS)}}
function save(x){try{localStorage.setItem(LS,JSON.stringify(x))}catch(_){}}
function slotInfo(id){return SLOTS.find(x=>x.id===id)||SLOTS[0]}
function rarityInfo(name){return RARITIES.find(x=>x.name===name)||RARITIES[0]}
function pickRarity(){let r=Math.random()*100;for(const x of RARITIES){if(r<x.w)return x;r-=x.w}return RARITIES[0]}
function rnd(a,b){return Math.floor(a+Math.random()*(b-a+1))}
function codeFor(slot,rarity){const s=slotInfo(slot),letters='ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';const rand=n=>Array.from({length:n},()=>letters[Math.floor(Math.random()*letters.length)]).join('');return `${s.prefix}-${rand(5)}-${rarity==='전설'?'R1':rarity==='특별'?'E5':rarity==='희귀'?'B3':'C1'}`}
function craft(slot){const r=pickRarity(),quality=rnd(r.min,r.max),count=r.name==='전설'?6:r.name==='특별'?5:r.name==='희귀'?4:3,pool=[...STAT_POOL].sort(()=>Math.random()-.5).slice(0,count),stats={};for(const s of pool){const base=rnd(s.min,s.max),q=.7+quality/200;stats[s.id]=Math.max(1,Math.round(base*r.m*q))}return{id:'eq-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),slot,rarity:r.name,code:codeFor(slot,r.name),quality,boostDays:rnd(5,20),stats,equipped:false}}
function bonuses(){const b={xp:0,coin:0,gem:0,ticket:0,arenaCoin:0,activity:0,event:0,ruby:0,sapphire:0,topaz:0,amethyst:0,onyx:0,aquamarine:0,emerald:0,garnet:0,jade:0,diamond:0};for(const it of load().filter(x=>x.equipped)){for(const [k,v] of Object.entries(it.stats||{}))b[k]=(b[k]||0)+Number(v||0)}return b}
window.getEquipmentBonuses=bonuses;
function percentText(k,v){return `${STAT_POOL.find(x=>x.id===k)?.name||k}: +${v}%`}
function equip(id){const a=load(),it=a.find(x=>x.id===id);if(!it)return;a.forEach(x=>{if(x.slot===it.slot)x.equipped=false});it.equipped=true;save(a);render()}
function unequip(id){const a=load(),it=a.find(x=>x.id===id);if(it)it.equipped=false;save(a);render()}
function removeItem(id){const a=load().filter(x=>x.id!==id);save(a);render()}
function upgrade(id){const a=load(),it=a.find(x=>x.id===id);if(!it)return;it.quality=Number(it.quality||0)+rnd(1,4);for(const k of Object.keys(it.stats||{}))if(Math.random()<.45)it.stats[k]=Number(it.stats[k]||0)+1;save(a);render()}
function view(){return document.getElementById('equipmentView')}
function render(){const v=view();if(!v)return;const items=load(),b=bonuses();v.innerHTML=`
 <div class="eq-head"><div><h2>🧰 장비</h2><p class="mode-desc">장비를 직접 제작하고, 슬롯별로 하나씩 장착할 수 있어.</p></div><div class="eq-total">장착 ${items.filter(x=>x.equipped).length}/5</div></div>
 <div class="eq-bonus"><b>현재 장착 효과</b><span>동전 +${b.coin}%</span><span>보석 +${b.gem}%</span><span>투기장 티켓 +${b.ticket}%</span><span>투기장 동전 +${b.arenaCoin}%</span></div>
 <div class="eq-craft"><div><b>🔧 장비 제작</b><p>종류를 고른 뒤 제작하면 희귀도가 무작위로 정해지고 능력치도 랜덤으로 붙어.</p></div><select id="eqCraftSlot">${SLOTS.map(s=>`<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}</select><button id="eqCraftBtn" class="buy-btn">제작하기</button></div>
 <h3 class="eq-section-title">장착 중</h3><div id="eqEquipped" class="eq-list"></div>
 <h3 class="eq-section-title">보유 장비 (${items.length})</h3><div id="eqInventory" class="eq-list"></div>`;
 v.querySelector('#eqCraftBtn').onclick=()=>{const slot=v.querySelector('#eqCraftSlot').value,a=load(),it=craft(slot);a.push(it);save(a);render();setTimeout(()=>{const n=document.querySelector(`[data-eqid="${it.id}"]`);n?.scrollIntoView({behavior:'smooth',block:'center'})},50)};
 const equipped=v.querySelector('#eqEquipped'),inv=v.querySelector('#eqInventory');
 const draw=(it,where)=>{const s=slotInfo(it.slot),r=rarityInfo(it.rarity),c=document.createElement('div');c.className='eq-item '+(it.rarity==='전설'?'legendary':it.rarity==='특별'?'special':'');c.dataset.eqid=it.id;c.innerHTML=`
 <div class="eq-slot-row"><div class="eq-slot-icon">${s.icon}</div><div class="eq-slot-name">${s.name}</div><div class="eq-rarity">${it.rarity}</div>${it.equipped?'<span class="eq-equipped-badge">장착 중</span>':''}</div>
 <div class="eq-main"><div class="eq-title"><b>${it.rarity} ${s.name}</b><span>${it.code}</span></div><div class="eq-stats">${Object.entries(it.stats||{}).map(([k,val])=>`<div><span>${STAT_POOL.find(x=>x.id===k)?.name||k}</span><b>+${val}%</b></div>`).join('')}</div><div class="eq-meta"><span>부스트 기간: <b>${it.boostDays}일</b></span><span class="eq-quality">품질 <b>${it.quality}%</b></span></div><div class="eq-bar"><i style="width:${Math.max(0,Math.min(100,it.quality))}%"></i></div></div>
 <div class="eq-actions"><button class="eq-remove">제거</button><button class="eq-upgrade">강화하기</button><button class="eq-equip">${it.equipped?'장착 해제':'장착하기'}</button></div>`;
 c.querySelector('.eq-remove').onclick=()=>removeItem(it.id);c.querySelector('.eq-upgrade').onclick=()=>upgrade(it.id);c.querySelector('.eq-equip').onclick=()=>it.equipped?unequip(it.id):equip(it.id);where.appendChild(c)};
 const eq=items.filter(x=>x.equipped);if(!eq.length)equipped.innerHTML='<div class="empty-note">장착 중인 장비가 없어.</div>';else eq.forEach(it=>draw(it,equipped));
 if(!items.length)inv.innerHTML='<div class="empty-note">보유 장비가 없어. 위에서 하나 제작해 봐!</div>';else items.forEach(it=>draw(it,inv));
}
function extraCalls(percent){const p=Math.max(0,Number(percent||0)),whole=Math.floor(p/100),rem=p%100;return whole+(Math.random()*100<rem?1:0)}
function installEffects(){try{const sb=window.__msGetSb?.()||window.sb;if(!sb?.rpc||sb.__equipmentEffectsV3)return;const old=sb.rpc.bind(sb);sb.rpc=async function(name,args,opts){
  if(name==='normal_cell_reward'||name==='arena_cell_reward'){
    let res=await old(name,args,opts);if(res?.error||res?.data?.ticket_awarded)return res;const n=extraCalls(bonuses().ticket);for(let i=0;i<n;i++){const x=await old(name,args,opts);if(x?.error)return res;if(x?.data?.ticket_awarded)return x}return res;
  }
  if(name==='arena_cell_reward_test')return old(name,args,opts);
  if(name==='arena_win_reward'){
    const first=await old(name,args,opts);if(first?.error)return first;const n=extraCalls(bonuses().arenaCoin);for(let i=0;i<n;i++){const x=await old(name,args,opts);if(x?.error)break}return first;
  }
  return old(name,args,opts)
 };sb.__equipmentEffectsV3=true}catch(_){}}
const css=document.createElement('style');css.textContent=`
.eq-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}.eq-head h2{margin:0 0 5px}.eq-total{font-weight:900;background:#111827;color:#fff;padding:8px 12px;border-radius:999px}.eq-bonus{display:flex;gap:8px;align-items:center;flex-wrap:wrap;border:1px solid #d1d5db;background:#f8fafc;border-radius:14px;padding:12px;margin-bottom:12px}.eq-bonus b{margin-right:4px}.eq-bonus span{background:#fff;border:1px solid #e5e7eb;border-radius:999px;padding:5px 9px;font-size:13px;font-weight:800}.eq-craft{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid #d1d5db;border-radius:14px;padding:14px;background:#fff}.eq-craft>div{flex:1;min-width:220px}.eq-craft p{margin:5px 0 0;color:#6b7280;font-size:13px}.eq-section-title{margin:20px 0 9px}.eq-list{display:grid;gap:12px}.eq-item{border:1px solid #d1d5db;border-radius:16px;background:#fff;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.04)}.eq-item.legendary{border-width:2px}.eq-slot-row{display:flex;align-items:center;gap:9px;background:#f8fafc;border-bottom:1px solid #e5e7eb;padding:10px 14px}.eq-slot-icon{font-size:22px}.eq-slot-name{font-weight:900;font-size:16px}.eq-rarity{margin-left:auto;font-size:12px;font-weight:900;padding:4px 8px;border-radius:999px;background:#e5e7eb}.legendary .eq-rarity{background:#fef3c7}.eq-equipped-badge{font-size:11px;font-weight:900;background:#dcfce7;color:#166534;padding:4px 7px;border-radius:999px}.eq-main{padding:14px}.eq-title{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:12px}.eq-title b{font-size:18px}.eq-title span{font-size:12px;color:#6b7280;font-weight:700}.eq-stats{display:grid;grid-template-columns:repeat(3,minmax(120px,1fr));gap:8px}.eq-stats>div{display:flex;justify-content:space-between;gap:8px;background:#f8fafc;border:1px solid #eef2f7;border-radius:10px;padding:8px 10px}.eq-stats span{font-size:13px;color:#4b5563}.eq-stats b{font-size:14px}.eq-meta{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:12px;font-size:13px}.eq-quality{font-weight:800}.eq-bar{height:7px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-top:7px}.eq-bar i{display:block;height:100%;background:#111827;border-radius:inherit}.eq-actions{display:flex;gap:8px;padding:0 14px 14px}.eq-actions button{flex:1}.eq-remove{color:#b91c1c}.eq-equip{background:#111827;color:#fff}@media(max-width:760px){.eq-stats{grid-template-columns:1fr 1fr}.eq-actions{flex-wrap:wrap}.eq-actions button{min-width:110px}.eq-craft select,.eq-craft button{flex:1}}@media(max-width:480px){.eq-stats{grid-template-columns:1fr}.eq-head{align-items:flex-start}.eq-total{font-size:12px}}`;
document.head.appendChild(css);
function boot(){installEffects();if(view())render()}
setTimeout(boot,0);setTimeout(boot,400);setTimeout(boot,1200);
})();