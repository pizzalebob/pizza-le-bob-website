(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let data=null,loading=false;
  const number=value=>new Intl.NumberFormat('en-GB').format(value);
  const date=value=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
  function measure(){return {views:0,visitors:new Set()};}
  function add(metric,event){metric.views++;metric.visitors.add(event.u);}
  function aggregate(events,pages){
    const total=measure(),byPage={},weeks={};let first=null;
    for(const page of Object.keys(pages))byPage[page]=measure();
    for(const e of events){
      if(!byPage[e.p])continue;
      add(total,e);add(byPage[e.p],e);
      if(!weeks[e.w])weeks[e.w]={total:measure(),pages:{}};
      if(!weeks[e.w].pages[e.p])weeks[e.w].pages[e.p]=measure();
      add(weeks[e.w].total,e);add(weeks[e.w].pages[e.p],e);
      if(!first||e.t<first)first=e.t;
    }
    return {total,byPage,weeks,first};
  }
  function cell(value,heading=false){const el=document.createElement(heading?'th':'td');el.textContent=value;if(heading)el.scope='row';return el;}
  function weekList(current,count){const result=[];const d=new Date(current+'T12:00:00Z');for(let i=0;i<count;i++){result.unshift(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()-7);}return result;}
  function render(){
    if(!data)return;
    const selected=$('statsWeek').value,weekly=data.stats.weeks[selected]?.total||measure();
    $('statsWeeklyVisitors').textContent=number(weekly.visitors.size);$('statsWeeklyViews').textContent=number(weekly.views);
    $('statsTotalVisitors').textContent=number(data.stats.total.visitors.size);$('statsTotalViews').textContent=number(data.stats.total.views);
    $('statsRows').replaceChildren(...Object.entries(data.pages).map(([page,name])=>{
      const week=data.stats.weeks[selected]?.pages[page]||measure(),all=data.stats.byPage[page];
      const tr=document.createElement('tr');tr.append(cell(name,true),cell(number(week.visitors.size)),cell(number(week.views)),cell(number(all.visitors.size)),cell(number(all.views)));return tr;
    }));
    const page=$('statsPage').value,count=Number($('statsRange').value),weeks=weekList(data.currentWeek,count);
    const series=weeks.map(w=>{const m=page==='all'?data.stats.weeks[w]?.total:data.stats.weeks[w]?.pages[page];return {week:w,visitors:m?.visitors.size||0,views:m?.views||0};});
    const maximum=Math.max(1,...series.map(r=>r.views));
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox',`0 0 610 ${series.length*38+35}`);svg.setAttribute('role','img');
    const title=document.createElementNS(ns,'title');title.textContent=`Weekly visitors and page views: ${page==='all'?'overall website':data.pages[page]}`;svg.append(title);
    function text(x,y,value){const el=document.createElementNS(ns,'text');el.setAttribute('x',x);el.setAttribute('y',y);el.setAttribute('font-size','11');el.setAttribute('fill','#172a3f');el.textContent=value;svg.append(el);}
    series.forEach((r,i)=>{
      const y=24+i*38;text(0,y+8,date(r.week));
      for(const [value,colour,offset] of [[r.visitors,'#315d68',0],[r.views,'#be754c',14]]){
        const rect=document.createElementNS(ns,'rect');rect.setAttribute('x','118');rect.setAttribute('y',y+offset-2);rect.setAttribute('height','11');rect.setAttribute('width',value/maximum*400);rect.setAttribute('fill',colour);rect.setAttribute('rx','2');svg.append(rect);text(124+value/maximum*400,y+offset+7,number(value));
      }
    });
    $('statsGraph').replaceChildren(svg);
    $('statsGraphRows').replaceChildren(...series.map(r=>{const tr=document.createElement('tr');tr.append(cell(date(r.week),true),cell(number(r.visitors)),cell(number(r.views)));return tr;}));
    $('statsUpdated').textContent=`Updated ${new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'}).format(new Date(data.updatedAt))} (UK time). New visits can take a minute to appear.`;
    $('statsSince').textContent=data.stats.first?`Cumulative figures since ${date(data.stats.first.slice(0,10))}.`:'Tracking is enabled. The first consenting visit will start your cumulative figures.';
  }
  async function load(){
    if(loading)return;loading=true;$('statsRefresh').disabled=true;$('statsMessage').textContent='Loading visitor statistics…';
    try {
      const events=[];let cursor=null,meta=null;const seen=new Set();
      do {
        const response=await fetch('/admin/api/statistics'+(cursor?'?cursor='+encodeURIComponent(cursor):''),{cache:'no-store'});
        if(!response.ok)throw Error(response.status===401||response.status===403?'Please sign in to your editor again to view private statistics.':'Statistics could not be loaded. Please retry.');
        if(!response.headers.get('Content-Type')?.includes('application/json'))throw Error('Please sign in to your editor again to view private statistics.');
        meta=await response.json();if(!Array.isArray(meta.events))throw Error('Statistics could not be loaded. Please retry.');
        events.push(...meta.events);cursor=meta.nextCursor;
        if(cursor){if(seen.has(cursor))throw Error('Statistics could not be loaded completely. Please retry.');seen.add(cursor);}
      }while(cursor);
      const previous=$('statsWeek').value,previousPage=$('statsPage').value;
      data={...meta,stats:aggregate(events,meta.pages)};
      const weeks=[...new Set([meta.currentWeek,...Object.keys(data.stats.weeks)])].sort().reverse();
      $('statsWeek').replaceChildren(...weeks.map(w=>{const option=document.createElement('option');option.value=w;option.textContent='Week beginning '+date(w)+(w===meta.currentWeek?' (current week)':'');return option;}));
      if(weeks.includes(previous))$('statsWeek').value=previous;
      $('statsPage').replaceChildren(...Object.entries({all:'Overall website',...meta.pages}).map(([id,name])=>{const option=document.createElement('option');option.value=id;option.textContent=name;return option;}));
      if(Object.hasOwn(meta.pages,previousPage))$('statsPage').value=previousPage;
      $('statsResults').hidden=false;$('statsMessage').textContent=events.length?'Private visitor statistics loaded.':'No consenting visits recorded yet. Figures will appear as visitors use the website.';render();
    }catch(error){$('statsResults').hidden=true;$('statsMessage').textContent=error.message;}
    finally{loading=false;$('statsRefresh').disabled=false;}
  }
  $('statsRefresh').onclick=load;
  for(const id of ['statsWeek','statsPage','statsRange'])$(id).onchange=render;
  $('statsTab').addEventListener('click',()=>{if(!data)load();});
})();
