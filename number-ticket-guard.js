(()=>{
'use strict';
const seen=new WeakSet();
function takeNewOpen(rootId){const root=document.getElementById(rootId);if(!root)return null;let found=null;root.querySelectorAll('.cell.open').forEach(el=>{if(!seen.has(el)){seen.add(el);found=el}});return found}
function install(){try{if(!sb||!sb.rpc||sb.__numberTicketGuard)return;const old=sb.rpc.bind(sb);sb.rpc=async function(name,args,opts){if(name==='normal_cell_reward'||name==='arena_cell_reward'||name==='arena_cell_reward_test'){const arena=name!=='normal_cell_reward'&&document.getElementById('arenaView')?.classList.contains('active');const el=takeNewOpen(arena?'arenaBoard':'board');if(el&&el.textContent.trim()==='')return{data:{ticket_awarded:false},error:null}}return old(name,args,opts)};sb.__numberTicketGuard=true}catch(_){}}
setTimeout(install,1200);setInterval(install,3000);
})();