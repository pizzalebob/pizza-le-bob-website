(() => {
  'use strict';
  if(!['/','/index.html'].includes(location.pathname))return;
  const pages=new Set(['home','popup','menu','story','weddings','corporate','book','gallery','provenance','reviews','privacy']);
  const choiceKey='plb-analytics-choice-v1',visitorKey='plb-analytics-visitor-v1';
  let choice=null,visitor=null,lastPage=null,blocked=false;
  try{choice=localStorage.getItem(choiceKey);visitor=localStorage.getItem(visitorKey);}catch{blocked=true;}
  // Honour browser privacy signals and do not create a persistent identifier before consent.
  const privacySignal=navigator.globalPrivacyControl===true || navigator.doNotTrack==='1';
  if(privacySignal)choice='no';
  const bar=document.createElement('aside');bar.setAttribute('aria-label','Anonymous analytics choice');bar.className='plb-analytics-choice';bar.hidden=true;
  const text=document.createElement('p');text.textContent='Help us understand which pages people visit? Allow anonymous visitor statistics on this browser. Your choice does not affect using the website.';
  const allow=document.createElement('button');allow.type='button';allow.textContent='Allow analytics';
  const reject=document.createElement('button');reject.type='button';reject.textContent='No thanks';
  const details=document.createElement('a');details.href='#privacy';details.textContent='Privacy details';
  bar.append(text,allow,reject,details);document.body.append(bar);
  const style=document.createElement('style');style.textContent='.plb-analytics-choice[hidden]{display:none!important}.plb-analytics-choice{position:fixed;bottom:14px;left:14px;right:14px;z-index:9999;max-width:650px;margin:auto;padding:16px;background:#faf7f0;color:#172a3f;border:1px solid #abb7b6;border-radius:10px;box-shadow:0 3px 20px #0002;font:14px/1.5 system-ui}.plb-analytics-choice p{margin:0 0 10px}.plb-analytics-choice button,.plb-analytics-choice a{margin:4px 10px 0 0;font:inherit}.plb-analytics-choice button{padding:9px 12px;border:1px solid #172a3f;border-radius:6px;background:#172a3f;color:white;cursor:pointer}.plb-analytics-choice button+button{background:white;color:#172a3f}.plb-analytics-choice a{color:#172a3f}';document.head.append(style);
  function visiblePage(){const active=document.querySelector('body > section.active-section');return active?.id || 'home';}
  function track(){
    if(choice!=='yes'||privacySignal||blocked)return;
    const page=visiblePage();if(!pages.has(page)||lastPage===page)return;lastPage=page;
    if(!visitor){visitor=crypto.randomUUID();try{localStorage.setItem(visitorKey,visitor);}catch{blocked=true;return;}}
    const body=JSON.stringify({page,visitor,event:crypto.randomUUID(),consent:true,...(new URLSearchParams(location.search).get('analytics_test')==='1'?{test:true}:{})});
    // Fail silently: analytics must never prevent browsing, bookings or editor saves.
    fetch('/api/visit',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
  }
  function choose(value){choice=value;bar.hidden=true;lastPage=null;try{localStorage.setItem(choiceKey,value);if(value==='no'){localStorage.removeItem(visitorKey);visitor=null;}}catch{blocked=true;}track();}
  allow.onclick=()=>choose('yes');reject.onclick=()=>choose('no');
  const settings=document.createElement('button');settings.type='button';settings.textContent='Change visitor analytics choice';settings.style.cssText='padding:10px 14px;margin-top:12px;border:1px solid currentColor;border-radius:6px;background:transparent;color:inherit;cursor:pointer;font:inherit';
  settings.onclick=()=>{if(privacySignal){settings.textContent='Analytics disabled by your browser privacy setting';return;}bar.hidden=false;allow.focus();};
  document.querySelector('#privacy .wrap')?.append(settings);
  if(!choice&&!blocked&&!privacySignal)bar.hidden=false;
  window.addEventListener('hashchange',()=>requestAnimationFrame(track));
  window.addEventListener('storage',e=>{if(e.key===choiceKey){choice=e.newValue;try{visitor=localStorage.getItem(visitorKey);}catch{blocked=true;}lastPage=null;bar.hidden=!!choice;track();}});
  track();
})();
