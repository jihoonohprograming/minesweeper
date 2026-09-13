(()=>{
  function applyArenaLevelLabels(){
    const buttons=document.querySelectorAll('.arena-level-btn');
    if(!buttons.length)return;
    buttons.forEach(btn=>{
      const lv=Number(btn.dataset.level||0);
      if(lv>=1&&lv<=8){
        let lang='ko';
        try{lang=currentLang==='en'?'en':'ko'}catch(_){}
        btn.textContent=lang==='en'?`⚔️ Level ${lv} Arena`:`⚔️ ${lv}레벨 투기장`;
      }
    });
  }
  const obs=new MutationObserver(applyArenaLevelLabels);
  obs.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(applyArenaLevelLabels,0));
  setTimeout(applyArenaLevelLabels,0);
  setTimeout(applyArenaLevelLabels,300);
  setTimeout(applyArenaLevelLabels,1000);
})();
