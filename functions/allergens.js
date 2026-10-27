import {allergenPage, allergenHeaders, publicSnapshot} from '../lib/allergen-page.js';

export async function onRequestGet() {
  let snapshot = null;
  try {
    const response = await fetch('https://pizza-le-bob-food-staff-quiz.pizzalebob.workers.dev/api/public-allergens', {
      headers:{'Accept':'application/json','Cache-Control':'no-cache'},
      cache:'no-store', redirect:'error', signal:AbortSignal.timeout(5000)
    });
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) snapshot = publicSnapshot(await response.json());
  } catch { /* Fail closed: never invent information or serve a stale list. */ }
  return new Response(allergenPage(snapshot), {status:snapshot?200:503, headers:allergenHeaders});
}
