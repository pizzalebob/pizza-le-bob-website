export const PAGES = {home:'Home',popup:'Pop-ups',menu:'Menu',story:'Our story',weddings:'Weddings & parties',corporate:'Corporate',book:'Book / contact',gallery:'Gallery',provenance:'Provenance',reviews:'Reviews',privacy:'Privacy notice'};
export const PREFIX = 'visitor-statistics:v1:';
export function weekStart(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part = type => parts.find(p=>p.type===type).value;
  const day = new Date(`${part('year')}-${part('month')}-${part('day')}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay()+6)%7);
  return day.toISOString().slice(0,10);
}
export async function hashVisitor(id) {
  const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode('pizza-le-bob-visitor-v1:'+id));
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
