const key='public-content';
const empty={mode:'weekly',events:[],special:{name:'',description:'',price:''}};
export async function onRequestGet({env}){
  const content=await env.CONTENT.get(key,{type:'json'});
  return Response.json(content||empty,{headers:{'Cache-Control':'no-store'}});
}
