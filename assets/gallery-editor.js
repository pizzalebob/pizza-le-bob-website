const galleryPanel=document.getElementById('galleryPhotos');
let galleryBaseline=structuredClone(galleryPhotos);
function renderGallery(){
 galleryPanel.replaceChildren(...galleryPhotos.map((item,index)=>{
  const row=document.createElement('div');row.className='menu-editor';
  const title=document.createElement('h3');title.textContent='Added Gallery photo '+(index+1);
  const img=document.createElement('img');img.src=item.photo;img.alt=item.alt;
  const label=document.createElement('label');label.htmlFor='gallery-alt-'+index;label.textContent='Photo description (for accessibility)';
  const input=document.createElement('input');input.id=label.htmlFor;input.maxLength=200;input.value=item.alt;input.oninput=()=>{item.alt=input.value;img.alt=input.value;};
  const actions=document.createElement('div');actions.className='actions';
  const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Remove this added photo';remove.onclick=()=>{galleryPhotos.splice(index,1);renderGallery();status.textContent='Photo removed from draft. Press Save to website to publish.';};actions.append(remove);
  row.append(title,img,label,input,actions);return row;
 }));
 if(!galleryPhotos.length){const note=document.createElement('small');note.textContent='No extra Gallery photos added yet. Your existing Gallery photos are still on the website.';galleryPanel.append(note);}
 if(galleryPhotos.length||galleryBaseline.length){const undo=document.createElement('button');undo.type='button';undo.className='secondary';undo.textContent='Undo Gallery changes';undo.onclick=()=>{galleryPhotos=structuredClone(galleryBaseline);renderGallery();};galleryPanel.append(undo);}
}
window.addEventListener('galleryPhotosLoaded',()=>{galleryBaseline=structuredClone(galleryPhotos);renderGallery();});
window.addEventListener('galleryPhotosSaved',()=>{galleryBaseline=structuredClone(galleryPhotos);renderGallery();});
document.getElementById('galleryTab').addEventListener('click',renderGallery);
const galleryUpload=document.getElementById('galleryUpload'),galleryMessage=document.getElementById('galleryUploadStatus');
galleryUpload.onchange=async()=>{
 if(!galleryUpload.files[0])return;
 if(!loaded){galleryMessage.textContent='Website details are still loading. Please retry in a moment.';galleryUpload.value='';return;}
 if(galleryPhotos.length>=20){galleryMessage.textContent='You can add up to 20 Gallery photos. Remove an added photo to make room.';galleryUpload.value='';return;}
 uploading++;galleryUpload.disabled=true;galleryMessage.textContent='Resizing photo…';
 try{const photo=await resizePhoto(galleryUpload.files[0]);galleryPhotos.push({photo,alt:''});renderGallery();galleryMessage.textContent='Photo ready. Add a description and press Save to website to publish.';status.textContent='Gallery photo ready. Press Save to website to publish.';galleryPanel.querySelector('.menu-editor:last-of-type input')?.focus();}
 catch(error){galleryMessage.textContent=error.message;}
 finally{uploading--;galleryUpload.disabled=false;galleryUpload.value='';}
};
renderGallery();
