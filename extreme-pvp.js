(()=>{
'use strict';
const KEY='msSuiteV3';
let match=null,aiTimer=null;

function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(_){return{}}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new CustomEvent('mso-state-changed'))}
function state(){const s=load();s.lp=Number(s.lp||0);s.mmr=Number(s.mmr||1000);s.pvp??={wins:0,losses:0};s.pvpExtreme??={wins:0,losses:0};s.gems??={};return s}
function emeraldChance(){let bonus=0;try{bonus=Number((window.getEquipmentBonuses?.()||{}).emerald||0)}catch(_){}return Math.min(100,10*(1+bonus/100))}

const css=document.createElement('style');
css.textContent=`
body.xpvp-page #gameView{display:none!important;visibility:hidden!important;pointer-events:none!important}
#xpvpCard,#xpvpCard *{pointer-events:auto!important}
.xpvp-wrap{margin-top:14px;position:relative;z-index:5}
.xpvp-top{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0}
.xpvp-score{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}
.xpvp-panel{border:1px solid #dbe3ec;border-radius:12px;background:#fff;padding:12px}
.xpvp-board{display:grid;grid-template-columns:repeat(9,26px);gap:2px;width:max-content;margin-top:8px;position:relative;z-index:10}
.xpvp-cell{width:26px;height:26px;padding:0;border:1px solid #b8c1cc;border-radius:3px;background:#dbe3ec;font-size:12px;font-weight:900;cursor:pointer;position:relative;z-index:11}
.xpvp-cell.open{background:#fff}.xpvp-cell.mine{background:#ef4444;color:#fff}.xpvp-cell.extra{background:#fef3c7;border-color:#f59e0b}
.xpvp-opponent .xpvp-cell{cursor:default;pointer-events:none!important}
.xpvp-feed{margin-top:9px;font-weight:800;min-height:22px}.xpvp-mode{font-size:13px;color:#6b7280}
.xpvp-result{display:none;margin-top:14px;border-radius:16px;padding:18px;text-align:center;border:2px solid #d1d5db;background:#fff}
.xpvp-result.show{display:block}.xpvp-result.win{border-color:#22c55e;background:#f0fdf4}.xpvp-result.loss{border-color:#ef4444;background:#fef2f2}
.xpvp-result-title{font-size:30px;font-weight:1000}.xpvp-added{font-size:12px;color:#b45309;font-weight:800;margin-top:4px}
@media(max-width:700px){.xpvp-score{grid-template-columns:1fr}.xpvp-board{grid-template-columns:repeat(9,24px)}.xpvp-cell{width:24px;height:24px}}
`;
document.head.appendChild(css);

function recount(b){for(let i=0;i<81;i++){const x=b[i];if(!x)continue;if(x.mine){x.num=0;continue}const r=Math.floor(i/9),c=i%9;let n=0;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const rr=r+dr,cc=c+dc;if(rr>=0&&rr<9&&cc>=0&&cc<9&&b[rr*9+cc]?.mine)n++}x.num=n}}
function makeBoard(){const b=Array.from({length:81},(_,i)=>({i,mine:false,open:false,num:0,extra:false}));let n=0;while(n<10){const i=Math.floor(Math.random()*81);if(!b[i].mine){b[i].mine=true;n++}}recount(b);return b}
function makeFirstSafe(b,i){if(!b[i]?.mine)return;const r=b.slice(0,81).find(x=>!x.mine&&x.i!==i&&!x.open);if(!r)return;b[i].mine=false;r.mine=true;recount(b)}
function flood(b,start){const q=[start],seen=new Set();let count=0;while(q.length){const i=q.shift();if(seen.has(i))continue;seen.add(i);const x=b[i];if(!x||x.open||x.mine||x.extra)continue;x.open=true;count++;if(x.num===0){const r=Math.floor(i/9),c=i%9;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<9&&cc>=0&&cc<9)q.push(rr*9+cc)}}}return count}
function safeLeft(b){return b.filter(x=>!x.mine&&!x.open).length}
function extraLeft(b){return b.filter(x=>x.extra&&!x.open).length}
function addTen(b){for(let i=0;i<10;i++)b.push({i:b.length,mine:false,open:false,num:0,extra:true})}
function explodeNine(b,idx){const r=Math.floor(idx/9),c=idx%9;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=r+dr,cc=c+dc;if(rr<0||rr>=9||cc<0||cc>=9)continue;const x=b[rr*9+cc];if(x)x.open=true}}

function isPvp(){const h=document.querySelector('#msoView h2');return !!h&&h.textContent.trim()==='PvP'}
function ensureUI(){
 const host=document.getElementById('msoView');
 if(!host||!isPvp()){document.body.classList.remove('xpvp-page');return}
 document.body.classList.add('xpvp-page');
 document.getElementById('gameView')?.classList.add('hidden');
 const old=host.querySelector('[data-pvp="match"]')?.closest('.mso-card');if(old)old.style.display='none';
 if(host.querySelector('#xpvpCard'))return;
 const s=state();
 const card=document.createElement('div');card.id='xpvpCard';card.className='mso-card xpvp-wrap';
 card.innerHTML=`<h3>⚔️ PvP 보드 대전</h3>
 <div class="xpvp-top"><button type="button" class="mso-action primary" id="pvpNormalStart">일반 PvP 시작</button><button type="button" class="mso-action" id="xpvpStart">💥 익스트림 PvP 시작</button><span>LP ${s.lp} · MMR ${s.mmr}</span></div>
 <div class="xpvp-mode">익스트림: 10칸 해결할 때마다 상대에게 해결해야 할 칸 +10 · 승리 시 에메랄드 기본 10%</div>
 <div id="xpvpGame" style="display:none"><div class="xpvp-score">
 <div class="xpvp-panel"><b>나</b><div>남은 해결 칸 <span id="xpvpMeLeft">71</span></div><div class="xpvp-added">추가 칸 <span id="xpvpMeExtra">0</span></div><div id="xpvpMe" class="xpvp-board"></div></div>
 <div class="xpvp-panel xpvp-opponent"><b>상대</b><div>남은 해결 칸 <span id="xpvpOpLeft">71</span></div><div class="xpvp-added">추가 칸 <span id="xpvpOpExtra">0</span></div><div id="xpvpOp" class="xpvp-board"></div></div>
 </div><div id="xpvpFeed" class="xpvp-feed"></div><div id="xpvpResult" class="xpvp-result"><div id="xpvpResultTitle" class="xpvp-result-title"></div><div id="xpvpResultText"></div><div id="xpvpResultReward"></div></div></div>`;
 host.appendChild(card);
}

function renderBoard(el,b,opp){el.innerHTML='';b.forEach((x,i)=>{const c=document.createElement('button');c.type='button';c.dataset.xpvpCell=String(i);c.className='xpvp-cell'+(x.open?' open':'')+(x.open&&x.mine?' mine':'')+(x.extra?' extra':'');if(x.extra)c.textContent=x.open?'✓':'+';else if(x.open)c.textContent=x.mine?'💥':(x.num||'');if(opp)c.disabled=true;el.appendChild(c)})}
function update(){if(!match)return;const me=document.getElementById('xpvpMe'),op=document.getElementById('xpvpOp');if(!me||!op)return;renderBoard(me,match.me,false);renderBoard(op,match.op,true);document.getElementById('xpvpMeLeft').textContent=safeLeft(match.me);document.getElementById('xpvpOpLeft').textContent=safeLeft(match.op);document.getElementById('xpvpMeExtra').textContent=extraLeft(match.me);document.getElementById('xpvpOpExtra').textContent=extraLeft(match.op)}
function feed(t){const e=document.getElementById('xpvpFeed');if(e)e.textContent=t}
function start(mode){ensureUI();clearInterval(aiTimer);match={mode,me:makeBoard(),op:makeBoard(),meProgress:0,opProgress:0,ended:false,meFirst:true,opFirst:true};const g=document.getElementById('xpvpGame');if(!g)return;g.style.display='block';const r=document.getElementById('xpvpResult');if(r)r.className='xpvp-result';feed(mode==='extreme'?'💥 익스트림 시작!':'⚔️ 일반 PvP 시작!');update();aiTimer=setInterval(aiMove,mode==='extreme'?3000:2700)}
function attack(who,n,target){if(match.mode!=='extreme')return;const k=who==='me'?'meProgress':'opProgress';match[k]+=n;while(match[k]>=10){match[k]-=10;addTen(target);feed(who==='me'?'💥 상대 해결 칸 +10!':'⚠️ 내 해결 칸 +10!')}}
function playerOpen(i){if(!match||match.ended)return;const x=match.me[i];if(!x||x.open)return;if(x.extra){x.open=true;attack('me',1,match.op);update();checkWin();return}if(match.meFirst){makeFirstSafe(match.me,i);match.meFirst=false}if(match.me[i].mine){explodeNine(match.me,i);feed('💥 지뢰! 누른 칸 주변 3×3만 터졌어.');update();checkWin();return}const n=flood(match.me,i);attack('me',n,match.op);update();checkWin()}
function aiMove(){if(!match||match.ended)return;const extras=match.op.filter(x=>x.extra&&!x.open);if(extras.length){extras[0].open=true;attack('op',1,match.me);update();checkWin();return}const a=match.op.slice(0,81).filter(x=>!x.mine&&!x.open);if(!a.length){checkWin();return}const x=a[Math.floor(Math.random()*a.length)];if(match.opFirst){makeFirstSafe(match.op,x.i);match.opFirst=false}const n=flood(match.op,x.i);attack('op',Math.min(n,3),match.me);update();checkWin()}
function checkWin(){if(!match||match.ended)return;if(safeLeft(match.me)===0)finish(true,'내가 먼저 모든 칸을 해결했어!');else if(safeLeft(match.op)===0)finish(false,'상대가 먼저 모든 칸을 해결했어.')}
function finish(win,msg){match.ended=true;clearInterval(aiTimer);const s=state();let got=false;const chance=emeraldChance();if(win){s.pvp.wins++;if(match.mode==='extreme')s.pvpExtreme.wins++;s.lp+=3;s.mmr+=2;s.achievements??={};s.achievements.pvpWin=true;if(Math.random()*100<chance){s.gems.emerald=Number(s.gems.emerald||0)+1;got=true}}else{s.pvp.losses++;if(match.mode==='extreme')s.pvpExtreme.losses++;s.lp=Math.max(0,s.lp-2);s.mmr=Math.max(100,s.mmr-2)}save(s);feed(win?'🏆 승리!':'💥 패배');const box=document.getElementById('xpvpResult');if(box){box.className='xpvp-result show '+(win?'win':'loss');document.getElementById('xpvpResultTitle').textContent=win?'🏆 승리!':'💥 패배';document.getElementById('xpvpResultText').textContent=msg;document.getElementById('xpvpResultReward').textContent=win?`LP +3 · MMR +2 · 에메랄드 ${got?'+1 획득!':`미획득 (${chance.toFixed(1)}%)`}`:'LP -2 · MMR -2'}}

// 버블 단계 이벤트 위임: 다른 메뉴/장비 클릭을 막지 않는다.
document.addEventListener('click',e=>{
 const t=e.target;
 if(!(t instanceof Element))return;
 if(t.id==='pvpNormalStart'){e.preventDefault();start('normal');return}
 if(t.id==='xpvpStart'){e.preventDefault();start('extreme');return}
 const c=t.closest('[data-xpvp-cell]');if(c&&c.closest('#xpvpMe')){e.preventDefault();playerOpen(Number(c.dataset.xpvpCell))}
});

setInterval(ensureUI,500);
setTimeout(ensureUI,0);
})();