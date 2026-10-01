const forms = {
  bookingForm: {title:'Event booking enquiry',required:['name','email','date'],fields:{name:'Name',email:'Email',date:'Event date',guests:'Guests',location:'Venue/location',message:'Event details'}},
  corporateForm: {title:'Corporate booking enquiry',required:['corpCompany','corpContact','corpPhone','corpGuests','corpAddress','corpDate','corpTime','corpAccess','corpPackage'],fields:{corpCompany:'Company',corpContact:'Contact name',corpPhone:'Contact number',corpGuests:'Guest count',corpAddress:'Venue',corpDate:'Event date',corpTime:'Event time',corpAccess:'Trailer access',corpPackage:'Package',corpOther:'Event details'}}
};
const json=(status,data)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function onRequestPost({request,env}){
  const origin=request.headers.get('Origin');
  if(origin!==new URL(request.url).origin)return json(403,{success:false});
  if(!request.headers.get('Content-Type')?.includes('application/json'))return json(415,{success:false});
  if(!env.RESEND_API_KEY||!env.ENQUIRY_FROM||env.ENQUIRY_ENABLED!=='true')return json(503,{success:false});
  const raw=await request.text();
  if(raw.length>16000)return json(413,{success:false});
  let data;try{data=JSON.parse(raw);}catch{return json(400,{success:false});}
  if(data.honey)return json(400,{success:false});
  const schema=forms[data.type];
  if(!schema||!data.fields||typeof data.fields!=='object'||Array.isArray(data.fields))return json(400,{success:false});
  const fields=data.fields;
  if(Object.keys(fields).some(k=>!(k in schema.fields)))return json(400,{success:false});
  for(const [key,value] of Object.entries(fields)){
    if(typeof value!=='string'||value.length>2000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))return json(400,{success:false});
  }
  if(schema.required.some(k=>!fields[k]?.trim()))return json(400,{success:false});
  if(fields.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))return json(400,{success:false});
  for(const key of ['date','corpDate'])if(fields[key]&&!/^\d{4}-\d{2}-\d{2}$/.test(fields[key]))return json(400,{success:false});
  for(const key of ['guests','corpGuests'])if(fields[key]&&(!/^\d+$/.test(fields[key])||Number(fields[key])<1))return json(400,{success:false});
  const text=Object.entries(schema.fields).map(([k,label])=>`${label}: ${fields[k]?.trim()||'Not given'}`).join('\n');
  try{
    const response=await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({from:env.ENQUIRY_FROM,to:['pizzalebob@gmail.com'],subject:schema.title,text,...(fields.email?{reply_to:fields.email}:{})}),signal:AbortSignal.timeout(15000)
    });
    if(!response.ok)return json(502,{success:false});
    const result=await response.json();
    if(!result.id)return json(502,{success:false});
    return json(200,{success:true});
  }catch{return json(502,{success:false});}
}
