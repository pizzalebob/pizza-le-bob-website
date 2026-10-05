// Restyle the existing date cards, including dates published through the editor.
const track = document.getElementById('upcomingDates');
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function presentDates() {
  if (!track) return;
  for (const card of track.querySelectorAll('.date-card:not([data-compact-date])')) {
    const number = card.querySelector('strong');
    const details = card.querySelector('span');
    const label = details?.querySelector('small');
    if (!number || !details || !label) continue;
    const weekday = label.textContent.match(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/)?.[0] || '';
    const month = monthNames.find(name => label.textContent.includes(name.slice(0,3))) || '';
    const content = [...details.childNodes].filter(node => node !== label);
    const notServing = card.classList.contains('date-cancelled');
    card.dataset.compactDate = 'true';
    const day = document.createElement('div'); day.className = 'compact-number';
    const weekdayLabel = document.createElement('span'); weekdayLabel.textContent = weekday;
    day.append(number, weekdayLabel);
    const text = document.createElement('div'); text.className = 'compact-details';
    const monthLabel = document.createElement('strong'); monthLabel.textContent = month;
    const description = document.createElement('small');
    if (notServing) {
      description.className = 'compact-warning';
      const flag = document.createElement('span'); flag.className = 'compact-flag';
      flag.setAttribute('aria-hidden','true'); flag.textContent = '⚑';
      description.append(flag, document.createTextNode('Not serving'));
    } else {
      for (const node of content) {
        if (node.nodeType === Node.TEXT_NODE) node.textContent = node.textContent.replace(/^The\s+/i,'');
        description.append(node);
      }
      // Keep the venue on one line while retaining the separate collection time.
      const venue = document.createElement('span'); venue.className = 'compact-venue';
      while (description.firstChild && description.firstChild.nodeName !== 'BR') venue.append(description.firstChild);
      description.prepend(venue);
    }
    text.append(monthLabel,description);
    card.replaceChildren(day,text);
    card.setAttribute('aria-label',`${weekday} ${number.textContent} ${month}: ${description.textContent}`);
  }
}
if (track) {
  presentDates();
  new MutationObserver(presentDates).observe(track,{childList:true});
}
