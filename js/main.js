/* =====================================================
   YOUR JERSEY STORE — Main Logic
   SPA routing | Team submenu | Cart | WhatsApp order
   ===================================================== */

const WA_NUMBER = '353831917032';

const state = {
  view:            'catalog',
  activeLeague:    'all',
  activeTeam:      '',
  searchQuery:     '',
  currentProductId: null,
  cart: JSON.parse(localStorage.getItem('yjs_cart') || '[]'),
};

/* ─── DOM refs ─── */
const grid        = document.getElementById('productGrid');
const noResults   = document.getElementById('noResults');
const countBadge  = document.getElementById('countBadge');
const titleEl     = document.getElementById('sectionTitle');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const teamList    = document.getElementById('teamList');
const teamBar     = document.getElementById('teamBar');
const leagueBar   = document.getElementById('leagueBar');
const cartBtn     = document.getElementById('cartBtn');
const cartBadge   = document.getElementById('cartBadge');

/* ─── Type label (for title display only) ─── */
const TYPE_LABELS = {
  fan: 'Fan Version', player: 'Player Version', retro: 'Retro',
  retrolongsleeve: 'Retro Long Sleeve',
  nba: 'NBA', longsleeve: 'Long Sleeve', short: 'Shorts',
  infant: 'Infant Kit', windbreaker: 'Windbreaker', jacket: 'Jacket',
};

/* ─── Size surcharge ─── */
function sizeExtra(size) {
  if (size === '2XL') return 2;
  if (size === '3XL' || size === '4XL') return 3;
  return 0;
}

/* ─── League match ─── */
function leagueMatch(p, filter) {
  if (filter === 'all') return true;
  if (filter === 'NBA') return p.league.startsWith('NBA');
  if (filter === 'NBA East') return p.league === 'NBA East';
  if (filter === 'NBA West') return p.league === 'NBA West';
  return p.league === filter;
}

/* ─── Active products only ─── */
const activeProducts = () => products.filter(p => p.active !== false);

/* ─── Products in current group ─── */
function getInGroup() {
  if (state.activeTeam) return activeProducts().filter(p => p.team === state.activeTeam);
  return activeProducts().filter(p => leagueMatch(p, state.activeLeague));
}

/* ─── Bar stacking ─── */
const HEADER_H = 64;
function updateBarsStacking() {
  requestAnimationFrame(() => {
    const lbH = leagueBar.offsetHeight;
    const tbH = teamBar.classList.contains('hidden') ? 0 : (teamBar.offsetHeight || 42);
    teamBar.style.top = (HEADER_H + lbH) + 'px';
  });
}

/* ─── Scroll to products ─── */
function scrollToProducts() {
  const productsEl = document.getElementById('products');
  if (!productsEl) return;
  const stickiesH = HEADER_H + leagueBar.offsetHeight +
    (teamBar.classList.contains('hidden') ? 0 : (teamBar.offsetHeight || 42));
  const top = productsEl.getBoundingClientRect().top + window.scrollY - stickiesH - 12;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* ─── Team sub-bar ─── */
function updateTeamBar() {
  const hideTeamBar = state.activeLeague === 'all' || state.activeLeague.startsWith('NBA');
  if (hideTeamBar) {
    teamBar.classList.add('hidden');
    updateBarsStacking();
    return;
  }

  const teamsInLeague = [...new Set(
    activeProducts().filter(p => p.league === state.activeLeague).map(p => p.team)
  )].sort();

  if (teamsInLeague.length === 0) {
    teamBar.classList.add('hidden');
    updateBarsStacking();
    return;
  }

  teamBar.classList.remove('hidden');
  const pills = teamsInLeague.map(t =>
    `<button class="fpill team-bar-pill${state.activeTeam === t ? ' active' : ''}" data-team="${t}">${t}</button>`
  ).join('');
  teamList.innerHTML = pills;

  teamList.querySelectorAll('.team-bar-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const wasActive = btn.classList.contains('active');
      teamList.querySelectorAll('.team-bar-pill').forEach(b => b.classList.remove('active'));
      if (wasActive) {
        state.activeTeam = '';
      } else {
        btn.classList.add('active');
        state.activeTeam = btn.dataset.team;
      }
      renderCatalog();
      scrollToProducts();
    });
  });

  updateBarsStacking();
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

/* ─── Build catalog card ─── */
function buildCard(p) {
  const meta  = CATEGORY_META[p.category];
  const price = meta.price;
  const label = p.category === 'jacket' ? `€${price}–€${meta.maxPrice}` : `€${price.toFixed(2)}`;

  const imgHtml = p.image
    ? `<img class="product-img" src="${p.image}" alt="${p.name}" loading="lazy">`
    : buildPlaceholder(p);

  const leagueLabel = p.league.replace('NBA East','East').replace('NBA West','West');

  return `<div class="product-card" onclick="openProduct(${p.id})">
    ${imgHtml}
    <div class="product-body">
      <div class="product-cat-tag">${meta.label}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-row">
        <span class="product-price">${label}</span>
        <span class="product-badge">${leagueLabel}</span>
      </div>
    </div>
  </div>`;
}

/* ─── Render catalog ─── */
function renderCatalog() {
  const q = state.searchQuery.toLowerCase().trim();

  const filtered = activeProducts().filter(p => {
    const groupOk  = state.activeTeam
      ? p.team === state.activeTeam
      : leagueMatch(p, state.activeLeague);
    const searchOk = !q ||
      p.name.toLowerCase().includes(q) ||
      p.team.toLowerCase().includes(q) ||
      p.league.toLowerCase().includes(q) ||
      (p.conference || '').toLowerCase().includes(q) ||
      CATEGORY_META[p.category].label.toLowerCase().includes(q);
    return groupOk && searchOk;
  });

  grid.innerHTML = filtered.map(buildCard).join('');
  countBadge.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
  noResults.classList.toggle('hidden', filtered.length > 0);

  if (q) {
    titleEl.textContent = `RESULTS — "${q.toUpperCase()}"`;
  } else if (state.activeTeam) {
    titleEl.textContent = state.activeTeam.toUpperCase();
  } else if (state.activeLeague !== 'all') {
    titleEl.textContent = state.activeLeague.toUpperCase();
  } else {
    titleEl.textContent = 'ALL PRODUCTS';
  }
}

/* ─── Product page ─── */
function renderProductPage(id) {
  const p    = products.find(x => x.id === id);
  if (!p) { navigateTo('catalog'); return; }
  const meta = CATEGORY_META[p.category];
  const bp   = meta.price;
  const isJacket = p.category === 'jacket';
  const priceLabel = isJacket ? `€${bp}–€${meta.maxPrice}` : `€${bp.toFixed(2)}`;

  const confLine = (p.conference && p.conference !== 'NBA' && p.conference !== '')
    ? ` · ${p.conference}` : '';

  const allImgs = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);

  let imgHtml;
  if (allImgs.length > 1) {
    const thumbs = allImgs.map((src, i) =>
      `<button class="pp-thumb${i === 0 ? ' active' : ''}" onclick="ppSetImg(this,'${src}')" style="background-image:url('${src}')"></button>`
    ).join('');
    imgHtml = `
      <img class="pp-img" id="ppMainImg" src="${allImgs[0]}" alt="${p.name}">
      <div class="pp-thumbs">${thumbs}</div>`;
  } else if (allImgs.length === 1) {
    imgHtml = `<img class="pp-img" id="ppMainImg" src="${allImgs[0]}" alt="${p.name}">`;
  } else {
    imgHtml = `<div class="pp-placeholder" style="background:radial-gradient(circle at 50% 50%,${meta.color} 0%,#0b0b0b 100%)">${meta.icon}</div>`;
  }

  const sizeBtns = ALL_SIZES.map(s => {
    const ex = sizeExtra(s);
    return `<button class="pp-size-btn" data-size="${s}" data-extra="${ex}" onclick="ppSelectSize(this)">
      ${s}${ex ? `<span class="size-surcharge">+€${ex}</span>` : ''}
    </button>`;
  }).join('');

  const ppContent = document.getElementById('ppContent');
  ppContent.innerHTML = `
    <div class="pp-img-wrap">
      ${imgHtml}
    </div>
    <div class="pp-details">
      <div class="pp-cat">${meta.label} · ${p.league}${confLine}</div>
      <h1 class="pp-name">${p.name}</h1>
      <div class="pp-team">${p.team}</div>
      <div class="pp-price-row">
        <div>
          <div class="pp-price-label">Base price</div>
          <div class="pp-base-price">${priceLabel}</div>
        </div>
        <div class="pp-total-box">
          <div class="pp-total-label">Your total</div>
          <div class="pp-total-val" id="ppTotal">${priceLabel}</div>
        </div>
      </div>

      <div class="pp-section-label">Select size</div>
      <div class="pp-size-selector" id="ppSizes">${sizeBtns}</div>
      <div class="pp-error hidden" id="ppSizeError">
        <i class="fas fa-exclamation-circle"></i> Please select a size before adding to cart.
      </div>

      <div class="pp-section-label">Add-ons</div>
      <div class="addon-toggles">
        <div class="addon-toggle" data-price="6" onclick="ppToggleAddon(this)">
          <div class="addon-left">
            <span class="addon-icon">✂️</span>
            <div><div class="addon-name">Customization</div><div class="addon-desc">Name &amp; number on jersey</div></div>
          </div>
          <span class="addon-price">+€6</span>
        </div>
        <div class="addon-toggle" data-price="2" onclick="ppToggleAddon(this)">
          <div class="addon-left">
            <span class="addon-icon">📌</span>
            <div><div class="addon-name">Patch</div><div class="addon-desc">League or competition badge</div></div>
          </div>
          <span class="addon-price">+€2</span>
        </div>
      </div>

      <div class="pp-info-strip">
        <span><i class="fas fa-shipping-fast"></i> €5 shipping · <strong>Free on 2+ items</strong></span>
        <span><i class="fas fa-clock"></i> Delivery ~20 days</span>
        <span><i class="fab fa-paypal"></i> PayPal accepted</span>
        <span><i class="fas fa-ruler"></i> 2XL +€2 · 3XL/4XL +€3</span>
      </div>

      <button class="pp-add-btn" id="ppAddBtn" onclick="addToCart(${p.id})">
        <i class="fas fa-shopping-bag"></i> Add to Cart — <span id="ppBtnTotal">${priceLabel}</span>
      </button>
    </div>`;
}

function ppSetImg(thumb, src) {
  document.getElementById('ppMainImg').src = src;
  document.querySelectorAll('.pp-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

function ppSelectSize(btn) {
  document.querySelectorAll('#ppSizes .pp-size-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const errEl = document.getElementById('ppSizeError');
  if (errEl) errEl.classList.add('hidden');
  ppUpdateTotal();
}

function ppToggleAddon(el) {
  el.classList.toggle('active');
  ppUpdateTotal();
}

function ppUpdateTotal() {
  const basePriceEl = document.querySelector('.pp-base-price');
  const totalEl     = document.getElementById('ppTotal');
  const btnTotalEl  = document.getElementById('ppBtnTotal');
  if (!basePriceEl || !totalEl) return;
  const base = parseFloat(basePriceEl.textContent.replace('€','').split('–')[0]);
  let total = base;
  const selSize = document.querySelector('#ppSizes .pp-size-btn.selected');
  if (selSize) total += parseFloat(selSize.dataset.extra || 0);
  document.querySelectorAll('#ppContent .addon-toggle.active').forEach(a => { total += parseFloat(a.dataset.price || 0); });
  const fmt = `€${total.toFixed(2)}`;
  totalEl.textContent = fmt;
  if (btnTotalEl) btnTotalEl.textContent = fmt;
}

/* ─── Cart ─── */
function addToCart(productId) {
  const sizeBtn = document.querySelector('#ppSizes .pp-size-btn.selected');
  if (!sizeBtn) {
    const errEl  = document.getElementById('ppSizeError');
    const addBtn = document.getElementById('ppAddBtn');
    if (errEl) errEl.classList.remove('hidden');
    if (addBtn) { addBtn.classList.add('shake'); setTimeout(() => addBtn.classList.remove('shake'), 500); }
    return;
  }

  const p    = products.find(x => x.id === productId);
  const meta = CATEGORY_META[p.category];
  const size = sizeBtn.dataset.size;
  const ex   = parseFloat(sizeBtn.dataset.extra || 0);
  const addons = [...document.querySelectorAll('#ppContent .addon-toggle.active')].map(a => ({
    name:  a.querySelector('.addon-name').textContent,
    price: parseFloat(a.dataset.price),
  }));
  const addonTotal = addons.reduce((s, a) => s + a.price, 0);
  const total = meta.price + ex + addonTotal;

  state.cart.push({
    cartId:        Date.now(),
    productId:     p.id,
    name:          p.name,
    category:      p.category,
    categoryLabel: meta.label,
    league:        p.league,
    image:         p.image,
    size,
    addons,
    basePrice:     meta.price,
    total,
  });

  saveCart();

  const addBtn = document.getElementById('ppAddBtn');
  if (addBtn) {
    const original = addBtn.innerHTML;
    addBtn.innerHTML = '<i class="fas fa-check"></i> Added to Cart!';
    addBtn.style.background = '#1db954';
    setTimeout(() => {
      addBtn.innerHTML = original;
      addBtn.style.background = '';
    }, 1800);
  }
}

function removeFromCart(cartId) {
  state.cart = state.cart.filter(item => item.cartId !== cartId);
  saveCart();
  updateCartBadge();
  renderCartPage();
}

function saveCart() {
  localStorage.setItem('yjs_cart', JSON.stringify(state.cart));
  updateCartBadge();
}

function updateCartBadge() {
  const count = state.cart.length;
  cartBadge.textContent = count;
  cartBadge.classList.toggle('hidden', count === 0);
}

/* ─── Cart page ─── */
function renderCartPage() {
  const cartView = document.getElementById('viewCart');
  if (state.cart.length === 0) {
    cartView.innerHTML = `
      <div class="container">
        <div class="cart-empty">
          <i class="fas fa-shopping-bag"></i>
          <h2>Your cart is empty</h2>
          <p>Browse our jerseys and add something you love.</p>
          <button class="cart-browse-btn" onclick="navigateTo('catalog')">
            <i class="fas fa-arrow-left"></i> Browse Jerseys
          </button>
        </div>
      </div>`;
    return;
  }

  const subtotal = state.cart.reduce((s, i) => s + i.total, 0);
  const shipping = state.cart.length >= 2 ? 0 : 5;
  const grandTotal = subtotal + shipping;

  const itemsHtml = state.cart.map(item => {
    const imgHtml = item.image
      ? `<img class="ci-img" src="${item.image}" alt="${item.name}">`
      : `<div class="ci-placeholder">${CATEGORY_META[item.category]?.icon || '⚽'}</div>`;

    const addonsText = item.addons.length
      ? item.addons.map(a => `✓ ${a.name} +€${a.price}`).join(' · ')
      : '';

    return `<div class="cart-item">
      ${imgHtml}
      <div class="ci-details">
        <div class="ci-name">${item.name}</div>
        <div class="ci-meta">
          <span class="ci-cat">${item.categoryLabel}</span>
          <span class="ci-size">Size: <strong>${item.size}</strong></span>
        </div>
        ${addonsText ? `<div class="ci-addons">${addonsText}</div>` : ''}
      </div>
      <div class="ci-price">€${item.total.toFixed(2)}</div>
      <button class="ci-remove" onclick="removeFromCart(${item.cartId})" title="Remove">
        <i class="fas fa-trash"></i>
      </button>
    </div>`;
  }).join('');

  const freeHint = shipping === 0
    ? `<div class="cs-free-hint"><i class="fas fa-gift"></i> Free shipping on 2+ items!</div>`
    : `<div class="cs-free-hint"><i class="fas fa-info-circle"></i> Add ${2 - state.cart.length} more item(s) for free shipping</div>`;

  cartView.innerHTML = `
    <div class="container">
      <div class="cart-header">
        <h2 class="cart-title">Your Cart</h2>
        <span class="cart-count">${state.cart.length} item${state.cart.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="cart-layout">
        <div class="cart-items">${itemsHtml}</div>
        <div class="cart-summary">
          <div class="cs-row">
            <span>Subtotal</span><span>€${subtotal.toFixed(2)}</span>
          </div>
          <div class="cs-row cs-shipping">
            <span>Shipping</span>
            <span>${shipping === 0 ? '<span class="free-ship">FREE</span>' : `€${shipping.toFixed(2)}`}</span>
          </div>
          ${freeHint}
          <div class="cs-row cs-total">
            <span>Total</span><span>€${grandTotal.toFixed(2)}</span>
          </div>
          <button class="cart-wa-btn" onclick="orderCartViaWhatsApp()">
            <i class="fab fa-whatsapp"></i> Order on WhatsApp — €${grandTotal.toFixed(2)}
          </button>
          <button class="cart-browse-btn" onclick="navigateTo('catalog')" style="width:100%;margin-top:10px;background:transparent;border:1px solid var(--border);color:var(--muted)">
            <i class="fas fa-arrow-left"></i> Continue Shopping
          </button>
          <div class="cs-paypal"><i class="fab fa-paypal"></i> PayPal accepted</div>
        </div>
      </div>
    </div>`;
}

/* ─── WhatsApp multi-item message ─── */
function orderCartViaWhatsApp() {
  const subtotal   = state.cart.reduce((s, i) => s + i.total, 0);
  const shipping   = state.cart.length >= 2 ? 0 : 5;
  const grandTotal = subtotal + shipping;
  const shippingLine = shipping === 0 ? 'FREE (2+ items)' : `€${shipping.toFixed(2)}`;

  const lines = [
    `👋 Hi! I'd like to order from *Four Four Two Jersey*:`,
    ``,
    `🛒 *My Order (${state.cart.length} item${state.cart.length !== 1 ? 's' : ''}):*`,
    ``,
  ];

  state.cart.forEach((item, i) => {
    lines.push(`${i + 1}. *${item.name}*`);
    lines.push(`   📂 ${item.categoryLabel}  |  ${item.league}`);
    lines.push(`   📏 Size: ${item.size}`);
    item.addons.forEach(a => lines.push(`   ✅ ${a.name}: +€${a.price}`));
    lines.push(`   💰 €${item.total.toFixed(2)}`);
    lines.push(``);
  });

  lines.push(`━━━━━━━━━━━━━━━`);
  lines.push(`💰 Subtotal: €${subtotal.toFixed(2)}`);
  lines.push(`🚚 Shipping: ${shippingLine}`);
  lines.push(`💳 *Total: €${grandTotal.toFixed(2)}*`);
  lines.push(``);
  lines.push(`Please confirm availability. Thank you!`);

  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
}

/* ─── SPA navigation ─── */
function navigateTo(view, productId) {
  state.view = view;

  document.getElementById('viewCatalog').classList.toggle('hidden', view !== 'catalog');
  document.getElementById('viewProduct').classList.toggle('hidden', view !== 'product');
  document.getElementById('viewCart').classList.toggle('hidden',   view !== 'cart');

  const showFilters = view === 'catalog';
  leagueBar.style.display = showFilters ? '' : 'none';
  teamBar.style.display   = showFilters ? '' : 'none';

  document.querySelector('.hero')?.style.setProperty('display', view === 'catalog' ? '' : 'none');
  document.getElementById('siteFooter').style.display = view === 'product' ? 'none' : '';

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (view === 'product' && productId != null) {
    state.currentProductId = productId;
    renderProductPage(productId);
  } else if (view === 'cart') {
    renderCartPage();
  } else if (view === 'catalog') {
    updateTeamBar();
    renderCatalog();
  }
}

function openProduct(id) {
  history.pushState({ view: 'product', id }, '', `#product-${id}`);
  navigateTo('product', id);
}

function goBack() {
  history.back();
}

function goHome(event) {
  event.preventDefault();
  history.pushState({ view: 'catalog' }, '', window.location.pathname);
  state.activeLeague = 'all';
  state.activeTeam   = '';
  state.searchQuery  = '';
  searchInput.value  = '';
  searchClear.style.display = 'none';
  document.querySelectorAll('#leagueBar .fpill').forEach(b => b.classList.remove('active'));
  document.querySelector('#leagueBar .fpill[data-league="all"]')?.classList.add('active');
  navigateTo('catalog');
}

/* ─── Browser back/forward ─── */
window.addEventListener('popstate', () => {
  const hash = window.location.hash;
  if (hash === '#cart') {
    navigateTo('cart');
  } else {
    const m = hash.match(/^#product-(\d+)$/);
    if (m) navigateTo('product', parseInt(m[1]));
    else   navigateTo('catalog');
  }
});

/* ─── League/team click handler ─── */
leagueBar.addEventListener('click', e => {
  const btn = e.target.closest('.fpill');
  if (!btn) return;
  document.querySelectorAll('#leagueBar .fpill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (btn.dataset.team) {
    state.activeTeam   = btn.dataset.team;
    state.activeLeague = 'all';
  } else {
    state.activeTeam   = '';
    state.activeLeague = btn.dataset.league || 'all';
  }

  updateTeamBar();
  renderCatalog();
  scrollToProducts();
});

/* ─── Search ─── */
searchInput.addEventListener('input', () => {
  state.searchQuery = searchInput.value;
  searchClear.style.display = state.searchQuery ? 'block' : 'none';
  renderCatalog();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  state.searchQuery = '';
  searchClear.style.display = 'none';
  renderCatalog();
});

/* ─── Cart button ─── */
cartBtn.addEventListener('click', () => {
  history.pushState({ view: 'cart' }, '', '#cart');
  navigateTo('cart');
});

/* ─── Sticky header shadow ─── */
window.addEventListener('scroll', () => {
  document.getElementById('header').style.boxShadow =
    window.scrollY > 10 ? '0 2px 16px rgba(0,0,0,.5)' : 'none';
});


/* ─── Init ─── */
updateCartBadge();

const initHash = window.location.hash;
if (initHash === '#cart') {
  navigateTo('cart');
} else {
  const m = initHash.match(/^#product-(\d+)$/);
  if (m) navigateTo('product', parseInt(m[1]));
  else   navigateTo('catalog');
}
