(()=>{
'use strict';
const weights=[50,30,10,4,2,1,1,2];
function divide(total){
 const raw=weights.map(x=>total*x/100),out=raw.map(Math.floor);
 let rest=total-out.reduce((a,b)=>a+b,0);
 const order=raw.map((x,i)=>[i,x-Math.floor(x)]).sort((a,b)=>b[1]-a[1]||a[0]-b[0]);
 for(let i=0;i<rest;i++)out[order[i][0]]++;
 return out;
}
async function migrate(){
 if(!window.sb||!window.currentUser)return false;
 const mark='arena-ratio-20260913-'+currentUser.id;
 if(localStorage.getItem(mark))return true;
 const q=await sb.from('wallets').select('ticket').eq('user_id',currentUser.id).maybeSingle();
 if(q.error||!q.data)return false;
 const total=Math.max(0,Math.floor(Number(q.data.ticket||0))),a=divide(total);
 const row={user_id:currentUser.id,l1:a[0],l2:a[1],l3:a[2],l4:a[3],l5:a[4],l6:a[5],l7:a[6],l8:a[7],updated_at:new Date().toISOString()};
 const u=await sb.from('arena_ticket_levels').upsert(row,{onConflict:'user_id'});
 if(u.error)return false;
 localStorage.setItem('arenaTicketLevelCounts',JSON.stringify({1:a[0],2:a[1],3:a[2],4:a[3],5:a[4],6:a[5],7:a[6],8:a[7]}));
 localStorage.setItem(mark,'1');
 window.dispatchEvent(new CustomEvent('arena-ticket-levels-changed',{detail:{migrated:true}}));
 return true;
}
let n=0;const timer=setInterval(async()=>{n++;if(await migrate()||n>15)clearInterval(timer)},1000);
})();