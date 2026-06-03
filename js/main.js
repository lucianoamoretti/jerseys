/* =====================================================
   YOUR JERSEY STORE — Main Logic
   Dual filter: type + league (incl. NBA conferences)
   EUR prices with profit
   ===================================================== */

const WA_NUMBER = '353831917032';

/* ─── State ─── */
let activeType   = 'all';
let activeLeague = 'all';
let searchQuery  = '';

/* ─── DOM ─── */
const grid        = document.getElementById('productGrid');
const noResults   = document.getElementById('noResults');
const countBadge  = document.getElementById('countBadge');
const titleEl     = document.getElementById('sectionTitle');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const modalOverlay= document.getElementById('modalOverlay');
const modalContent= document.getElementById('modalContent');
const modalClose  = document.getElementById('modalClose');

/* ─── Size surcharge (EUR) ─── */
function sizeExtra(size) {
  if (size === '2XL') return 2;
  if (size === '3XL' || size === '4XL') return 3;
  return 0;
}

/* ─── Placeholder ─── */
function buildPlaceholder(p) {
  const meta  = CATEGORY_META[p.category];
  const style = `background:radial-gradient(circle at 50% 50%,${meta.color} 0%,#0b0b0b 100%);`;
  const badge = p.league || '';
  return `<div class="product-placeholder" style="${style}">
    <span class="ph-tag">${badge}</span>
    <span>${meta.icon}</span>
  </div>`;
}

/* ─── Build card ─── */
function buildCard(p) {
  const meta  = CATEGORY_META[p.category];
  const price = meta.price;
  const label = p.category === 'jacket' ? `€${price}–€${meta.maxPrice}` : `€${price.toFixed(2)}`;

  const imgHtml = p.image
    ? `<img class="product-img" src="${p.image}" alt="${p.name}" loading="lazy">`
    : buildPlaceholder(p);

  const sizesHtml = ALL_SIZES.map(s => {
    const ex = sizeExtra(s);
    return `<span class="sz${ex ? ' plus' : ''}">${s}${ex ? ` +€${ex}` : ''}</span>`;
  }).join('');

  const leagueLabel = p.league.replace('NBA East','🟣 East').replace('NBA West','🟠 West');

  return `<div class="product-card" onclick="openModal(${p.id})">
    ${imgHtml}
    <div class="product-body">
      <div class="product-cat-tag">${meta.label}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-row">
        <span class="product-price">${label}</span>
        <span class="product-badge">${leagueLabel}</span>
      </div>
      <div class="product-sizes">${sizesHtml}</div>
      <button class="order-btn" onclick="event.stopPropagation();quickOrder(${p.id})">
        <i class="fab fa-whatsapp"></i> Order on WhatsApp
      </button>
    </div>
  </div>`;
}

/* ─── League matching (supports NBA prefix) ─── */
function leagueMatch(product, leagueFilter) {
  if (leagueFilter === 'all') return true;
  if (leagueFilter === 'NBA') return product.league.startsWith('NBA');
  return product.league === leagueFilter;
}

/* ─── Render ─── */
function render() {
  const q = searchQuery.toLowerCase().trim();

  const filtered = products.filter(p => {
    const typeOk   = activeType === 'all' || p.category === activeType;
    const leagueOk = leagueMatch(p, activeLeague);
    const searchOk = !q ||
      p.name.toLowerCase().includes(q) ||
      p.team.toLowerCase().includes(q) ||
      p.league.toLowerCase().includes(q) ||
      (p.conference || '').toLowerCase().includes(q) ||
      CATEGORY_META[p.category].label.toLowerCase().includes(q);
    return typeOk && leagueOk && searchOk;
  });

  grid.innerHTML = filtered.map(buildCard).join('');
  countBadge.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
  noResults.classList.toggle('hidden', filtered.length > 0);

  // Section title
  const typeName   = activeType   !== 'all' ? CATEGORY_META[activeType].label : '';
  const leagueName = activeLeague !== 'all' ? activeLeague : '';
  if (q) {
    titleEl.textContent = `RESULTS — "${q.toUpperCase()}"`;
  } else if (typeName && leagueName) {
    titleEl.textContent = `${leagueName.toUpperCase()} — ${typeName.toUpperCase()}`;
  } else if (typeName) {
    titleEl.textContent = typeName.toUpperCase();
  } else if (leagueName) {
    titleEl.textContent = leagueName.toUpperCase();
  } else {
    titleEl.textContent = 'ALL PRODUCTS';
  }
}

/* ─── Type filter ─── */
document.getElementById('typeList').addEventListener('click', e => {
  const btn = e.target.closest('.fpill');
  if (!btn) return;
  document.querySelectorAll('#typeList .fpill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeType = btn.dataset.type;
  render();
});

/* ─── League filter ─── */
document.getElementById('leagueList').addEventListener('click', e => {
  const btn = e.target.closest('.fpill');
  if (!btn) return;
  document.querySelectorAll('#leagueList .fpill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeLeague = btn.dataset.league;
  render();
});

/* ─── Search ─── */
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  searchClear.style.display = searchQuery ? 'block' : 'none';
  render();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  searchClear.style.display = 'none';
  render();
});

/* ─── MODAL ─── */
function openModal(id) {
  const p    = products.find(x => x.id === id);
  const meta = CATEGORY_META[p.category];
  const bp   = meta.price;
  const isJacket = p.category === 'jacket';

  const imgHtml = p.image
    ? `<img class="m-img" src="${p.image}" alt="${p.name}">`
    : `<div class="m-placeholder" style="background:radial-gradient(circle at 50% 50%,${meta.color} 0%,#0b0b0b 100%)">${meta.icon}</div>`;

  const leagueLabel = (p.conference && p.conference !== 'NBA' && p.conference !== '')
    ? `${p.league} · ${p.conference}` : p.league;

  const sizeBtns = ALL_SIZES.map(s => {
    const ex = sizeExtra(s);
    return `<button class="size-btn" data-size="${s}" data-extra="${ex}" onclick="selectSize(this)">
      ${s}${ex ? `<span class="size-surcharge">+€${ex}</span>` : ''}
    </button>`;
  }).join('');

  const priceLabel = isJacket ? `€${bp}–€${meta.maxPrice}` : `€${bp.toFixed(2)}`;

  modalContent.innerHTML = `
    ${imgHtml}
    <div class="m-body">
      <div class="m-cat">${meta.label} · ${leagueLabel}</div>
      <div class="m-name">${p.name}</div>
      <div class="m-league">${p.team}</div>
      <div class="m-price-row">
        <div>
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Base price</div>
          <div class="m-base-price">${priceLabel}</div>
        </div>
        <div class="m-total-box">
          <div class="m-total-label">Your total</div>
          <div class="m-total-price" id="mTotal">${priceLabel}</div>
        </div>
      </div>
      <div class="m-section-label">Select size</div>
      <div class="size-selector">${sizeBtns}</div>
      <div class="m-section-label">Add-ons</div>
      <div class="addon-toggles">
        <div class="addon-toggle" data-price="6" onclick="toggleAddon(this)">
          <div class="addon-left">
            <span class="addon-icon">✂️</span>
            <div><div class="addon-name">Customization</div><div class="addon-desc">Name &amp; number on jersey</div></div>
          </div>
          <span class="addon-price">+€6</span>
        </div>
        <div class="addon-toggle" data-price="2" onclick="toggleAddon(this)">
          <div class="addon-left">
            <span class="addon-icon">📌</span>
            <div><div class="addon-name">Patch</div><div class="addon-desc">League or competition badge</div></div>
          </div>
          <span class="addon-price">+€2</span>
        </div>
      </div>
      <button class="m-order-btn" onclick="orderFromModal(${p.id})">
        <i class="fab fa-whatsapp"></i> Order on WhatsApp — <span id="mBtnTotal">${priceLabel}</span>
      </button>
    </div>`;

  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function selectSize(btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  updateTotal();
}

function toggleAddon(el) {
  el.classList.toggle('active');
  updateTotal();
}

function updateTotal() {
  const basePriceEl = document.querySelector('.m-base-price');
  const totalEl     = document.getElementById('mTotal');
  const btnTotalEl  = document.getElementById('mBtnTotal');
  if (!basePriceEl || !totalEl) return;

  const base = parseFloat(basePriceEl.textContent.replace('€','').split('–')[0]);
  let total = base;

  const selSize = document.querySelector('.size-btn.selected');
  if (selSize) total += parseFloat(selSize.dataset.extra || 0);

  document.querySelectorAll('.addon-toggle.active').forEach(a => {
    total += parseFloat(a.dataset.price || 0);
  });

  const fmt = `€${total.toFixed(2)}`;
  totalEl.textContent = fmt;
  if (btnTotalEl) btnTotalEl.textContent = fmt;
}

/* ─── WhatsApp message builder ─── */
function buildMsg(p, size, addons) {
  const meta = CATEGORY_META[p.category];
  const bp   = meta.price;
  let total  = bp;
  const ex   = size ? sizeExtra(size) : 0;
  total += ex;
  const addonLines = addons.map(a => { total += a.price; return `• ${a.name}: +€${a.price}`; });

  return encodeURIComponent([
    `👋 Hi! I'd like to order from *Your Jersey Store*:`,
    ``,
    `🛒 *${p.name}*`,
    `📂 ${meta.label}  |  ${p.league}`,
    `📏 Size: ${size || 'Not selected'}${ex ? ` (+€${ex})` : ''}`,
    ...addonLines,
    ``,
    `💰 Total: €${total.toFixed(2)}`,
    ``,
    `Please confirm availability. Thank you!`
  ].join('\n'));
}

function orderFromModal(id) {
  const p       = products.find(x => x.id === id);
  const size    = document.querySelector('.size-btn.selected')?.dataset.size || null;
  const addons  = [...document.querySelectorAll('.addon-toggle.active')].map(a => ({
    name: a.querySelector('.addon-name').textContent,
    price: parseFloat(a.dataset.price)
  }));
  window.open(`https://wa.me/${WA_NUMBER}?text=${buildMsg(p, size, addons)}`, '_blank');
}

function quickOrder(id) {
  const p = products.find(x => x.id === id);
  window.open(`https://wa.me/${WA_NUMBER}?text=${buildMsg(p, null, [])}`, '_blank');
}

/* ─── Close modal ─── */
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ─── Sticky shadow ─── */
window.addEventListener('scroll', () => {
  document.getElementById('header').style.boxShadow =
    window.scrollY > 10 ? '0 2px 16px rgba(0,0,0,.5)' : 'none';
});

/* ─── Init ─── */
render();
