(()=>{
'use strict';
const KEY='msSuiteV3';
let lastText='';
function bonus(){try{return Math.max(0,Number((window.getEquipmentBonuses?.()||{}).emerald||0))}catch(_){return 0}}
function qty(){return Math.max(1,Math.floor(bonus()/100))}
function apply(){
  const e=document.getElementById('xpvpResultReward');
  if(!e)return;
  const t=e.textContent||'';
  if(!t.includes('에메랄드')||!t.includes('+1 획득'))return;
  if(t===lastText)return;
  lastText=t;
  const n=qty();
  if(n<=1)return;
  try{
    const s=JSON.parse(localStorage.getItem(KEY)||'{}')||{};
    s.gems??={};
    s.gems.emerald=Number(s.gems.emerald||0)+(n-1);
    localStorage.setItem(KEY,JSON.stringify(s));
    window.dispatchEvent(new CustomEvent('mso-state-changed'));
    e.textContent=t.replace('+1 획득!',`+${n} 획득!`);
    lastText=e.textContent;
  }catch(_){ }
}
new MutationObserver(()=>apply()).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
setInterval(apply,500);
})();
