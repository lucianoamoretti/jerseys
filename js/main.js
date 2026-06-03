/* =====================================================
   YOUR JERSEY STORE — Main App Logic
   ===================================================== */

const WA_NUMBER = 'SEUNUMERO'; // TODO: replace with your WhatsApp number

/* ---- State ---- */
let activeCategory = 'all';
let searchQuery    = '';

/* ---- DOM refs ---- */
const grid       = document.getElementById('productGrid');
const noResults  = document.getElementById('noResults');
const countBadge = document.getElementById('countBadge');
const sectionTitleEl = document.getElementById('sectionTitle');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const modalClose   = document.getElementById('modalClose');

/* ========== SIZE PRICING ========== */
function sizeSurcharge(size) {
  if (size === '2XL') return 1;
  if (size === '3XL' || size === '4XL') return 2;
  return 0;
}

/* ========== BASE PRICE ========== */
function basePrice(product) {
  return CATEGORY_META[product.category].price;
}

/* ========== BUILD PLACEHOLDER ========== */
function buildPlaceholder(product, small = false) {
  const meta  = CATEGORY_META[product.category];
  const style = `background: radial-gradient(circle at 50% 50%, ${meta.color} 0%, #0b0b0b 100%);`;
  return `
    <div class="product-placeholder" style="${style}">
      <span class="ph-league-tag">${product.league}</span>
      <span>${meta.icon}</span>
    </div>`;
}

/* ========== BUILD CARD ========== */
function buildCard(p) {
  const meta  = CATEGORY_META[p.category];
  const price = basePrice(p);
  const label = p.priceNote || `$${price}`;

  const imgHtml = p.image
    ? `<img class="product-img" src="${p.image}" alt="${p.name}" loading="lazy">`
    : buildPlaceholder(p);

  const sizesHtml = ALL_SIZES.map(s => {
    const extra = sizeSurcharge(s);
    return `<span class="sz${extra > 0 ? ' plus' : ''}">${s}${extra > 0 ? ' +$' + extra : ''}</span>`;
  }).join('');

  return `
    <div class="product-card" data-id="${p.id}" onclick="openModal(${p.id})">
      ${imgHtml}
      <div class="product-body">
        <div class="product-cat-tag">${meta.label}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-row">
          <span class="product-price">${label}</span>
          <span class="product-badge">${p.league}</span>
        </div>
        <div class="product-sizes">${sizesHtml}</div>
        <button class="order-btn" onclick="event.stopPropagation(); orderOnWhatsApp(${p.id})">
          <i class="fab fa-whatsapp"></i> Order on WhatsApp
        </button>
      </div>
    </div>`;
}

/* ========== RENDER GRID ========== */
function render() {
  const q = searchQuery.toLowerCase().trim();

  const filtered = products.filter(p => {
    const catMatch = activeCategory === 'all' || p.category === activeCategory;
    const searchMatch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.team.toLowerCase().includes(q) ||
      p.league.toLowerCase().includes(q) ||
      CATEGORY_META[p.category].label.toLowerCase().includes(q);
    return catMatch && searchMatch;
  });

  grid.innerHTML = filtered.map(buildCard).join('');
  countBadge.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
  noResults.classList.toggle('hidden', filtered.length > 0);

  // Update section title
  if (activeCategory !== 'all') {
    sectionTitleEl.textContent = CATEGORY_META[activeCategory].label.toUpperCase();
  } else {
    sectionTitleEl.textContent = q ? `RESULTS FOR "${q.toUpperCase()}"` : 'ALL PRODUCTS';
  }
}

/* ========== CATEGORY FILTER ========== */
document.getElementById('catList').addEventListener('click', e => {
  const btn = e.target.closest('.cat-pill');
  if (!btn) return;
  document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeCategory = btn.dataset.cat;
  render();
});

/* ========== SEARCH ========== */
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  searchClear.style.display = searchQuery ? 'block' : 'none';
  render();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  searchClear.style.display = 'none';
  searchInput.focus();
  render();
});

/* ========== MODAL ========== */
function openModal(id) {
  const p    = products.find(x => x.id === id);
  const meta = CATEGORY_META[p.category];
  const bp   = basePrice(p);

  const imgHtml = p.image
    ? `<img class="m-img" src="${p.image}" alt="${p.name}">`
    : `<div class="m-placeholder" style="background:radial-gradient(circle at 50% 50%, ${meta.color} 0%, #0b0b0b 100%)">${meta.icon}</div>`;

  const sizeBtns = ALL_SIZES.map(s => {
    const extra = sizeSurcharge(s);
    return `
      <button class="size-btn" data-size="${s}" data-extra="${extra}" onclick="selectSize(this)">
        ${s}
        ${extra > 0 ? `<span class="size-surcharge">+$${extra}</span>` : ''}
      </button>`;
  }).join('');

  modalContent.innerHTML = `
    ${imgHtml}
    <div class="m-body">
      <div class="m-cat">${meta.label} · ${p.league}</div>
      <div class="m-name">${p.name}</div>
      <div class="m-league">${p.team} ${p.season ? '— ' + p.season : ''}</div>

      <div class="m-price-row">
        <div>
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Base price</div>
          <div class="m-base-price">$${bp}</div>
        </div>
        <div class="m-total-box">
          <div class="m-total-label">Your total</div>
          <div class="m-total-price" id="mTotal">$${bp}</div>
        </div>
      </div>

      <div class="m-section-label">Select size</div>
      <div class="size-selector">${sizeBtns}</div>

      <div class="m-section-label">Add-ons</div>
      <div class="addon-toggles">
        <div class="addon-toggle" data-price="3" onclick="toggleAddon(this)">
          <div class="addon-left">
            <span class="addon-icon">✂️</span>
            <div>
              <div class="addon-name">Customization</div>
              <div class="addon-desc">Add your name &amp; number</div>
            </div>
          </div>
          <span class="addon-price">+$3</span>
        </div>
        <div class="addon-toggle" data-price="1" onclick="toggleAddon(this)">
          <div class="addon-left">
            <span class="addon-icon">📌</span>
            <div>
              <div class="addon-name">Patch</div>
              <div class="addon-desc">League or competition badge</div>
            </div>
          </div>
          <span class="addon-price">+$1</span>
        </div>
      </div>

      <button class="m-order-btn" onclick="orderFromModal(${p.id})">
        <i class="fab fa-whatsapp"></i> Order on WhatsApp
      </button>
    </div>`;

  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  updateTotal();
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
  const totalEl = document.getElementById('mTotal');
  if (!totalEl) return;

  const activePill = document.querySelector('.cat-pill.active');
  const modalCatTag = document.querySelector('.m-cat');
  if (!modalCatTag) return;

  // Get base price from the displayed m-base-price
  const basePriceEl = document.querySelector('.m-base-price');
  if (!basePriceEl) return;
  let total = parseInt(basePriceEl.textContent.replace('$', ''));

  // Size surcharge
  const selSize = document.querySelector('.size-btn.selected');
  if (selSize) total += parseInt(selSize.dataset.extra || 0);

  // Add-ons
  document.querySelectorAll('.addon-toggle.active').forEach(a => {
    total += parseInt(a.dataset.price || 0);
  });

  totalEl.textContent = `$${total}`;
}

/* ========== WHATSAPP ORDERING ========== */
function buildWAMessage(product, size, addons) {
  const meta = CATEGORY_META[product.category];
  const bp   = basePrice(product);
  let   total = bp;

  const sizeText = size || 'Not selected';
  const extra    = size ? sizeSurcharge(size) : 0;
  total += extra;

  const addonLines = addons.map(a => {
    total += a.price;
    return `• ${a.name}: +$${a.price}`;
  });

  const msg = [
    `👋 Hi! I'd like to order from *Your Jersey Store*:`,
    ``,
    `🛒 *${product.name}*`,
    `📂 Category: ${meta.label}`,
    `⚽ League: ${product.league}`,
    `📏 Size: ${sizeText}${extra > 0 ? ` (+$${extra})` : ''}`,
    ...addonLines,
    ``,
    `💰 Total: $${total}`,
    ``,
    `Please confirm availability & shipping cost. Thank you!`
  ].join('\n');

  return encodeURIComponent(msg);
}

function orderFromModal(id) {
  const p = products.find(x => x.id === id);
  const selSize = document.querySelector('.size-btn.selected');
  const size = selSize ? selSize.dataset.size : null;

  const addons = [];
  document.querySelectorAll('.addon-toggle.active').forEach(a => {
    const name = a.querySelector('.addon-name').textContent;
    addons.push({ name, price: parseInt(a.dataset.price) });
  });

  const msg = buildWAMessage(p, size, addons);
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
}

function orderOnWhatsApp(id) {
  const p = products.find(x => x.id === id);
  const msg = buildWAMessage(p, null, []);
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
}

/* ========== CLOSE MODAL ========== */
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ========== STICKY HEADER SHADOW ========== */
window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  header.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(0,0,0,.5)' : 'none';
});

/* ========== INIT ========== */
render();
