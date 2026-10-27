import {allergenPage, allergenHeaders} from '../lib/allergen-page.js';
export async function onRequestGet() {
  return new Response(allergenPage(null, {sign:true}), {headers:allergenHeaders});
}
