import {publicSnapshot} from './public-allergen-snapshot.js';

const target = document.getElementById('allergen-data');
function node(tag, text = '', className = '') {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}
function render(snapshot) {
  const fragment = document.createDocumentFragment();
  const date = new Intl.DateTimeFormat('en-GB',{dateStyle:'long',timeStyle:'short',timeZone:'Europe/London'}).format(new Date(snapshot.reviewedAt));
  fragment.append(node('p',`Last reviewed and published: ${date} (UK time).`,'date'));
  fragment.append(node('p','“Contains” identifies allergens in the recipe. “May contain” records precautionary warnings. An allergen not listed does not mean a pizza is free from that allergen.','small'));
  const jump = node('nav','','jump'); jump.setAttribute('aria-label','Jump to a pizza');
  const grid = node('div','','grid');
  snapshot.items.forEach((pizza,index) => {
    const link = node('a',pizza.name); link.href = `#pizza-${index}`; jump.append(link);
    const card = node('article','','pizza'); card.id = `pizza-${index}`;
    card.append(node('h2',pizza.name),node('p','Contains','label'),node('p',pizza.contains.join(', ') || 'No regulated allergens recorded — please speak to staff.','contains'));
    card.append(node('p','May contain','label'),node('p',pizza.mayContain.join(', ') || 'No supplier may-contain warnings recorded.','may'));
    if (pizza.details) card.append(node('p','Ingredient details & advice','label'),node('p',pizza.details,'details'));
    grid.append(card);
  });
  fragment.append(jump,grid);
  const preparation = node('section','','preparation');
  preparation.append(node('h2','Preparation & cross-contact'),node('p',snapshot.crossContact,'details'));
  fragment.append(preparation,node('p','Only the pizzas listed above have published information. For a special, topping or menu item not listed, please speak to us before ordering.','small'));
  const actions = node('div','','actions');
  const print = node('button','Print allergen information'); print.addEventListener('click',()=>window.print());
  const menu = node('a','Back to the menu','button'); menu.href = '/pizza-menu'; actions.append(print,menu); fragment.append(actions);
  target.replaceChildren(fragment);
  target.setAttribute('aria-busy','false');
}
async function load() {
  try {
    const response = await fetch('https://pizza-le-bob-food-staff-quiz.pizzalebob.workers.dev/api/public-allergens',{cache:'no-store',credentials:'omit'});
    if (!response.ok) throw new Error('Allergen list unavailable');
    render(publicSnapshot(await response.json()));
  } catch {
    const section = node('section','','preparation');
    section.append(node('h2','Please speak to us before ordering'),node('p','The online allergen list is currently unavailable. Please ask us for the current written information and discuss any allergy, intolerance or coeliac disease with us.'));
    target.replaceChildren(section); target.setAttribute('aria-busy','false');
  }
}
if (target) { target.setAttribute('aria-busy','true'); void load(); }
