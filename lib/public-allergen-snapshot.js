const ALLERGENS = ['Celery','Cereals containing gluten','Crustaceans','Eggs','Fish','Lupin','Milk','Molluscs','Mustard','Nuts','Peanuts','Sesame','Soya','Sulphur dioxide/sulphites'];

// Explicit public projection: never expose publisher, staff, evidence or other tables.
export function publicSnapshot(value) {
  if (!value || value.schemaVersion !== 1 || !Array.isArray(value.items) || !value.items.length || value.items.length > 100 || !Number.isFinite(Date.parse(value.reviewedAt))) throw new Error('Invalid publication');
  const text = (s, limit) => { if (typeof s !== 'string' || s.length > limit) throw new Error('Invalid publication'); return s; };
  const list = a => { if (!Array.isArray(a) || a.some(x => !ALLERGENS.includes(x))) throw new Error('Invalid publication'); return [...new Set(a)]; };
  return {schemaVersion: 1, reviewedAt: value.reviewedAt, crossContact: text(value.crossContact, 3000), items:value.items.map(p => ({name:text(p.name,80), contains:list(p.contains), mayContain:list(p.mayContain), details:text(p.details,2000)}))};
}

