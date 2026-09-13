(()=>{
'use strict';
const WEIGHTS=[
  {level:1,p:50},
  {level:2,p:30},
  {level:3,p:10},
  {level:4,p:4},
  {level:5,p:2},
  {level:6,p:1},
  {level:7,p:1},
  {level:8,p:2}
];
function rollLevel(){
  let r=Math.random()*100;
  for(const x of WEIGHTS){
    if(r<x.p)return x.level;
    r-=x.p;
  }
  return 1;
}
function readCounts(){
  try{return JSON.parse(localStorage.getItem('arenaTicketLevelCounts')||'{}')}catch(_){return{}}
}
function writeCounts(c){try{localStorage.setItem('arenaTicketLevelCounts',JSON.stringify(c))}catch(_){}}
async function recordLevel(lv){
  const c=readCounts();c[lv]=Number(c[lv]||0)+1;writeCounts(c);
  try{
    if(sb&&currentUser)await sb.rpc('record_arena_ticket_level',{p_level:lv});
  }catch(_){ }
}
function markTicketCell(el){
  if(!el||el.dataset.arenaTicketLevel)return;
  const lv=rollLevel();
  el.dataset.arenaTicketLevel=String(lv);
  el.title=`${lv}레벨 투기장 티켓`;
  el.style.position='relative';
  const badge=document.createElement('span');
  badge.textContent=String(lv);
  badge.setAttribute('aria-label',`${lv}레벨 투기장 티켓`);
  badge.style.cssText='position:absolute;right:1px;bottom:0;font-size:9px;line-height:11px;font-weight:900;background:#111827;color:#fff;border-radius:999px;min-width:12px;height:12px;padding:0 2px;pointer-events:none';
  el.appendChild(badge);
  recordLevel(lv);
}
function scan(){
  const board=document.getElementById('board');
  if(!board)return;
  board.querySelectorAll('.arena-ticket-cell').forEach(markTicketCell);
}
const obs=new MutationObserver(scan);
obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
setInterval(scan,500);
window.ARENA_TICKET_LEVEL_WEIGHTS=Object.freeze({1:50,2:30,3:10,4:4,5:2,6:1,7:1,8:2});
window.getArenaTicketLevelCounts=readCounts;
})();
