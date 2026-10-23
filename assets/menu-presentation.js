/* The menu remains a view of the existing editor content, never a second menu. */
(() => {
  const root = document.getElementById('menu');
  if (!root) return;
  const initial = [...root.querySelectorAll('.menu-item')].map(row => ({
    name: row.dataset.pizza,
    description: row.querySelector('.menu-item-desc')?.textContent || '',
    price: row.querySelector('.menu-item-price')?.textContent || '',
    photo: row.dataset.photo || '',
    hidden: false,
    special: row.dataset.special === 'true' || row.dataset.pizza === 'Le Bob Special'
  }));
  const guide = root.querySelector('.menu-guide')?.textContent || '';
  const footnote = root.querySelector('.menu-footnote')?.cloneNode(true);
  const allergy = root.querySelector('.allergy-note')?.cloneNode(true);
  root.innerHTML = `
    <div class="section-head menu-heading">
      <h2>Pizza Menu</h2>
      <p>Authentic 12″ Neapolitan-style pizzas – made to order</p>
      <div class="menu-guide"></div>
    </div>
    <div class="menu-layout wrap">
      <div class="menu-column menu-left" aria-label="Pizza menu"></div>
      <div class="pizza-preview" id="pizzaPreview" aria-live="polite" aria-atomic="true">
        <div class="pizza-preview-frame">
          <img id="pizzaPreviewImg" alt="" hidden>
          <div class="pizza-preview-empty" id="pizzaPreviewEmpty">Photo coming soon</div>
        </div>
        <div class="pizza-preview-caption">
          <h3 id="pizzaPreviewName"></h3>
          <p>Select a pizza to see its photo here.</p>
        </div>
      </div>
      <div class="menu-column menu-right" aria-label="More pizzas and garlic breads"></div>
      <section class="weekly-special" aria-labelledby="weeklySpecialTitle">
        <h3 id="weeklySpecialTitle">Le Bob Special</h3>
        <div class="weekly-special-content"></div>
      </section>
      <div class="menu-information"></div>
    </div>`;
  root.querySelector('.menu-guide').textContent = guide;
  const information = root.querySelector('.menu-information');
  if (footnote) information.append(footnote);
  if (allergy) information.append(allergy);
  const left = root.querySelector('.menu-left');
  const right = root.querySelector('.menu-right');
  const specialPanel = root.querySelector('.weekly-special-content');
  const image = document.getElementById('pizzaPreviewImg');
  const empty = document.getElementById('pizzaPreviewEmpty');
  const previewName = document.getElementById('pizzaPreviewName');
  let selectedName = '';

  for (const parent of [document.querySelector('header .brand'), document.querySelector('.footer-brand')]) {
    if (!parent) continue;
    const neon = document.createElement('span');
    neon.className = 'menu-neon-wordmark';
    neon.textContent = 'Pizza le Bob';
    parent.append(neon);
  }
  const updatePage = () => {
    const active = location.hash === '#menu';
    document.body.classList.toggle('menu-page', active);
    document.documentElement.classList.toggle('menu-page', active);
  };
  window.addEventListener('hashchange', updatePage);
  updatePage();

  function select(row, scroll = true) {
    selectedName = row.dataset.pizza;
    for (const item of root.querySelectorAll('.menu-item')) {
      item.classList.toggle('selected', item === row);
      item.setAttribute('aria-pressed', String(item === row));
    }
    previewName.textContent = selectedName;
    const photo = row.dataset.photo;
    image.hidden = !photo;
    empty.hidden = !!photo;
    if (photo) {
      image.src = photo;
      image.alt = selectedName;
    } else image.removeAttribute('src');
    if (scroll && matchMedia('(max-width: 999px)').matches) {
      document.getElementById('pizzaPreview').scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'center'
      });
    }
  }
  image.addEventListener('error', () => { image.hidden = true; empty.hidden = false; });

  function menuRow(item) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'menu-item';
    row.dataset.pizza = item.name;
    row.dataset.photo = item.photo || '';
    row.dataset.special = String(item.special === true);
    row.setAttribute('aria-label', 'View ' + item.name);
    row.setAttribute('aria-controls', 'pizzaPreview');
    row.setAttribute('aria-pressed', 'false');
    for (const [className, text] of [
      ['menu-item-name', item.name], ['menu-item-price', item.price], ['menu-item-desc', item.description]
    ]) {
      const span = document.createElement('span');
      span.className = className;
      span.textContent = text || '';
      row.append(span);
    }
    row.addEventListener('click', () => select(row));
    return row;
  }

  let publishedSpecial;
  function render(menu, special) {
    if (special !== undefined) publishedSpecial = special;
    left.replaceChildren();
    right.replaceChildren();
    specialPanel.replaceChildren();
    const visible = menu.filter(item => !item.hidden);
    const regular = visible.filter(item => !item.special);
    const split = Math.max(1, Math.floor(regular.length / 2));
    regular.forEach((item, index) => (index < split ? left : right).append(menuRow(item)));
    // This panel uses the editor's current special, independently of list visibility.
    const weekly = menu.find(item => item.special);
    const current = publishedSpecial === undefined
      ? (weekly && !weekly.hidden ? weekly : null)
      : (publishedSpecial?.name?.trim() ? {
          ...(weekly || {}), special: true,
          name: publishedSpecial.name,
          description: publishedSpecial.description || 'This week’s special',
          price: publishedSpecial.price || '', photo: weekly?.photo || ''
        } : null);
    if (current) {
      specialPanel.append(menuRow(current));
    } else {
      const note = document.createElement('p');
      note.textContent = 'Ask about this week’s special';
      specialPanel.append(note);
    }
    const rows = [...root.querySelectorAll('.menu-item')];
    const selected = rows.find(row => row.dataset.pizza === selectedName) || rows[0];
    if (selected) select(selected, false);
    else {
      image.removeAttribute('src'); image.hidden = true; empty.hidden = false;
      previewName.textContent = 'Menu coming soon';
    }
  }
  // The original public content loader also calls this after an editor save.
  window.renderPublishedMenu = render;
  render(initial);
  // This also covers a content response that arrived before this script loaded.
  fetch('/api/content', {cache: 'no-store'})
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (!data) return;
      render(Array.isArray(data.menu) ? data.menu : initial, data.special);
    }).catch(() => { /* The embedded menu remains usable if the connection fails. */ });
})();
