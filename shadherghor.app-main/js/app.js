/* =========================================================
   SHADHER GHOR - APP LOGIC
   ========================================================= */

(function () {
  "use strict";

  /* ---------------- STATE ---------------- */
  let cart = sanitizeCart(loadCart());
  let activeCategory = "all";
  let currentProduct = null;
  let selectedSizeIndex = 0;
  let selectedQty = 1;
  let deliveryLocation = localStorage.getItem("sg_location") || "";
  let deliveryCoords = JSON.parse(localStorage.getItem("sg_coords") || "null");
  let selectedTip = 0;
  let selectedPayMethod = "Cash on Delivery";
  let selectedWaNumber = WHATSAPP_NUMBERS.primary;
  let floatCartDismissed = false;

  /* ---------------- SPLASH ---------------- */
  const splash = document.getElementById("splash");
  if (splash) {
    setTimeout(() => splash.remove(), 2500);
  }

  /* ---------------- UTIL ---------------- */
  function formatMoney(n) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }
  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem("sg_cart")) || [];
    } catch (e) {
      return [];
    }
  }
  /* Defensively strips any cart line that points at a product/size that no
     longer exists in the catalog (e.g. after a menu update ships). Without
     this, a stale cart line could crash checkout. */
  function sanitizeCart(rawCart) {
    if (!Array.isArray(rawCart)) return [];
    const clean = rawCart.filter((l) => {
      if (!l || typeof l.productId !== "string") return false;
      const p = getProduct(l.productId);
      if (!p || !Array.isArray(p.sizes) || !p.sizes.length) return false;
      if (!p.sizes[l.sizeIndex]) return false;
      if (!(l.qty > 0)) return false;
      return true;
    });
    if (clean.length !== rawCart.length) {
      localStorage.setItem("sg_cart", JSON.stringify(clean));
    }
    return clean;
  }
  function saveCart() {
    localStorage.setItem("sg_cart", JSON.stringify(cart));
  }
  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 1800);
  }
  function getProduct(id) {
    return PRODUCTS.find((p) => p.id === id);
  }
  function cartLineKey(productId, sizeIndex) {
    return productId + "::" + sizeIndex;
  }
  function cartQtyTotal() {
    return cart.reduce((sum, l) => sum + l.qty, 0);
  }
  function cartItemTotal() {
    return cart.reduce((sum, l) => {
      const p = getProduct(l.productId);
      if (!p) return sum;
      const size = p.sizes && p.sizes[l.sizeIndex];
      const price = size ? size.price : p.basePrice;
      return sum + price * l.qty;
    }, 0);
  }
  function productCartQty(productId) {
    return cart.filter((l) => l.productId === productId).reduce((sum, l) => sum + l.qty, 0);
  }
  function defaultSizeIndexFor(productId) {
    const line = cart.find((l) => l.productId === productId);
    return line ? line.sizeIndex : 0;
  }
  function adjustCartQty(productId, sizeIndex, delta) {
    const key = cartLineKey(productId, sizeIndex);
    const idx = cart.findIndex((l) => cartLineKey(l.productId, l.sizeIndex) === key);
    if (idx === -1) {
      if (delta > 0) cart.push({ productId, sizeIndex, qty: delta });
    } else {
      cart[idx].qty += delta;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
    }
    saveCart();
    updateCartBadges();
  }

  /* ---------------- NAVIGATION ---------------- */
  function forceCloseAllOverlays() {
    document.querySelectorAll(".sheet.open").forEach((s) => s.classList.remove("open"));
    document.querySelectorAll(".sheet-backdrop.open").forEach((b) => b.classList.remove("open"));
  }

  function showScreen(id) {
    forceCloseAllOverlays();

    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
    document.querySelectorAll(".nav-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.screen === id);
    });
    window.scrollTo(0, 0);

    const focusFlow = id === "screen-summary" || id === "screen-success";
    document.getElementById("bottomNav").classList.toggle("force-hidden", focusFlow);

    updateFloatCartVisibility();
    const checkoutBar = document.getElementById("cartCheckoutBar");
    if (checkoutBar && id !== "screen-cart") checkoutBar.remove();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") forceCloseAllOverlays();
  });
  window.addEventListener("pageshow", () => {
    forceCloseAllOverlays();
  });

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const screen = btn.dataset.screen;
      if (screen === "screen-menu") renderMenuScreen("all");
      if (screen === "screen-cart") renderCartScreen();
      showScreen(screen);
    });
  });

  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen(btn.dataset.back));
  });

  document.getElementById("heroShopBtn").addEventListener("click", () => {
    renderMenuScreen("all");
    showScreen("screen-menu");
  });

  document.getElementById("backHomeBtn").addEventListener("click", () => {
    renderProductGrid();
    showScreen("screen-home");
  });

  /* ---------------- HOME: CATEGORIES ---------------- */
  function renderCategories() {
    const wrap = document.getElementById("categoryScroll");
    wrap.innerHTML = CATEGORIES.map(
      (c) => `
      <button class="cat-item" data-cat="${c.id}">
        <div class="cat-circle"><i class="${c.icon}"></i></div>
        <span>${c.name}</span>
      </button>`
    ).join("");
    wrap.querySelectorAll(".cat-item").forEach((el) => {
      el.addEventListener("click", () => {
        renderMenuScreen(el.dataset.cat);
        showScreen("screen-menu");
      });
    });
  }

  function renderOffers() {
    const wrap = document.getElementById("offersScroll");
    if (!wrap || typeof OFFERS === "undefined") return;
    wrap.innerHTML = OFFERS.map(
      (o) => `
      <div class="offer-card${o.theme === "green" ? " offer-card--green" : ""}">
        <div class="offer-icon"><i class="${o.icon}"></i></div>
        <div class="offer-body">
          <strong>${o.title}</strong>
          <span>${o.sub}</span>
          <span class="offer-tag">${o.tag}</span>
        </div>
      </div>`
    ).join("");
  }

  function renderReviewHighlights() {
    const wrap = document.getElementById("reviewHighlights");
    if (!wrap || typeof HIGHLIGHTS === "undefined") return;
    wrap.innerHTML = HIGHLIGHTS.map(
      (h) => `<div class="review-highlight"><i class="${h.icon}"></i><span>${h.text}</span></div>`
    ).join("");
  }

  function renderProductGrid() {
    const wrap = document.getElementById("productGrid");
    const bestsellers = PRODUCTS.filter((p) => p.badge === "Bestseller" || p.rating >= 4.7).slice(0, 6);
    document.getElementById("menuCount").textContent = bestsellers.length + " items";
    wrap.innerHTML = bestsellers.map(productCardHtml).join("");
    attachProductCardEvents(wrap);
  }

  function addControlHtml(p) {
    const qty = productCartQty(p.id);
    if (qty <= 0) {
      return `<button class="add-btn" data-open="${p.id}">ADD</button>`;
    }
    return `
      <div class="qty-stepper qty-stepper-sm" data-stepper="${p.id}">
        <button data-step="-1" aria-label="Remove one"><i class="fa-solid fa-minus"></i></button>
        <span>${qty}</span>
        <button data-step="1" aria-label="Add one"><i class="fa-solid fa-plus"></i></button>
      </div>`;
  }

  function productCardHtml(p) {
    const qty = productCartQty(p.id);
    return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
        <div class="veg-dot"><span></span></div>
        <i class="${p.icon}"></i>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-rating"><i class="fa-solid fa-star"></i> ${p.rating}</div>
        <div class="product-bottom${qty > 0 ? " has-stepper" : ""}">
          <div class="product-price">${formatMoney(p.basePrice)} <small>onwards</small></div>
          ${addControlHtml(p)}
        </div>
      </div>
    </div>`;
  }

  function productRowHtml(p) {
    return `
    <div class="product-row" data-id="${p.id}">
      <div class="product-row-img"><i class="${p.icon}"></i>${p.badge ? `<span class="product-badge" style="position:absolute;top:6px;left:6px;">${p.badge}</span>` : ""}</div>
      <div class="product-row-body">
        <div class="product-row-top">
          <div class="product-row-name">${p.name}</div>
        </div>
        <div class="product-row-desc">${p.desc}</div>
        <div class="product-row-bottom">
          <div class="product-price">${formatMoney(p.basePrice)} <small>onwards</small></div>
          ${addControlHtml(p)}
        </div>
      </div>
    </div>`;
  }

  function refreshVisibleProductControls() {
    document.querySelectorAll("[data-stepper], [data-open]").forEach((el) => {
      const id = el.dataset.stepper || el.dataset.open;
      const host = el.closest(".product-card, .product-row");
      if (!host) return;
      const bottom = host.querySelector(".product-bottom, .product-row-bottom");
      if (!bottom) return;
      const p = getProduct(id);
      if (!p) return;
      const priceEl = bottom.querySelector(".product-price");
      bottom.innerHTML = "";
      if (priceEl) bottom.appendChild(priceEl);
      bottom.insertAdjacentHTML("beforeend", addControlHtml(p));
      bottom.classList.toggle("has-stepper", productCartQty(id) > 0);
    });
    rewireStepperButtons(document);
  }

  function rewireStepperButtons(container) {
    container.querySelectorAll("[data-stepper]").forEach((el) => {
      if (el.dataset.wired) return;
      el.dataset.wired = "1";
      const productId = el.dataset.stepper;
      el.querySelectorAll("[data-step]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const delta = parseInt(btn.dataset.step, 10);
          const p = getProduct(productId);
          if (!p) return;
          const sizeIndex = defaultSizeIndexFor(productId);
          if (delta > 0 && p.sizes.length > 1 && productCartQty(productId) === 0) {
            openProductSheet(productId);
            return;
          }
          adjustCartQty(productId, sizeIndex, delta);
          floatCartDismissed = false;
          refreshVisibleProductControls();
        });
      });
    });
  }

  function attachProductCardEvents(container) {
    container.querySelectorAll("[data-open]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openProductSheet(el.dataset.open);
      });
    });
    rewireStepperButtons(container);
    container.querySelectorAll(".product-card, .product-row").forEach((el) => {
      el.addEventListener("click", () => openProductSheet(el.dataset.id));
    });
  }

  /* ---------------- MENU SCREEN ---------------- */
  function renderMenuScreen(catId) {
    activeCategory = catId;
    document.getElementById("menuScreenTitle").textContent =
      catId === "all" ? "All Items" : CATEGORIES.find((c) => c.id === catId)?.name || "Menu";

    const chipRow = document.getElementById("chipRow");
    chipRow.innerHTML =
      `<button class="chip ${catId === "all" ? "active" : ""}" data-chip="all">All</button>` +
      CATEGORIES.map((c) => `<button class="chip ${catId === c.id ? "active" : ""}" data-chip="${c.id}">${c.name}</button>`).join("");
    chipRow.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => renderMenuScreen(chip.dataset.chip));
    });

    const list = document.getElementById("productList");
    const items = catId === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === catId);
    list.innerHTML = items.map(productRowHtml).join("");
    attachProductCardEvents(list);
  }

  /* ---------------- SEARCH ---------------- */
  document.getElementById("openSearch").addEventListener("click", openSearchScreen);
  document.getElementById("openSearch2").addEventListener("click", openSearchScreen);
  function openSearchScreen() {
    showScreen("screen-search");
    document.getElementById("searchResults").innerHTML = "";
    document.getElementById("searchEmpty").classList.add("hidden");
    setTimeout(() => document.getElementById("searchInput").focus(), 200);
  }
  document.getElementById("searchInput").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    const resultsWrap = document.getElementById("searchResults");
    const emptyWrap = document.getElementById("searchEmpty");
    if (!q) {
      resultsWrap.innerHTML = "";
      emptyWrap.classList.add("hidden");
      return;
    }
    const results = PRODUCTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.category.includes(q)
    );
    if (results.length === 0) {
      resultsWrap.innerHTML = "";
      emptyWrap.classList.remove("hidden");
    } else {
      emptyWrap.classList.add("hidden");
      resultsWrap.innerHTML = results.map(productRowHtml).join("");
      attachProductCardEvents(resultsWrap);
    }
  });
  document.getElementById("clearSearch").addEventListener("click", () => {
    const input = document.getElementById("searchInput");
    input.value = "";
    input.dispatchEvent(new Event("input"));
    input.focus();
  });

  /* ---------------- PRODUCT SHEET ---------------- */
  const productBackdrop = document.getElementById("productBackdrop");
  const productSheet = document.getElementById("productSheet");

  function openProductSheet(productId) {
    const p = getProduct(productId);
    if (!p) return;
    currentProduct = p;
    selectedSizeIndex = 0;
    selectedQty = 1;
    renderProductSheetBody();
    productBackdrop.classList.add("open");
    productSheet.classList.add("open");
  }

  function closeProductSheet() {
    productBackdrop.classList.remove("open");
    productSheet.classList.remove("open");
  }
  document.getElementById("closeProductSheet").addEventListener("click", closeProductSheet);
  productBackdrop.addEventListener("click", closeProductSheet);

  function renderProductSheetBody() {
    const p = currentProduct;
    const size = p.sizes[selectedSizeIndex];
    const total = size.price * selectedQty;

    const body = document.getElementById("productSheetBody");
    body.innerHTML = `
      <div class="product-sheet-img"><i class="${p.icon}"></i></div>
      <h2>${p.name}</h2>
      <div class="product-rating" style="margin-bottom:10px;"><i class="fa-solid fa-star"></i> ${p.rating} rating</div>
      <p class="product-sheet-desc">${p.desc}</p>

      <div class="psheet-block">
        <span class="field-label" id="sizeOptionsLabel">Select Size / Portion</span>
        <div class="option-row" id="sizeOptions" role="group" aria-labelledby="sizeOptionsLabel">
          ${p.sizes
            .map(
              (s, i) => `
            <button type="button" class="option-chip ${i === selectedSizeIndex ? "active" : ""}" data-size="${i}" aria-pressed="${i === selectedSizeIndex}">
              ${s.label}<small>${formatMoney(s.price)}</small>
            </button>`
            )
            .join("")}
        </div>
      </div>

      <div class="psheet-block">
        <span class="field-label" id="qtyLabel">Quantity</span>
        <div class="qty-stepper" role="group" aria-labelledby="qtyLabel">
          <button type="button" id="qtyMinus" aria-label="Decrease quantity"><i class="fa-solid fa-minus"></i></button>
          <span id="qtyValue" aria-live="polite">${selectedQty}</span>
          <button type="button" id="qtyPlus" aria-label="Increase quantity"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>

      <div class="psheet-footer">
        <div class="psheet-price">
          <strong id="sheetTotalPrice">${formatMoney(total)}</strong>
          <span>Total for ${selectedQty} item${selectedQty > 1 ? "s" : ""}</span>
        </div>
        <button class="btn-primary" id="addToCartBtn"><i class="fa-solid fa-bag-shopping"></i> Add to Cart</button>
      </div>
    `;

    body.querySelectorAll("[data-size]").forEach((el) => {
      el.addEventListener("click", () => {
        selectedSizeIndex = parseInt(el.dataset.size, 10);
        renderProductSheetBody();
      });
    });
    document.getElementById("qtyMinus").addEventListener("click", () => {
      if (selectedQty > 1) selectedQty--;
      renderProductSheetBody();
    });
    document.getElementById("qtyPlus").addEventListener("click", () => {
      if (selectedQty < 20) selectedQty++;
      renderProductSheetBody();
    });
    document.getElementById("addToCartBtn").addEventListener("click", addCurrentToCart);
  }

  function addCurrentToCart() {
    const p = currentProduct;
    const key = cartLineKey(p.id, selectedSizeIndex);
    const existing = cart.find((l) => cartLineKey(l.productId, l.sizeIndex) === key);
    if (existing) {
      existing.qty += selectedQty;
    } else {
      cart.push({ productId: p.id, sizeIndex: selectedSizeIndex, qty: selectedQty });
    }
    saveCart();
    floatCartDismissed = false;
    updateCartBadges();
    showToast(p.name + " added to cart");
    closeProductSheet();
    renderProductGrid();
    if (document.getElementById("screen-menu").classList.contains("active")) renderMenuScreen(activeCategory);
  }

  /* ---------------- CART BADGES / FLOAT BAR ---------------- */
  function updateCartBadges() {
    const count = cartQtyTotal();
    const badge = document.getElementById("navCartBadge");
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove("hidden");
      badge.classList.remove("bump");
      void badge.offsetWidth;
      badge.classList.add("bump");
    } else {
      badge.classList.add("hidden");
    }
    updateFloatCartVisibility();
  }

  function updateFloatCartVisibility() {
    const floatCart = document.getElementById("floatCart");
    const count = cartQtyTotal();
    const onCartOrSummary =
      document.getElementById("screen-cart").classList.contains("active") ||
      document.getElementById("screen-summary").classList.contains("active") ||
      document.getElementById("screen-success").classList.contains("active");
    if (count > 0 && !onCartOrSummary && !floatCartDismissed) {
      floatCart.classList.remove("hidden");
      document.getElementById("floatCartCount").textContent = count + (count === 1 ? " item" : " items");
      document.getElementById("floatCartTotal").textContent = formatMoney(cartItemTotal());
    } else {
      floatCart.classList.add("hidden");
    }
  }
  document.getElementById("floatCartBtn").addEventListener("click", () => {
    renderCartScreen();
    showScreen("screen-cart");
  });

  document.getElementById("floatCartClose").addEventListener("click", (e) => {
    e.stopPropagation();
    floatCartDismissed = true;
    document.getElementById("floatCart").classList.add("hidden");
  });

  /* ---------------- CART SCREEN ---------------- */
  function renderCartScreen() {
    const emptyState = document.getElementById("cartEmptyState");
    const content = document.getElementById("cartContent");

    const oldBar = document.getElementById("cartCheckoutBar");
    if (oldBar) oldBar.remove();

    if (cart.length === 0) {
      emptyState.classList.remove("hidden");
      content.classList.add("hidden");
      return;
    }
    emptyState.classList.add("hidden");
    content.classList.remove("hidden");

    const itemsWrap = document.getElementById("cartItems");
    itemsWrap.innerHTML = cart
      .map((line) => {
        const p = getProduct(line.productId);
        if (!p) return "";
        const size = p.sizes[line.sizeIndex];
        const lineTotal = size.price * line.qty;
        return `
        <div class="cart-item" data-key="${cartLineKey(line.productId, line.sizeIndex)}">
          <div class="cart-item-img"><i class="${p.icon}"></i></div>
          <div class="cart-item-body">
            <div class="cart-item-name">${p.name}</div>
            <div class="cart-item-meta">${size.label}</div>
            <div class="cart-item-bottom">
              <div class="cart-item-price">${formatMoney(lineTotal)}</div>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="mini-stepper">
                  <button data-action="minus"><i class="fa-solid fa-minus"></i></button>
                  <span>${line.qty}</span>
                  <button data-action="plus"><i class="fa-solid fa-plus"></i></button>
                </div>
                <button class="remove-item" data-action="remove"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>`;
      })
      .join("");

    itemsWrap.querySelectorAll(".cart-item").forEach((el) => {
      const key = el.dataset.key;
      const line = cart.find((l) => cartLineKey(l.productId, l.sizeIndex) === key);
      el.querySelector('[data-action="plus"]').addEventListener("click", () => {
        line.qty++;
        saveCart();
        renderCartScreen();
        updateCartBadges();
      });
      el.querySelector('[data-action="minus"]').addEventListener("click", () => {
        line.qty--;
        if (line.qty <= 0) cart = cart.filter((l) => l !== line);
        saveCart();
        renderCartScreen();
        updateCartBadges();
      });
      el.querySelector('[data-action="remove"]').addEventListener("click", () => {
        cart = cart.filter((l) => l !== line);
        saveCart();
        renderCartScreen();
        updateCartBadges();
        showToast("Item removed");
      });
    });

    renderBill();
    injectCheckoutBar();
  }

  function renderBill() {
    const itemTotal = cartItemTotal();
    const freeDelivery = itemTotal >= FREE_DELIVERY_ABOVE;
    const deliveryFee = freeDelivery ? 0 : DELIVERY_FEE;

    document.getElementById("billItemTotal").textContent = formatMoney(itemTotal);
    document.getElementById("billDelivery").textContent = freeDelivery ? "FREE" : formatMoney(deliveryFee);

    const tipRow = document.getElementById("billTipRow");
    if (selectedTip > 0) {
      tipRow.style.display = "flex";
      document.getElementById("billTip").textContent = formatMoney(selectedTip);
    } else {
      tipRow.style.display = "none";
    }

    const discountRow = document.getElementById("billDiscountRow");
    if (freeDelivery) {
      discountRow.style.display = "flex";
      document.getElementById("billDiscount").textContent = "-" + formatMoney(DELIVERY_FEE);
    } else {
      discountRow.style.display = "none";
    }

    const grandTotal = itemTotal + deliveryFee + selectedTip;
    document.getElementById("billGrandTotal").textContent = formatMoney(grandTotal);

    const note = document.getElementById("freeDeliveryNote");
    if (!freeDelivery) {
      const remaining = FREE_DELIVERY_ABOVE - itemTotal;
      note.textContent = `Add ${formatMoney(remaining)} more to get FREE delivery`;
    } else {
      note.textContent = "You unlocked FREE delivery on this order";
    }
  }

  function injectCheckoutBar() {
    if (cart.length === 0) return;
    const existing = document.getElementById("cartCheckoutBar");
    if (existing) existing.remove();
    const bar = document.createElement("div");
    bar.className = "cart-checkout-bar";
    bar.id = "cartCheckoutBar";
    bar.innerHTML = `
      <div class="checkout-total">
        <strong id="ccbTotal">${formatMoney(cartItemTotal() + (cartItemTotal() >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE) + selectedTip)}</strong>
        <span>TOTAL</span>
      </div>
      <button class="btn-checkout" id="proceedToSummary">Proceed to Checkout <i class="fa-solid fa-arrow-right"></i></button>
    `;
    const appEl = document.getElementById("app") || document.body;
    appEl.appendChild(bar);
    document.getElementById("proceedToSummary").addEventListener("click", () => {
      renderSummaryScreen();
      showScreen("screen-summary");
    });
  }

  document.getElementById("tipRow").addEventListener("click", (e) => {
    const chip = e.target.closest(".tip-chip");
    if (!chip) return;
    document.querySelectorAll(".tip-chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    selectedTip = parseInt(chip.dataset.tip, 10);
    document.getElementById("tipCustom").value = "";
    renderBill();
    injectCheckoutBar();
  });
  document.getElementById("tipCustom").addEventListener("input", (e) => {
    document.querySelectorAll(".tip-chip").forEach((c) => c.classList.remove("active"));
    selectedTip = parseInt(e.target.value, 10) || 0;
    renderBill();
    injectCheckoutBar();
  });

  document.getElementById("payRow").addEventListener("click", (e) => {
    const chip = e.target.closest(".pay-chip");
    if (!chip) return;
    document.querySelectorAll(".pay-chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    selectedPayMethod = chip.dataset.pay;
    renderSummaryScreen();
  });

  document.getElementById("clearCartBtn").addEventListener("click", () => {
    if (cart.length === 0) return;
    if (confirm("Remove all items from your cart?")) {
      cart = [];
      saveCart();
      updateCartBadges();
      renderCartScreen();
      showToast("Cart cleared");
    }
  });

  /* ---------------- SUMMARY SCREEN ---------------- */
  function renderSummaryScreen() {
    const itemTotal = cartItemTotal();
    const freeDelivery = itemTotal >= FREE_DELIVERY_ABOVE;
    const deliveryFee = freeDelivery ? 0 : DELIVERY_FEE;
    const codFee = codDistanceFee();
    const grandTotal = itemTotal + deliveryFee + codFee + selectedTip;

    const itemsWrap = document.getElementById("summaryItems");
    itemsWrap.innerHTML = cart
      .map((line) => {
        const p = getProduct(line.productId);
        if (!p || !p.sizes[line.sizeIndex]) return "";
        const size = p.sizes[line.sizeIndex];
        return `<div class="summary-item-row">
          <span class="si-name">${p.name} x${line.qty}<span class="si-meta">${size.label}</span></span>
          <span>${formatMoney(size.price * line.qty)}</span>
        </div>`;
      })
      .join("");

    document.getElementById("sumItemTotal").textContent = formatMoney(itemTotal);
    document.getElementById("sumDelivery").textContent = freeDelivery ? "FREE" : formatMoney(deliveryFee);

    const codRow = document.getElementById("sumCodRow");
    if (codFee > 0) {
      codRow.style.display = "flex";
      const km = codDistanceKmRounded();
      document.getElementById("sumCodFee").textContent = formatMoney(codFee) + ` (${km.toFixed(1)} km)`;
    } else {
      codRow.style.display = "none";
    }

    const tipRow = document.getElementById("sumTipRow");
    if (selectedTip > 0) {
      tipRow.style.display = "flex";
      document.getElementById("sumTip").textContent = formatMoney(selectedTip);
    } else {
      tipRow.style.display = "none";
    }
    document.getElementById("sumGrandTotal").textContent = formatMoney(grandTotal);
    document.getElementById("sumPayMethod").textContent =
      "Payment method: " + selectedPayMethod +
      (codFee > 0 ? ` (includes distance-based COD charge)` : "");

    if (deliveryLocation && !document.getElementById("custAddress").value) {
      document.getElementById("custAddress").value = deliveryLocation;
    }
  }

  const custPhoneInput = document.getElementById("custPhone");
  if (custPhoneInput) {
    custPhoneInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
    });
  }

  document.getElementById("waNumSelect").addEventListener("click", (e) => {
    const chip = e.target.closest(".wa-num-chip");
    if (!chip) return;
    document.querySelectorAll(".wa-num-chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    selectedWaNumber = chip.dataset.num;
  });

  /* ---------------- SEND ORDER ON WHATSAPP ---------------- */
  document.getElementById("sendWhatsappBtn").addEventListener("click", () => {
    const name = document.getElementById("custName").value.trim();
    const phone = document.getElementById("custPhone").value.trim();
    const address = document.getElementById("custAddress").value.trim();
    const city = document.getElementById("custCity").value.trim();
    const dateTime = document.getElementById("custDateTime").value.trim();
    const note = document.getElementById("orderNote") ? document.getElementById("orderNote").value.trim() : "";

    if (!name || !phone || !address) {
      showToast("Please fill in name, phone and address");
      if (!name) document.getElementById("custName").focus();
      else if (!phone) document.getElementById("custPhone").focus();
      else document.getElementById("custAddress").focus();
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      showToast("Please enter a valid 10-digit phone number");
      document.getElementById("custPhone").focus();
      return;
    }

    /* Safety net: drop any cart line whose product/size vanished since the
       summary screen was rendered, so we never build a broken message. */
    cart = sanitizeCart(cart);
    if (cart.length === 0) {
      showToast("Your cart is empty. Please add items again.");
      showScreen("screen-cart");
      return;
    }

    const itemTotal = cartItemTotal();
    const freeDelivery = itemTotal >= FREE_DELIVERY_ABOVE;
    const deliveryFee = freeDelivery ? 0 : DELIVERY_FEE;
    const codFee = codDistanceFee();
    const grandTotal = itemTotal + deliveryFee + codFee + selectedTip;

    let msg = `Hello Shadher Ghor! I would like to place an order.\n\n`;
    msg += `*Order Details:*\n`;
    cart.forEach((line) => {
      const p = getProduct(line.productId);
      if (!p || !p.sizes[line.sizeIndex]) return;
      const size = p.sizes[line.sizeIndex];
      msg += `- ${p.name} (${size.label}) x${line.qty} = ${formatMoney(size.price * line.qty)}\n`;
    });
    msg += `\n*Item Total:* ${formatMoney(itemTotal)}`;
    msg += `\n*Delivery Fee:* ${freeDelivery ? "FREE" : formatMoney(deliveryFee)}`;
    if (codFee > 0) {
      msg += `\n*COD Distance Charge:* ${formatMoney(codFee)} (~${codDistanceKmRounded().toFixed(1)} km at ₹${COD_RATE_PER_KM}/km)`;
    }
    if (selectedTip > 0) msg += `\n*Tip for Chefs:* ${formatMoney(selectedTip)}`;
    msg += `\n*Total Amount:* ${formatMoney(grandTotal)}`;
    msg += `\n*Payment Method:* ${selectedPayMethod}`;

    if (note) msg += `\n\n*Note for chef:* ${note}`;

    msg += `\n\n*Customer Details:*`;
    msg += `\nName: ${name}`;
    msg += `\nPhone: ${phoneDigits}`;
    msg += `\nAddress: ${address}`;
    if (city) msg += `\nCity/Pincode: ${city}`;
    if (dateTime) msg += `\nPreferred Delivery: ${dateTime}`;
    if (deliveryCoords) {
      msg += `\nLocation Pin: https://www.google.com/maps?q=${deliveryCoords.lat},${deliveryCoords.lng}`;
    }

    msg += `\n\nPlease confirm my order. Thank you!`;

    const url = `https://wa.me/${selectedWaNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");

    showScreen("screen-success");
    cart = [];
    saveCart();
    updateCartBadges();
  });

  /* ---------------- LOCATION SHEET ---------------- */
  const locationBackdrop = document.getElementById("locationBackdrop");
  const locationSheet = document.getElementById("locationSheet");
  document.getElementById("openLocationSheet").addEventListener("click", () => {
    document.getElementById("locationInput").value = deliveryLocation;
    locationBackdrop.classList.add("open");
    locationSheet.classList.add("open");
  });
  locationBackdrop.addEventListener("click", hideLocationSheet);
  document.getElementById("closeLocationSheet").addEventListener("click", hideLocationSheet);
  function hideLocationSheet() {
    locationBackdrop.classList.remove("open");
    locationSheet.classList.remove("open");
  }
  document.getElementById("saveLocationBtn").addEventListener("click", () => {
    const val = document.getElementById("locationInput").value.trim();
    if (!val) {
      showToast("Please enter your location");
      return;
    }
    deliveryLocation = val;
    localStorage.setItem("sg_location", val);
    document.getElementById("currentLocation").innerHTML = val.length > 22 ? val.slice(0, 22) + "... <i class='fa-solid fa-chevron-down'></i>" : val + ' <i class="fa-solid fa-chevron-down"></i>';
    hideLocationSheet();
    showToast("Location saved");
  });

  /* ---------------- AUTO-DETECT LOCATION ---------------- */
  const COD_RATE_PER_KM = 20;

  function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function codDistanceFee() {
    if (selectedPayMethod !== "Cash on Delivery") return 0;
    if (!deliveryCoords) return 0;
    const km = distanceKm(STORE_LAT, STORE_LNG, deliveryCoords.lat, deliveryCoords.lng);
    return Math.round(km * COD_RATE_PER_KM);
  }

  function codDistanceKmRounded() {
    if (!deliveryCoords) return 0;
    return distanceKm(STORE_LAT, STORE_LNG, deliveryCoords.lat, deliveryCoords.lng);
  }

  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("geocode failed");
      const data = await res.json();
      if (data && data.display_name) {
        const a = data.address || {};
        const parts = [
          a.suburb || a.neighbourhood || a.road,
          a.city || a.town || a.village || a.county,
          a.state,
        ].filter(Boolean);
        return parts.length ? parts.join(", ") : data.display_name;
      }
    } catch (e) {
      /* offline or blocked */
    }
    return `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  function applyDetectedLocation(label, lat, lng) {
    deliveryLocation = label;
    deliveryCoords = { lat, lng };
    localStorage.setItem("sg_location", label);
    localStorage.setItem("sg_coords", JSON.stringify(deliveryCoords));
    document.getElementById("currentLocation").innerHTML =
      (label.length > 22 ? label.slice(0, 22) + "..." : label) + ' <i class="fa-solid fa-chevron-down"></i>';
    const input = document.getElementById("locationInput");
    if (input) input.value = label;
    const addrField = document.getElementById("custAddress");
    if (addrField && !addrField.value.trim()) addrField.value = label;
  }

  function runAutoLocate(btn, labelEl, onDone) {
    if (!("geolocation" in navigator)) {
      showToast("Location services aren't supported on this device");
      return;
    }
    btn.classList.add("locating");
    btn.classList.remove("success");
    if (labelEl) labelEl.textContent = "Detecting your location...";

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const label = await reverseGeocode(latitude, longitude);
        applyDetectedLocation(label, latitude, longitude);
        btn.classList.remove("locating");
        btn.classList.add("success");
        if (labelEl) labelEl.textContent = "Location detected!";
        showToast("Location updated: " + label);
        if (onDone) onDone(label);
        setTimeout(() => {
          btn.classList.remove("success");
          if (labelEl) labelEl.textContent = btn.dataset.defaultLabel || "Auto-detect my location";
        }, 2200);
      },
      (err) => {
        btn.classList.remove("locating");
        if (labelEl) labelEl.textContent = btn.dataset.defaultLabel || "Auto-detect my location";
        if (err.code === err.PERMISSION_DENIED) {
          showToast("Please allow location access to auto-detect");
        } else {
          showToast("Couldn't detect location, try entering it manually");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  const autoLocateBtn = document.getElementById("autoLocateBtn");
  const autoLocateLabel = document.getElementById("autoLocateLabel");
  if (autoLocateBtn) {
    autoLocateBtn.dataset.defaultLabel = autoLocateLabel ? autoLocateLabel.textContent : "";
    autoLocateBtn.addEventListener("click", () => runAutoLocate(autoLocateBtn, autoLocateLabel));
  }

  const useMyLocationBtn = document.getElementById("useMyLocationBtn");
  if (useMyLocationBtn) {
    useMyLocationBtn.dataset.defaultLabel = useMyLocationBtn.innerHTML;
    useMyLocationBtn.addEventListener("click", () => {
      runAutoLocate(useMyLocationBtn, null, (label) => {
        document.getElementById("custAddress").value = label;
        useMyLocationBtn.innerHTML = '<i class="fa-solid fa-check"></i> Location applied';
        renderSummaryScreen();
        setTimeout(() => {
          useMyLocationBtn.innerHTML = useMyLocationBtn.dataset.defaultLabel;
        }, 2200);
      });
    });
  }

  /* ---------------- CONTACT SHEET ---------------- */
  const contactBackdrop = document.getElementById("contactBackdrop");
  const contactSheet = document.getElementById("contactSheet");
  document.getElementById("openContact").addEventListener("click", () => {
    contactBackdrop.classList.add("open");
    contactSheet.classList.add("open");
  });
  function hideContactSheet() {
    contactBackdrop.classList.remove("open");
    contactSheet.classList.remove("open");
  }
  contactBackdrop.addEventListener("click", hideContactSheet);
  document.getElementById("closeContactSheet").addEventListener("click", hideContactSheet);

  /* ---------------- PWA INSTALL ---------------- */
  let deferredPrompt = null;
  const installBanner = document.getElementById("installBanner");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!sessionStorage.getItem("sg_install_dismissed") && !isStandalone()) {
      setTimeout(() => installBanner.classList.remove("hidden"), 2600);
    }
  });

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  async function triggerInstall() {
    if (!deferredPrompt) {
      showToast("App already installed or not supported on this browser");
      return;
    }
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      showToast("Installing Shadher Ghor...");
    }
    deferredPrompt = null;
    installBanner.classList.add("hidden");
  }

  document.getElementById("installBtn").addEventListener("click", triggerInstall);
  document.getElementById("moreInstallBtn").addEventListener("click", triggerInstall);

  /* ---------------- CUSTOM ENQUIRY SHEET ---------------- */
  const customBackdrop = document.getElementById("customBackdrop");
  const customSheet = document.getElementById("customSheet");
  let customOccasion = "Birthday Party";

  document.getElementById("moreCustomBtn").addEventListener("click", () => {
    customBackdrop.classList.add("open");
    customSheet.classList.add("open");
  });
  function hideCustomSheet() {
    customBackdrop.classList.remove("open");
    customSheet.classList.remove("open");
  }
  customBackdrop.addEventListener("click", hideCustomSheet);
  document.getElementById("closeCustomSheet").addEventListener("click", hideCustomSheet);

  document.getElementById("customOccasionOptions").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-occasion]");
    if (!btn) return;
    customOccasion = btn.dataset.occasion;
    document.querySelectorAll("#customOccasionOptions .option-chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
  });

  document.getElementById("sendCustomEnquiryBtn").addEventListener("click", () => {
    const theme = document.getElementById("customTheme").value.trim();
    const size = document.getElementById("customSize").value.trim();
    const dateVal = document.getElementById("customDate").value;
    const instructions = document.getElementById("customInstructions").value.trim();

    let dateLabel = "";
    if (dateVal) {
      const d = new Date(dateVal);
      if (!isNaN(d)) {
        dateLabel = d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
      }
    }

    let msg = "Hello Shadher Ghor! I'd like to make a catering enquiry.\n\n";
    msg += "*Event Type:* " + customOccasion + "\n";
    if (theme) msg += "*Dishes interested in:* " + theme + "\n";
    if (size) msg += "*Number of people:* " + size + "\n";
    if (dateLabel) msg += "*Preferred date & time:* " + dateLabel + "\n";
    if (instructions) msg += "*Special instructions:* " + instructions + "\n";
    msg += "\n\nPlease let me know if this is possible and the pricing. Thank you!";

    window.open(`https://wa.me/${WHATSAPP_NUMBERS.primary}?text=${encodeURIComponent(msg)}`, "_blank");
    hideCustomSheet();
    showToast("Opening WhatsApp with your enquiry...");
  });

  document.getElementById("dismissInstall").addEventListener("click", () => {
    installBanner.classList.add("hidden");
    sessionStorage.setItem("sg_install_dismissed", "1");
  });

  window.addEventListener("appinstalled", () => {
    installBanner.classList.add("hidden");
    showToast("Shadher Ghor installed successfully!");
  });

  /* ---------------- SERVICE WORKER + UPDATE FLOW ---------------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("service-worker.js")
        .then((reg) => {
          /* A new SW found while this tab is open: let the user know and
             offer a one-tap refresh instead of silently swapping caches
             underneath an active session. */
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                showUpdateToast();
              }
            });
          });
        })
        .catch(() => {});

      let reloadedOnce = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloadedOnce) return;
        reloadedOnce = true;
        window.location.reload();
      });
    });
  }

  function showUpdateToast() {
    const toast = document.getElementById("toast");
    toast.innerHTML = 'New version available &middot; <span id="updateReloadBtn" style="text-decoration:underline;cursor:pointer;">Tap to refresh</span>';
    toast.classList.add("show", "update-toast");
    const btn = document.getElementById("updateReloadBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg && reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
          });
        }
      });
    }
  }

  /* ---------------- INIT ---------------- */
  function init() {
    renderCategories();
    renderProductGrid();
    renderOffers();
    renderReviewHighlights();
    updateCartBadges();
    const versionLabel = document.getElementById("appVersionLabel");
    if (versionLabel && typeof APP_VERSION !== "undefined") {
      versionLabel.textContent = "Shadher Ghor App \u00B7 Version " + APP_VERSION;
    }
    if (deliveryLocation) {
      document.getElementById("currentLocation").innerHTML =
        (deliveryLocation.length > 22 ? deliveryLocation.slice(0, 22) + "..." : deliveryLocation) + ' <i class="fa-solid fa-chevron-down"></i>';
    }
    showScreen("screen-home");
  }

  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") init();
})();