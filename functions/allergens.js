import {allergenPage, allergenHeaders, publicSnapshot} from '../lib/allergen-page.js';

export async function onRequestGet() {
  let snapshot = null;
  try {
    const response = await fetch('https://pizza-le-bob-food-staff-quiz.pizzalebob.workers.dev/api/public-allergens', {
      headers:{'Accept':'application/json','Cache-Control':'no-cache'},
      cf:{cacheTtl:0,cacheEverything:false}, redirect:'error', signal:AbortSignal.timeout(5000)
    });
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) snapshot = publicSnapshot(await response.json());
  } catch { /* Fail closed: never invent information or serve a stale list. */ }
  // The page is available even when server-to-server retrieval is unavailable:
  // its browser loader validates and reads the same published public projection.
  return new Response(allergenPage(snapshot), {status:200, headers:allergenHeaders});
}
