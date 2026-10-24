(() => {
  'use strict';
  if(!['/','/index.html'].includes(location.pathname))return;
  const pages=new Set(['home','popup','menu','story','weddings','corporate','book','gallery','provenance','reviews','privacy']);
  const choiceKey='plb-analytics-choice-v1';
  let choice=null,lastPage=null;
  try{choice=localStorage.getItem(choiceKey);localStorage.removeItem('plb-analytics-visitor-v1');}catch{}
  const privacySignal=navigator.globalPrivacyControl===true || navigator.doNotTrack==='1';
  function track(){
    if(choice==='no'||privacySignal)return;
    const page=document.querySelector('body > section.active-section')?.id || 'home';
    if(!pages.has(page)||lastPage===page)return;
    lastPage=page;
    const body=JSON.stringify({page,event:crypto.randomUUID(),mode:'aggregate',...(new URLSearchParams(location.search).get('analytics_test')==='1'?{test:true}:{})});
    fetch('/api/visit',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
  }
  const settings=document.createElement('button');settings.type='button';
  settings.style.cssText='padding:10px 14px;margin-top:12px;border:1px solid currentColor;border-radius:6px;background:transparent;color:inherit;cursor:pointer;font:inherit';
  function label(){settings.textContent=privacySignal?'Page counting disabled by your browser privacy setting':choice==='no'?'Enable anonymous page counting':'Turn off anonymous page counting';settings.disabled=privacySignal;}
  settings.onclick=()=>{choice=choice==='no'?'yes':'no';try{localStorage.setItem(choiceKey,choice);}catch{}lastPage=null;label();track();};
  document.querySelector('#privacy .wrap')?.append(settings);label();
  window.addEventListener('hashchange',()=>requestAnimationFrame(track));
  window.addEventListener('storage',e=>{if(e.key===choiceKey){choice=e.newValue;lastPage=null;label();track();}});
  track();
})();
