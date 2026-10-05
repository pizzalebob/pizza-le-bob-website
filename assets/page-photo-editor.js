import {PHOTO_SLOTS} from './page-photo-config.js';
const photoPanels={wedding:document.getElementById('weddingPhotos'),corporate:document.getElementById('corporatePhotos')};
let currentSources=null,sourcesPromise=null,baseline={};
function rememberBaseline(){baseline=structuredClone(pagePhotos);}
window.addEventListener('pagePhotosLoaded',()=>{rememberBaseline();if(currentSources)renderPhotoPanels();});
rememberBaseline();
async function getSources(){
 if(currentSources)return currentSources;
 if(sourcesPromise)return sourcesPromise;
 sourcesPromise=(async()=>{
  const response=await fetch('/',{cache:'no-store'});if(!response.ok)throw Error('Current photos could not be loaded. Please retry.');
  const doc=new DOMParser().parseFromString(await response.text(),'text/html');const sources={};
  for(const [id,slot]of Object.entries(PHOTO_SLOTS)){
   const img=doc.querySelectorAll(slot.selector)[slot.index];
   if(slot.optional){sources[id]='';continue;}
   if(!img?.getAttribute('src'))throw Error('A current photo could not be found. Please retry.');
   sources[id]=img.getAttribute('src');
  }
  currentSources=sources;return sources;
 })();
 try{return await sourcesPromise;}finally{sourcesPromise=null;}
}
function renderPhotoPanels(){
 for(const [page,panel]of Object.entries(photoPanels)){
  panel.replaceChildren(...Object.entries(PHOTO_SLOTS).filter(([,slot])=>slot.page===page).map(([id,slot])=>{
   const row=document.createElement('div');row.className='menu-editor';
   const title=document.createElement('h3');title.textContent=slot.label;
   const position=document.createElement('small');position.textContent=slot.position;
   const img=document.createElement('img');const source=pagePhotos[id]?.photo||currentSources[id];if(source)img.src=source;img.hidden=!source;img.alt=pagePhotos[id]?.alt||slot.alt;
   const note=document.createElement('small');note.textContent=slot.optional&&!source?'Blank — no photo published yet':'Current photo / replacement preview';row.append(title,position,note,img);
   function draft(){return pagePhotos[id]||(pagePhotos[id]={photo:'',alt:slot.alt,...(slot.caption!==undefined?{caption:slot.caption}:{})});}
   for(const field of ['alt',...(slot.caption!==undefined?['caption']:[])]){
    const label=document.createElement('label');label.htmlFor=id+'-'+field;label.textContent=field==='alt'?'Photo description (for accessibility)':'Caption shown on the wedding page';
    const input=document.createElement('input');input.id=label.htmlFor;input.maxLength=200;input.value=pagePhotos[id]?.[field]??slot[field];
    input.oninput=()=>{draft()[field]=input.value;if(field==='alt')img.alt=input.value;};row.append(label,input);
   }
   const label=document.createElement('label');label.htmlFor=id+'-upload';label.textContent='Upload / replace this photo';
   const file=document.createElement('input');file.id=label.htmlFor;file.type='file';file.accept='image/jpeg,image/png,image/webp';
   const message=document.createElement('small');message.setAttribute('role','status');
   file.onchange=async()=>{
    if(!file.files[0])return;uploading++;file.disabled=true;revert.disabled=true;message.textContent='Resizing photo…';
    try{const photo=await resizePhoto(file.files[0]);draft().photo=photo;img.src=photo;img.hidden=false;note.textContent='Photo preview';message.textContent='Replacement ready. Press Save to website to publish.';status.textContent='Photo ready. Press Save to website to publish.';}
    catch(error){message.textContent=error.message;}
    finally{uploading--;file.disabled=false;revert.disabled=false;file.value='';}
   };
   const actions=document.createElement('div');actions.className='actions';
   const revert=document.createElement('button');revert.type='button';revert.className='secondary';revert.textContent='Undo changes to this photo';
   revert.onclick=()=>{if(baseline[id])pagePhotos[id]=structuredClone(baseline[id]);else delete pagePhotos[id];renderPhotoPanels();status.textContent='Photo draft restored to the last saved version.';};
   if(slot.optional){const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Leave Photo 3 blank';remove.onclick=()=>{draft().photo='';renderPhotoPanels();status.textContent='Photo 3 will be blank after you save.';};actions.append(remove);}
   actions.append(revert);row.append(label,file,message,actions);return row;
  }));
 }
}
async function openPhotos(page){
 const panel=photoPanels[page];if(!loaded){panel.textContent='Website details are still loading. Please try this tab again in a moment.';return;}
 if(currentSources)return;
 panel.textContent='Loading your current website photos…';
 try{await getSources();renderPhotoPanels();}catch(error){panel.textContent=error.message;}
}
for(const page of ['wedding','corporate'])document.getElementById(page+'Tab').addEventListener('click',()=>openPhotos(page));
window.addEventListener('pagePhotosSaved',()=>{rememberBaseline();for(const [id,item]of Object.entries(pagePhotos))if(item.photo&&!PHOTO_SLOTS[id].optional)currentSources&&(currentSources[id]=item.photo);});
