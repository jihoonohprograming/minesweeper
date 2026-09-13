(()=>{
'use strict';
const ITEMS=[
 {slot:'엔진',icon:'⚙️',rarity:'특별',name:'UE-59A88-E5',stats:[['경험치','+10%'],['동전','+18%'],['보석','+22%'],['투기장 티켓','+16%'],['일일 퀘스트','+2'],['에메랄드','+40%']],boost:'10일',quality:46},
 {slot:'선체',icon:'🛡️',rarity:'특별',name:'UH-P0H7E-E5',stats:[['경험치','+40%'],['보석','+36%'],['투기장 티켓','+14%'],['시즌 퀘스트','+2'],['에메랄드','+40%']],boost:'19일',quality:65},
 {slot:'어뢰',icon:'🚀',rarity:'특별',name:'UT-6H088-E5',stats:[['경험치','+12%'],['동전','+36%'],['투기장 티켓','+16%'],['활동 점수','+16%'],['에메랄드','+40%']],boost:'7일',quality:45},
 {slot:'레이더',icon:'📡',rarity:'전설',name:'LR-BXPBF-R1',stats:[['경험치','+24%'],['동전','+20%'],['보석','+40%'],['투기장 티켓','+24%'],['이벤트 자원','+32%'],['루비','+8%']],boost:'7일',quality:71},
 {slot:'음파탐지기',icon:'🔊',rarity:'특별',name:'US-670I8-E5',stats:[['경험치','+12%'],['동전','+14%'],['투기장 티켓','+38%'],['투기장 동전','+16%'],['에메랄드','+40%']],boost:'9일',quality:45}
];
const LS='minesweeperEquipmentV2';
function load(){try{const x=JSON.parse(localStorage.getItem(LS)||'null');return Array.isArray(x)?x:ITEMS}catch(_){return ITEMS}}
function save(x){try{localStorage.setItem(LS,JSON.stringify(x))}catch(_){}}
function view(){return document.getElementById('equipmentView')}
function render(){const v=view();if(!v)return;const items=load();v.innerHTML=`<div class="eq-head"><div><h2>🧰 장비</h2><p class="mode-desc">장착 중인 장비와 효과를 확인하고 관리할 수 있어.</p></div><div class="eq-total">장착 ${items.length}/5</div></div><div id="eqList" class="eq-list"></div>`;const list=v.querySelector('#eqList');
 if(!items.length){list.innerHTML='<div class="empty-note">장착된 장비가 없어.</div>';return}
 items.forEach((it,idx)=>{const c=document.createElement('div');c.className='eq-item '+(it.rarity==='전설'?'legendary':'special');c.innerHTML=`
 <div class="eq-slot-row"><div class="eq-slot-icon">${it.icon}</div><div class="eq-slot-name">${it.slot}</div><div class="eq-rarity">${it.rarity}</div></div>
 <div class="eq-main"><div class="eq-title"><b>${it.rarity} ${it.slot}</b><span>${it.name}</span></div><div class="eq-stats">${it.stats.map(s=>`<div><span>${s[0]}</span><b>${s[1]}</b></div>`).join('')}</div><div class="eq-meta"><span>부스트 기간: <b>${it.boost}</b></span><span class="eq-quality">품질 <b>${it.quality}%</b></span></div><div class="eq-bar"><i style="width:${Math.max(0,Math.min(100,it.quality))}%"></i></div></div>
 <div class="eq-actions"><button class="eq-remove">제거</button><button class="eq-upgrade">강화하기</button><button class="eq-boost">부스트</button></div>`;
 c.querySelector('.eq-remove').onclick=()=>{const a=load();a.splice(idx,1);save(a);render()};
 c.querySelector('.eq-upgrade').onclick=e=>{e.currentTarget.textContent='강화 준비';setTimeout(()=>e.currentTarget.textContent='강화하기',900)};
 c.querySelector('.eq-boost').onclick=e=>{e.currentTarget.classList.toggle('on');e.currentTarget.textContent=e.currentTarget.classList.contains('on')?'부스트 ON':'부스트'};
 list.appendChild(c)});
}
const css=document.createElement('style');css.textContent=`
.eq-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}.eq-head h2{margin:0 0 5px}.eq-total{font-weight:900;background:#111827;color:#fff;padding:8px 12px;border-radius:999px}.eq-list{display:grid;gap:12px}.eq-item{border:1px solid #d1d5db;border-radius:16px;background:#fff;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.04)}.eq-item.legendary{border-width:2px}.eq-slot-row{display:flex;align-items:center;gap:9px;background:#f8fafc;border-bottom:1px solid #e5e7eb;padding:10px 14px}.eq-slot-icon{font-size:22px}.eq-slot-name{font-weight:900;font-size:16px}.eq-rarity{margin-left:auto;font-size:12px;font-weight:900;padding:4px 8px;border-radius:999px;background:#e5e7eb}.legendary .eq-rarity{background:#fef3c7}.eq-main{padding:14px}.eq-title{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:12px}.eq-title b{font-size:18px}.eq-title span{font-size:12px;color:#6b7280;font-weight:700}.eq-stats{display:grid;grid-template-columns:repeat(3,minmax(120px,1fr));gap:8px}.eq-stats>div{display:flex;justify-content:space-between;gap:8px;background:#f8fafc;border:1px solid #eef2f7;border-radius:10px;padding:8px 10px}.eq-stats span{font-size:13px;color:#4b5563}.eq-stats b{font-size:14px}.eq-meta{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:12px;font-size:13px}.eq-quality{font-weight:800}.eq-bar{height:7px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-top:7px}.eq-bar i{display:block;height:100%;background:#111827;border-radius:inherit}.eq-actions{display:flex;gap:8px;padding:0 14px 14px}.eq-actions button{flex:1}.eq-remove{color:#b91c1c}.eq-boost.on{background:#111827;color:#fff}@media(max-width:760px){.eq-stats{grid-template-columns:1fr 1fr}.eq-actions{flex-wrap:wrap}.eq-actions button{min-width:110px}}@media(max-width:480px){.eq-stats{grid-template-columns:1fr}.eq-head{align-items:flex-start}.eq-total{font-size:12px}}`;
document.head.appendChild(css);
function boot(){if(view())render()}
setTimeout(boot,0);setTimeout(boot,400);setTimeout(boot,1200);
})();
