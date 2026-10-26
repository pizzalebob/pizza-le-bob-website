// One URL for each existing public view; editor content remains shared.
export const ORIGIN = 'https://www.pizzalebob.co.uk';
export const SEARCH_PAGES = [
  ['home','/','Pizza le Bob | Pizza Takeaway in Morley & Mobile Catering Leeds','Authentic Neapolitan-style pizza to take away in Morley, plus mobile pizza trailer catering for weddings, parties and corporate events across Leeds.'],
  ['weddings','/wedding-pizza-catering-leeds','Wedding Pizza Catering Leeds | Pizza le Bob','Mobile pizza catering for wedding receptions in Leeds. Fresh Neapolitan-style pizza, a choice of five pizzas and a buffet served at your venue.'],
  ['corporate','/corporate-pizza-catering-leeds','Corporate Pizza Catering Leeds | Pizza le Bob','Mobile pizza catering for Leeds corporate events, staff parties and client days. Neapolitan-style pizzas cooked at your venue. Enquire about availability.'],
  ['book','/mobile-pizza-catering-leeds','Mobile Pizza Catering Leeds | Parties & Events | Pizza le Bob','Hire Pizza le Bob for mobile pizza catering in Leeds: private parties, birthdays, weddings, corporate events and pub catering. Ask for availability and a quote.'],
  ['parties','/party-pizza-catering-leeds','Pizza Catering for Parties in Leeds | Pizza le Bob','Mobile pizza catering for birthdays, garden parties, anniversaries and private celebrations in Morley and Leeds. Fresh Neapolitan-style pizza at your venue.'],
  ['menu','/pizza-menu','Pizza Menu | Pizza le Bob Morley & Leeds','Explore Pizza le Bob’s Neapolitan-style pizza menu and weekly special. Freshly made pizza for Morley takeaways and catered events in Leeds.'],
  ['popup','/pizza-takeaway-morley','Pizza Takeaway Morley | Gardeners Arms | Pizza le Bob','Pizza takeaway in Morley from Pizza le Bob at the Gardeners Arms. Check confirmed weekly pop-up dates and the menu, then pre-order by WhatsApp for collection.'],
  ['story','/our-story','Our Story | Pizza le Bob','Meet Pizza le Bob and discover the story behind our mobile Neapolitan-style pizza trailer. Pizza takeaways in Morley and event catering across Leeds.'],
  ['gallery','/gallery','Pizza Catering Gallery | Pizza le Bob','See Pizza le Bob’s pizzas, mobile trailer and catering photographs. Neapolitan-style pizza for weddings, parties and corporate events.'],
  ['reviews','/reviews','Customer Reviews | Pizza le Bob','Read customer reviews of Pizza le Bob: Neapolitan-style pizza for weddings, parties, community events and Morley pop-ups.'],
  ['privacy','/privacy','Privacy Notice | Pizza le Bob','How Pizza le Bob uses enquiry details, hosts this website and counts page views. Read our privacy notice.']
].map(([section,path,title,description])=>({section,path,title,description}));
export function pageForPath(path){return SEARCH_PAGES.find(page=>page.path===path);}
export function publicLink(href){
  if(!href?.startsWith('#'))return href;
  const id=href.slice(1);
  if(id==='bob-home')return '/';
  if(id==='corporate-form')return '/corporate-pizza-catering-leeds#corporate-form';
  if(id==='provenance')return '/gallery#provenance';
  return SEARCH_PAGES.find(page=>page.section===id)?.path || href;
}
export function structuredData(page){
  const business={'@type':'FoodEstablishment','@id':ORIGIN+'/#business',name:'Pizza le Bob',url:ORIGIN+'/',telephone:'+447989836477',servesCuisine:['Pizza','Italian'],areaServed:{'@type':'City',name:'Leeds'},description:'Mobile Neapolitan-style pizza catering for weddings, private parties and corporate events in Leeds, with takeaway pop-ups in Morley.'};
  const graph=[business,{'@type':'WebSite','@id':ORIGIN+'/#website',url:ORIGIN+'/',name:'Pizza le Bob',publisher:{'@id':business['@id']}},{'@type':'WebPage','@id':ORIGIN+page.path+'#webpage',url:ORIGIN+page.path,name:page.title,description:page.description,isPartOf:{'@id':ORIGIN+'/#website'},about:{'@id':business['@id']}}];
  if(['book','weddings','corporate','parties'].includes(page.section))graph.push({'@type':'Service','@id':ORIGIN+page.path+'#service',name:page.section==='parties'?'Pizza catering for private parties':page.section==='weddings'?'Wedding pizza catering':page.section==='corporate'?'Corporate pizza catering':'Mobile pizza catering for parties and events',serviceType:'Mobile pizza catering',provider:{'@id':business['@id']},areaServed:{'@type':'City',name:'Leeds'},url:ORIGIN+page.path});
  return JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c');
}
