/* =====================================================
   YOUR JERSEY STORE — Main Logic
   Filter: League (bar 1) → Type subcategory (bar 2, dynamic)
   ===================================================== */

const WA_NUMBER = '353831917032';

/* ─── State ─── */
let activeLeague = 'all';
let activeType   = 'all';
let searchQuery  = '';

/* ─── DOM ─── */
const grid         = document.getElementById('productGrid');
const noResults    = document.getElementById('noResults');
const countBadge   = document.getElementById('countBadge');
const titleEl      = document.getElementById('sectionTitle');
const searchInput  = document.getElementById('searchInput');
const searchClear  = document.getElementById('searchClear');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const modalClose   = document.getElementById('modalClose');
const typeList     = document.getElementById('typeList');
const typeBar      = document.getElementById('typeBar');

/* ─── Type metadata ─── */
const TYPE_ICONS = {
  fan:         { icon: '⚽', label: 'Fan Version' },
  player:      { icon: '🌟', label: 'Player Version' },
  retro:       { icon: '👔', label: 'Retro' },
  nba:         { icon: '🏀', label: 'NBA' },
  longsleeve:  { icon: '🥼', label: 'Long Sleeve' },
  short:       { icon: '🩳', label: 'Shorts' },
  infant:      { icon: '👶', label: 'Infant Kit' },
  windbreaker: { icon: '🧥', label: 'Windbreaker' },
  jacket:      { icon: '🧥', label: 'Jacket' },
};

/* ─── Size surcharge (EUR) ─── */
function sizeExtra(size) {
  if (size === '2XL') return 2;
  if (size === '3XL' || size === '4XL') return 3;
  return 0;
}

/* ─── League match (NBA prefix) ─── */
function leagueMatch(product, leagueFilter) {
  if (leagueFilter === 'all') return true;
  if (leagueFilter === 'NBA') return product.league.startsWith('NBA');
  return product.league === leagueFilter;
}

/* ─── Build dynamic type sub-bar for selected league ─── */
function updateTypeBar(league) {
  // Gather which types exist for this league
  const inLeague = products.filter(p => leagueMatch(p, league));
  const typeCounts = {};
  inLeague.forEach(p => {
    typeCounts[p.category] = (typeCounts[p.category] || 0) + 1;
  });

  const availableTypes = Object.keys(typeCounts);

  // Hide bar if only 1 type (or zero)
  if (availableTypes.length <= 1) {
    typeBar.style.display = 'none';
    activeType = 'all';
    return;
  }

  typeBar.style.display = '';

  // Preferred order
  const ORDER = ['fan', 'player', 'retro', 'nba', 'longsleeve', 'short', 'infant', 'windbreaker', 'jacket'];
  const sorted = ORDER.filter(t => availableTypes.includes(t));

  // Build pills
  const pills = [`<button class="fpill type-pill active" data-type="all">All (${inLeague.length})</button>`];
  for (const t of sorted) {
    const meta = TYPE_ICONS[t];
    if (!meta) continue;
    pills.push(
      `<button class="fpill type-pill" data-type="${t}" data-count="${typeCounts[t]}">
        ${meta.icon} ${meta.label} <span class="pill-count">${typeCounts[t]}</span>
      </button>`
    );
  }

  typeList.innerHTML = pills.join('');
  activeType = 'all';

  // Attach click listener
  typeList.querySelectorAll('.type-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      typeList.querySelectorAll('.type-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeType = btn.dataset.type;
      render();
    });
  });
}

/* ─── Placeholder ─── */
function buildPlaceholder(p) {
  const meta  = CATEGORY_META[p.category];
  const style = `background:radial-gradient(circle at 50% 50%,${meta.color} 0%,#0b0b0b 100%);`;
  return `<div class="product-placeholder" style="${style}">
    <span class="ph-tag">${p.league}</span>
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

  const leagueLabel = p.league.replace('NBA East','East').replace('NBA West','West');

  const sizesHtml = ALL_SIZES.map(s => {
    const ex = sizeExtra(s);
    return `<span class="sz${ex ? ' plus' : ''}">${s}${ex ? ` +€${ex}` : ''}</span>`;
  }).join('');

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

/* ─── Render ─── */
function render() {
  const q = searchQuery.toLowerCase().trim();

  const filtered = products.filter(p => {
    const leagueOk = leagueMatch(p, activeLeague);
    const typeOk   = activeType === 'all' || p.category === activeType;
    const searchOk = !q ||
      p.name.toLowerCase().includes(q) ||
      p.team.toLowerCase().includes(q) ||
      p.league.toLowerCase().includes(q) ||
      (p.conference || '').toLowerCase().includes(q) ||
      CATEGORY_META[p.category].label.toLowerCase().includes(q);
    return leagueOk && typeOk && searchOk;
  });

  grid.innerHTML = filtered.map(buildCard).join('');
  countBadge.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
  noResults.classList.toggle('hidden', filtered.length > 0);

  // Title
  const leagueName = activeLeague !== 'all' ? activeLeague : '';
  const typeName   = activeType !== 'all' ? (TYPE_ICONS[activeType]?.label || activeType) : '';
  if (q) {
    titleEl.textContent = `RESULTS — "${q.toUpperCase()}"`;
  } else if (leagueName && typeName) {
    titleEl.textContent = `${leagueName.toUpperCase()} — ${typeName.toUpperCase()}`;
  } else if (leagueName) {
    titleEl.textContent = leagueName.toUpperCase();
  } else if (typeName) {
    titleEl.textContent = typeName.toUpperCase();
  } else {
    titleEl.textContent = 'ALL PRODUCTS';
  }
}

/* ─── League filter ─── */
document.getElementById('leagueList').addEventListener('click', e => {
  const btn = e.target.closest('.fpill');
  if (!btn) return;
  document.querySelectorAll('#leagueList .fpill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeLeague = btn.dataset.league;
  updateTypeBar(activeLeague);
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
  const priceLabel = isJacket ? `€${bp}–€${meta.maxPrice}` : `€${bp.toFixed(2)}`;

  const confLine = (p.conference && p.conference !== 'NBA' && p.conference !== '')
    ? ` · ${p.conference}` : '';

  const imgHtml = p.image
    ? `<img class="m-img" src="${p.image}" alt="${p.name}">`
    : `<div class="m-placeholder" style="background:radial-gradient(circle at 50% 50%,${meta.color} 0%,#0b0b0b 100%)">${meta.icon}</div>`;

  const sizeBtns = ALL_SIZES.map(s => {
    const ex = sizeExtra(s);
    return `<button class="size-btn" data-size="${s}" data-extra="${ex}" onclick="selectSize(this)">
      ${s}${ex ? `<span class="size-surcharge">+€${ex}</span>` : ''}
    </button>`;
  }).join('');

  modalContent.innerHTML = `
    ${imgHtml}
    <div class="m-body">
      <div class="m-cat">${meta.label} · ${p.league}${confLine}</div>
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
  document.querySelectorAll('.addon-toggle.active').forEach(a => { total += parseFloat(a.dataset.price || 0); });
  const fmt = `€${total.toFixed(2)}`;
  totalEl.textContent = fmt;
  if (btnTotalEl) btnTotalEl.textContent = fmt;
}

/* ─── WhatsApp ─── */
function buildMsg(p, size, addons) {
  const meta = CATEGORY_META[p.category];
  let total  = meta.price;
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
  const p      = products.find(x => x.id === id);
  const size   = document.querySelector('.size-btn.selected')?.dataset.size || null;
  const addons = [...document.querySelectorAll('.addon-toggle.active')].map(a => ({
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

/* ─── Add pill-count style ─── */
const style = document.createElement('style');
style.textContent = `
  .pill-count { font-size:9px; background:rgba(0,0,0,.3); padding:1px 5px; border-radius:8px; margin-left:3px; }
  .type-pill.active .pill-count { background:rgba(0,0,0,.25); }
  #typeBar { top: 108px; }
`;
document.head.appendChild(style);

/* ─── Init ─── */
updateTypeBar('all');
render();
