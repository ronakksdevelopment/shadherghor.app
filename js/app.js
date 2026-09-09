/* =========================================================
   SWADER GHOR - APP LOGIC
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
  let currentLang = localStorage.getItem("sg_lang") || "en";

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
  /* Renders a real photo when `image` is set on a product/category,
     otherwise falls back to the existing Font Awesome icon treatment.
     `extraHtml` lets callers keep badges/overlays that sit on top of the
     art (bestseller ribbon, veg dot, etc). */
  const MEDIA_TILE_SELECTOR = ".product-img, .product-row-img, .product-sheet-img, .cat-circle, .cart-item-img";
  function mediaHtml(entity, extraHtml) {
    extraHtml = extraHtml || "";
    if (entity && entity.image) {
      return `<img class="tile-photo" src="${escapeHtml(entity.image)}" alt="" loading="lazy">${extraHtml}<i class="${entity.icon}"></i>`;
    }
    return `${extraHtml}<i class="${entity.icon}"></i>`;
  }
  /* Delegated load/error handling for every .tile-photo currently in the
     DOM: adds .has-photo to the tile once the image is confirmed to have
     loaded (hiding the icon underneath via CSS), or removes the broken
     <img> on error so the icon fallback shows immediately. Runs on the
     capture phase since 'load'/'error' don't bubble. */
  document.addEventListener(
    "load",
    (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || !img.classList.contains("tile-photo")) return;
      const tile = img.closest(MEDIA_TILE_SELECTOR);
      if (tile) tile.classList.add("has-photo");
    },
    true
  );
  document.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || !img.classList.contains("tile-photo")) return;
      const tile = img.closest(MEDIA_TILE_SELECTOR);
      if (tile) tile.classList.remove("has-photo");
      img.remove();
    },
    true
  );
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
    btn.addEventListener("click", () => {
      const target = btn.dataset.back;
      /* Re-render the cart screen whenever we land back on it so the
         dynamically-injected checkout bar (removed by showScreen() on
         every other screen) gets rebuilt immediately, instead of only
         reappearing after a bottom-nav tap. */
      if (target === "screen-cart") renderCartScreen();
      showScreen(target);
    });
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
        <div class="cat-circle">${mediaHtml(c)}</div>
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
    document.getElementById("menuCount").textContent = t(
      bestsellers.length === 1 ? "itemCount" : "itemCountPlural",
      { n: bestsellers.length }
    );
    wrap.innerHTML = bestsellers.map(productCardHtml).join("");
    attachProductCardEvents(wrap);
  }

  function addControlHtml(p) {
    const qty = productCartQty(p.id);
    if (qty <= 0) {
      return `<button class="add-btn" data-open="${p.id}">${t("addLabel")}</button>`;
    }
    return `
      <div class="qty-stepper qty-stepper-sm" data-stepper="${p.id}">
        <button data-step="-1" aria-label="${t("decreaseQtyAria")}"><i class="fa-solid fa-minus"></i></button>
        <span>${qty}</span>
        <button data-step="1" aria-label="${t("increaseQtyAria")}"><i class="fa-solid fa-plus"></i></button>
      </div>`;
  }

  function productCardHtml(p) {
    const qty = productCartQty(p.id);
    return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img">
        ${mediaHtml(p, (p.badge ? `<span class="product-badge">${p.badge}</span>` : "") + `<div class="veg-dot"><span></span></div>`)}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-rating"><i class="fa-solid fa-star"></i> ${p.rating}</div>
        <div class="product-bottom${qty > 0 ? " has-stepper" : ""}">
          <div class="product-price">${formatMoney(p.basePrice)} <small>${t("onwards")}</small></div>
          ${addControlHtml(p)}
        </div>
      </div>
    </div>`;
  }

  function productRowHtml(p) {
    return `
    <div class="product-row" data-id="${p.id}">
      <div class="product-row-img">${mediaHtml(p, p.badge ? `<span class="product-badge" style="position:absolute;top:6px;left:6px;">${p.badge}</span>` : "")}</div>
      <div class="product-row-body">
        <div class="product-row-top">
          <div class="product-row-name">${p.name}</div>
        </div>
        <div class="product-row-desc">${p.desc}</div>
        <div class="product-row-bottom">
          <div class="product-price">${formatMoney(p.basePrice)} <small>${t("onwards")}</small></div>
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
      catId === "all" ? t("allItems") : CATEGORIES.find((c) => c.id === catId)?.name || t("allItems");

    const chipRow = document.getElementById("chipRow");
    chipRow.innerHTML =
      `<button class="chip ${catId === "all" ? "active" : ""}" data-chip="all">${t("all")}</button>` +
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
      <div class="product-sheet-img">${mediaHtml(p)}</div>
      <h2>${p.name}</h2>
      <div class="product-rating" style="margin-bottom:10px;"><i class="fa-solid fa-star"></i> ${p.rating} rating</div>
      <p class="product-sheet-desc">${p.desc}</p>

      <div class="psheet-block">
        <span class="field-label" id="sizeOptionsLabel">${t("selectSize")}</span>
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
        <span class="field-label" id="qtyLabel">${t("quantity")}</span>
        <div class="qty-stepper" role="group" aria-labelledby="qtyLabel">
          <button type="button" id="qtyMinus" aria-label="${t("decreaseQtyAria")}"><i class="fa-solid fa-minus"></i></button>
          <span id="qtyValue" aria-live="polite">${selectedQty}</span>
          <button type="button" id="qtyPlus" aria-label="${t("increaseQtyAria")}"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>

      <div class="psheet-footer">
        <div class="psheet-price">
          <strong id="sheetTotalPrice">${formatMoney(total)}</strong>
          <span>${t(selectedQty > 1 ? "totalForItemsPlural" : "totalForItems", { n: selectedQty })}</span>
        </div>
        <button class="btn-primary" id="addToCartBtn"><i class="fa-solid fa-bag-shopping"></i> ${t("addToCart")}</button>
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
    showToast(t("toastAddedToCart", { name: p.name }));
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
          <div class="cart-item-img">${mediaHtml(p)}</div>
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
        showToast(t("toastItemRemoved"));
      });
    });

    renderBill();
    injectCheckoutBar();
  }

  function renderBill() {
    const itemTotal = cartItemTotal();
    const freeDelivery = itemTotal >= FREE_DELIVERY_ABOVE;
    const deliveryCalc = computeDeliveryFee();
    const deliveryFee = freeDelivery ? 0 : deliveryCalc.fee;

    document.getElementById("billItemTotal").textContent = formatMoney(itemTotal);
    document.getElementById("billDelivery").textContent = freeDelivery ? t("free") : formatMoney(deliveryFee);

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
      document.getElementById("billDiscount").textContent = "-" + formatMoney(deliveryCalc.fee);
    } else {
      discountRow.style.display = "none";
    }

    const grandTotal = itemTotal + deliveryFee + selectedTip;
    document.getElementById("billGrandTotal").textContent = formatMoney(grandTotal);

    const note = document.getElementById("freeDeliveryNote");
    if (!freeDelivery) {
      const remaining = FREE_DELIVERY_ABOVE - itemTotal;
      note.textContent = t("addMoreForFreeDelivery", { amount: formatMoney(remaining) });
    } else {
      note.textContent = t("unlockedFreeDelivery");

    }
  }

  function injectCheckoutBar() {
    if (cart.length === 0) return;
    const existing = document.getElementById("cartCheckoutBar");
    if (existing) existing.remove();
    const itemTotal = cartItemTotal();
    const freeDelivery = itemTotal >= FREE_DELIVERY_ABOVE;
    const deliveryFee = freeDelivery ? 0 : computeDeliveryFee().fee;
    const bar = document.createElement("div");
    bar.className = "cart-checkout-bar";
    bar.id = "cartCheckoutBar";
    bar.innerHTML = `
      <div class="checkout-total">
        <strong id="ccbTotal">${formatMoney(itemTotal + deliveryFee + selectedTip)}</strong>
        <span>${t("totalLabel")}</span>
      </div>
      <button class="btn-checkout" id="proceedToSummary">${t("proceedCheckout")} <i class="fa-solid fa-arrow-right"></i></button>
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
    /* Show the UPI ID / phone / demo QR sheet whenever UPI is picked, so
       the customer can copy the payment details before checking out. */
    if (chip.dataset.pay === "UPI / Online (pay on delivery link)") {
      showUpiSheet();
    }
  });

  document.getElementById("clearCartBtn").addEventListener("click", async () => {
    if (cart.length === 0) return;
    const confirmed = await showConfirm({
      title: t("clearCartTitle"),
      message: t("clearCartMessage"),
      okLabel: t("clearCartConfirm"),
    });
    if (confirmed) {
      cart = [];
      saveCart();
      updateCartBadges();
      renderCartScreen();
      showToast(t("toastCartCleared"));
    }
  });

  /* Maps the internal (English) payment-method identifier used in
     data-pay attributes to its translation key, so the value shown to
     the customer (checkout note, WhatsApp message) is always in their
     selected language rather than the raw internal string. */
  function payMethodLabel(method) {
    if (method === "Cash on Delivery") return t("cashOnDelivery");
    if (method === "UPI / Online (pay on delivery link)") return t("upiPayment");
    return method;
  }

  /* ---------------- SUMMARY SCREEN ---------------- */
  function renderSummaryScreen() {
    const itemTotal = cartItemTotal();
    const freeDelivery = itemTotal >= FREE_DELIVERY_ABOVE;
    const deliveryCalc = computeDeliveryFee();
    const deliveryFee = freeDelivery ? 0 : deliveryCalc.fee;
    const grandTotal = itemTotal + deliveryFee + selectedTip;

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
    document.getElementById("sumDelivery").textContent = freeDelivery ? t("free") : formatMoney(deliveryFee);

    /* Distance note: shown whenever we have a real GPS fix, for every
       payment method (not just COD), since delivery pricing is always
       distance-based now. When coordinates aren't pinned yet, nudge the
       customer to pin their location instead of silently guessing. */
    const distanceRow = document.getElementById("sumDistanceRow");
    if (!freeDelivery && deliveryCalc.km !== null) {
      distanceRow.style.display = "flex";
      document.getElementById("sumDistanceValue").textContent = `${deliveryCalc.km.toFixed(1)} km`;
    } else if (!freeDelivery && deliveryCalc.provisional) {
      distanceRow.style.display = "flex";
      document.getElementById("sumDistanceValue").textContent = t("pinLocationForAccuratePricing");
    } else {
      distanceRow.style.display = "none";
    }

    const tipRow = document.getElementById("sumTipRow");
    if (selectedTip > 0) {
      tipRow.style.display = "flex";
      document.getElementById("sumTip").textContent = formatMoney(selectedTip);
    } else {
      tipRow.style.display = "none";
    }
    document.getElementById("sumGrandTotal").textContent = formatMoney(grandTotal);
    document.getElementById("sumPayMethod").textContent = t("paymentMethodNote", { method: payMethodLabel(selectedPayMethod) });

    /* Intentionally no default/auto-fill of the address field here. The
       customer must either type their address or tap "Use my current
       location" — we never silently pre-fill it with the general saved
       delivery area, since that could be stale or imprecise. */

    /* Coordinates field always reflects current state on (re)render, so
       switching languages or re-opening checkout doesn't lose the pin. */
    const coordsInput = document.getElementById("custCoords");
    if (coordsInput && document.activeElement !== coordsInput) {
      coordsInput.value = deliveryCoords ? `${deliveryCoords.lat.toFixed(6)}, ${deliveryCoords.lng.toFixed(6)}` : "";
    }
    updateCoordsMapLink();
  }

  const custPhoneInput = document.getElementById("custPhone");
  if (custPhoneInput) {
    custPhoneInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
    });
  }

  /* If the customer hand-edits the address after we auto-filled it from
     GPS, the typed text and the pinned coordinates can drift apart. Keep
     the coordinates (still useful context) but track the divergence so we
     never claim the pin matches an address the customer has since
     rewritten from scratch. */
  let lastAutoFilledAddress = "";
  let addressEditedAfterLocate = false;
  const custAddressInput = document.getElementById("custAddress");
  if (custAddressInput) {
    custAddressInput.addEventListener("input", (e) => {
      if (lastAutoFilledAddress && e.target.value.trim() !== lastAutoFilledAddress.trim()) {
        addressEditedAfterLocate = true;
      }
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
      showToast(t("toastFillDetails"));
      if (!name) document.getElementById("custName").focus();
      else if (!phone) document.getElementById("custPhone").focus();
      else document.getElementById("custAddress").focus();
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      showToast(t("toastInvalidPhone"));
      document.getElementById("custPhone").focus();
      return;
    }

    /* Sync deliveryCoords from whatever is currently typed in the
       coordinates field — the customer may have hand-edited an
       auto-filled pin, or typed one in manually without ever tapping
       the locate button. Delivery pricing must always reflect this
       field's current value, not a stale auto-detected one. */
    const coordsField = document.getElementById("custCoords");
    if (coordsField) {
      const raw = coordsField.value.trim();
      if (raw) {
        const parsed = parseCoordsInput(raw);
        if (!parsed) {
          showToast(t("toastCoordsInvalid"));
          coordsField.focus();
          return;
        }
        deliveryCoords = parsed;
        localStorage.setItem("sg_coords", JSON.stringify(deliveryCoords));
      } else {
        deliveryCoords = null;
        localStorage.removeItem("sg_coords");
      }
    }

    /* Safety net: drop any cart line whose product/size vanished since the
       summary screen was rendered, so we never build a broken message. */
    cart = sanitizeCart(cart);
    if (cart.length === 0) {
      showToast(t("toastCartEmptyRetry"));
      renderCartScreen();
      showScreen("screen-cart");
      return;
    }

    const itemTotal = cartItemTotal();
    const freeDelivery = itemTotal >= FREE_DELIVERY_ABOVE;
    const deliveryCalc = computeDeliveryFee();
    const deliveryFee = freeDelivery ? 0 : deliveryCalc.fee;
    const grandTotal = itemTotal + deliveryFee + selectedTip;

    let msg = `Hello Swader Ghor! I would like to place an order.\n\n`;
    msg += `*ORDER DETAILS*\n`;
    cart.forEach((line) => {
      const p = getProduct(line.productId);
      if (!p || !p.sizes[line.sizeIndex]) return;
      const size = p.sizes[line.sizeIndex];
      msg += `• ${p.name} (${size.label}) x${line.qty} — ${formatMoney(size.price * line.qty)}\n`;
    });
    msg += `\n*BILL SUMMARY*\n`;
    msg += `Item Total: ${formatMoney(itemTotal)}\n`;
    if (!freeDelivery && deliveryCalc.km !== null) {
      msg += `Delivery Fee: ${formatMoney(deliveryFee)} (~${deliveryCalc.km.toFixed(1)} km)\n`;
    } else {
      msg += `Delivery Fee: ${freeDelivery ? "FREE" : formatMoney(deliveryFee)}\n`;
    }
    if (selectedTip > 0) msg += `Tip for Chefs: ${formatMoney(selectedTip)}\n`;
    msg += `*Total Amount: ${formatMoney(grandTotal)}*\n`;
    msg += `Payment Method: ${payMethodLabel(selectedPayMethod)}`;

    if (note) msg += `\n\n*Note for chef:* ${note}`;

    msg += `\n\n*CUSTOMER DETAILS*\n`;
    msg += `Name: ${name}\n`;
    msg += `Phone: ${phoneDigits}\n`;
    msg += `Address: ${address}`;
    if (city) msg += `\nCity/Pincode: ${city}`;
    if (dateTime) msg += `\nPreferred Delivery: ${dateTime}`;
    if (deliveryCoords) {
      msg += `\n\n*DELIVERY LOCATION*\n`;
      msg += `Coordinates: ${deliveryCoords.lat.toFixed(6)}, ${deliveryCoords.lng.toFixed(6)}\n`;
      msg += `Google Maps: https://maps.google.com/?q=${deliveryCoords.lat},${deliveryCoords.lng}`;
      if (addressEditedAfterLocate) {
        msg += `\n(Note: address text was edited after pinning)`;
      }
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
      showToast(t("toastEnterLocation"));
      return;
    }
    deliveryLocation = val;
    localStorage.setItem("sg_location", val);
    document.getElementById("currentLocation").innerHTML = val.length > 22 ? val.slice(0, 22) + "... <i class='fa-solid fa-chevron-down'></i>" : val + ' <i class="fa-solid fa-chevron-down"></i>';
    hideLocationSheet();
    showToast(t("toastLocationSaved"));
  });

  /* ---------------- DELIVERY FEE (GPS-distance-based only) ---------------- */
  const PER_KM_RATE = typeof PER_KM_DELIVERY_RATE !== "undefined" ? PER_KM_DELIVERY_RATE : 12;
  const BASE_KM = typeof BASE_DELIVERY_KM !== "undefined" ? BASE_DELIVERY_KM : 3;
  const BASE_FEE = typeof BASE_DELIVERY_FEE !== "undefined" ? BASE_DELIVERY_FEE : 39;

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

  /* Straight-line distance in km from the store to the customer's pinned
     delivery coordinates. Returns null if no coordinates are set yet —
     callers must not fall back to any area/place-name based estimate. */
  function deliveryDistanceKm() {
    if (!deliveryCoords) return null;
    return distanceKm(STORE_LAT, STORE_LNG, deliveryCoords.lat, deliveryCoords.lng);
  }

  /* Single source of truth for delivery pricing, used for every payment
     method. Fee is derived only from GPS coordinates: a flat base fee
     covers the first BASE_KM, and every additional km (rounded up) is
     charged at PER_KM_RATE. If coordinates aren't pinned yet, the base
     fee is shown provisionally and callers should prompt the customer
     to pin their location for an accurate charge. */
  function computeDeliveryFee() {
    const km = deliveryDistanceKm();
    if (km === null) return { fee: BASE_FEE, km: null, provisional: true };
    if (km <= BASE_KM) return { fee: BASE_FEE, km, provisional: false };
    const extraKm = Math.ceil(km - BASE_KM);
    return { fee: BASE_FEE + extraKm * PER_KM_RATE, km, provisional: false };
  }

  /* Parses "lat, lng" (or "lat lng") text into {lat, lng}, or null if the
     text isn't a valid pair of coordinates. Accepts the customer's own
     typed edits as well as auto-filled values, since both go through the
     same field. */
  function parseCoordsInput(raw) {
    const m = raw.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!m) return null;
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  }

  function updateCoordsMapLink() {
    const link = document.getElementById("coordsMapLink");
    if (!link) return;
    if (deliveryCoords) {
      link.href = `https://maps.google.com/?q=${deliveryCoords.lat},${deliveryCoords.lng}`;
      link.classList.remove("hidden");
    } else {
      link.classList.add("hidden");
    }
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
    const coordsField = document.getElementById("custCoords");
    if (coordsField) coordsField.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    updateCoordsMapLink();
  }

  function runAutoLocate(btn, labelEl, onDone) {
    if (!("geolocation" in navigator)) {
      showToast(t("toastNoGeolocation"));
      return;
    }
    btn.classList.add("locating");
    btn.classList.remove("success");
    if (labelEl) labelEl.textContent = t("detectingLocation");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const label = await reverseGeocode(latitude, longitude);
        applyDetectedLocation(label, latitude, longitude);
        btn.classList.remove("locating");
        btn.classList.add("success");
        if (labelEl) labelEl.textContent = t("locationDetected");
        showToast(t("toastLocationUpdated", { label: label }));
        if (onDone) onDone(label);
        setTimeout(() => {
          btn.classList.remove("success");
          if (labelEl) labelEl.textContent = t("autoDetectLocation");
        }, 2200);
      },
      (err) => {
        btn.classList.remove("locating");
        if (labelEl) labelEl.textContent = t("autoDetectLocation");
        if (err.code === err.PERMISSION_DENIED) {
          showToast(t("toastLocationDenied"));
        } else {
          showToast(t("toastLocationFailed"));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  const autoLocateBtn = document.getElementById("autoLocateBtn");
  const autoLocateLabel = document.getElementById("autoLocateLabel");
  if (autoLocateBtn) {
    autoLocateBtn.addEventListener("click", () => runAutoLocate(autoLocateBtn, autoLocateLabel));
  }

  const useMyLocationBtn = document.getElementById("useMyLocationBtn");
  if (useMyLocationBtn) {
    useMyLocationBtn.addEventListener("click", () => {
      runAutoLocate(useMyLocationBtn, null, (label) => {
        document.getElementById("custAddress").value = label;
        lastAutoFilledAddress = label;
        addressEditedAfterLocate = false;
        useMyLocationBtn.innerHTML = `<i class="fa-solid fa-check"></i> ${t("locationApplied")}`;
        renderSummaryScreen();
        setTimeout(() => {
          useMyLocationBtn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> <span data-i18n="useMyLocation">${t("useMyLocation")}</span>`;
        }, 2200);
      });
    });
  }

  /* Delivery Coordinates field: locate button fills it from GPS, and the
     customer can freely type/edit it afterward. Editing is picked up at
     send-time (see sendWhatsappBtn handler), but we also sync eagerly on
     blur so the bill preview updates without requiring a submit. */
  const detectCoordsBtn = document.getElementById("detectCoordsBtn");
  const custCoordsInput = document.getElementById("custCoords");
  if (detectCoordsBtn) {
    detectCoordsBtn.addEventListener("click", () => {
      runAutoLocate(detectCoordsBtn, null, () => {
        if (custCoordsInput && deliveryCoords) {
          custCoordsInput.value = `${deliveryCoords.lat.toFixed(6)}, ${deliveryCoords.lng.toFixed(6)}`;
        }
        renderSummaryScreen();
      });
    });
  }
  if (custCoordsInput) {
    custCoordsInput.addEventListener("blur", () => {
      const raw = custCoordsInput.value.trim();
      if (!raw) return;
      const parsed = parseCoordsInput(raw);
      if (!parsed) {
        showToast(t("toastCoordsInvalid"));
        return;
      }
      deliveryCoords = parsed;
      localStorage.setItem("sg_coords", JSON.stringify(deliveryCoords));
      showToast(t("toastCoordsUpdated"));
      renderSummaryScreen();
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
      showToast(t("toastAppAlreadyInstalled"));
      return;
    }
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      showToast(t("toastInstalling"));
    }
    deferredPrompt = null;
    installBanner.classList.add("hidden");
  }

  document.getElementById("installBtn").addEventListener("click", triggerInstall);
  document.getElementById("moreInstallBtn").addEventListener("click", triggerInstall);

  /* ---------------- CUSTOM ENQUIRY SHEET ---------------- */
  const customBackdrop = document.getElementById("customBackdrop");
  const customSheet = document.getElementById("customSheet");

  /* Event type options for the themed occasion picker. Icons are
     FontAwesome classes; labels are resolved through t() so the grid
     re-renders correctly on language change. */
  const OCCASION_OPTIONS = [
    { key: "birthdayParty", icon: "fa-solid fa-cake-candles" },
    { key: "corporateEvent", icon: "fa-solid fa-briefcase" },
    { key: "wedding", icon: "fa-solid fa-rings-wedding" },
    { key: "houseParty", icon: "fa-solid fa-house-user" },
    { key: "otherOccasion", icon: "fa-solid fa-ellipsis" },
  ];
  let customOccasionKey = "birthdayParty";
  let customDateValue = null; // { y, m, d } or null
  let customTimeValue = null; // { hour24, minute } or null
  let datePickerViewYear, datePickerViewMonth;

  document.getElementById("moreCustomBtn").addEventListener("click", () => {
    if (occasionSelectValue) occasionSelectValue.textContent = t(customOccasionKey);
    updateCustomDateTimeLabels();
    customBackdrop.classList.add("open");
    customSheet.classList.add("open");
  });
  function hideCustomSheet() {
    customBackdrop.classList.remove("open");
    customSheet.classList.remove("open");
  }
  customBackdrop.addEventListener("click", hideCustomSheet);
  document.getElementById("closeCustomSheet").addEventListener("click", hideCustomSheet);

  /* ---- Themed Event Type picker (item 8: fits fully in popup, no scroll) ---- */
  const occasionBackdrop = document.getElementById("occasionBackdrop");
  const occasionPickerSheet = document.getElementById("occasionPickerSheet");
  const occasionSelectBtn = document.getElementById("customOccasionSelect");
  const occasionSelectValue = document.getElementById("customOccasionSelectValue");

  function renderOccasionGrid() {
    const grid = document.getElementById("occasionGrid");
    if (!grid) return;
    grid.innerHTML = OCCASION_OPTIONS.map(
      (o) => `
      <button type="button" class="occasion-tile${o.key === customOccasionKey ? " active" : ""}" data-occasion="${o.key}" role="option" aria-selected="${o.key === customOccasionKey}">
        <i class="${o.icon}"></i>
        <span>${t(o.key)}</span>
      </button>`
    ).join("");
    grid.querySelectorAll("[data-occasion]").forEach((btn) => {
      btn.addEventListener("click", () => {
        customOccasionKey = btn.dataset.occasion;
        if (occasionSelectValue) occasionSelectValue.textContent = t(customOccasionKey);
        hideOccasionSheet();
      });
    });
  }
  function showOccasionSheet() {
    renderOccasionGrid();
    occasionBackdrop.classList.add("open");
    occasionPickerSheet.classList.add("open");
  }
  function hideOccasionSheet() {
    occasionBackdrop.classList.remove("open");
    occasionPickerSheet.classList.remove("open");
  }
  if (occasionSelectBtn) occasionSelectBtn.addEventListener("click", showOccasionSheet);
  occasionBackdrop.addEventListener("click", hideOccasionSheet);
  document.getElementById("closeOccasionSheet").addEventListener("click", hideOccasionSheet);

  /* ---- Themed Date picker (item 7: replaces native datetime-local) ---- */
  const dateBackdrop = document.getElementById("dateBackdrop");
  const datePickerSheet = document.getElementById("datePickerSheet");
  const customDateBtn = document.getElementById("customDateBtn");
  const customDateBtnLabel = document.getElementById("customDateBtnLabel");

  function renderDatePickerGrid() {
    const weekdaysEl = document.getElementById("datePickerWeekdays");
    const gridEl = document.getElementById("datePickerGrid");
    const monthLabelEl = document.getElementById("datePickerMonthLabel");
    if (!weekdaysEl || !gridEl || !monthLabelEl) return;

    const weekdayNames = ["S", "M", "T", "W", "T", "F", "S"];
    weekdaysEl.innerHTML = weekdayNames.map((w) => `<span>${w}</span>`).join("");

    const first = new Date(datePickerViewYear, datePickerViewMonth, 1);
    monthLabelEl.textContent = first.toLocaleString(
      currentLang === "en" ? "en-IN" : currentLang,
      { month: "long", year: "numeric" }
    );

    const daysInMonth = new Date(datePickerViewYear, datePickerViewMonth + 1, 0).getDate();
    const startDow = first.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let cells = "";
    for (let i = 0; i < startDow; i++) cells += `<span class="date-cell empty"></span>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(datePickerViewYear, datePickerViewMonth, d);
      const isPast = cellDate < today;
      const isToday = cellDate.getTime() === today.getTime();
      const isActive =
        customDateValue &&
        customDateValue.y === datePickerViewYear &&
        customDateValue.m === datePickerViewMonth &&
        customDateValue.d === d;
      cells += `<button type="button" class="date-cell${isPast ? " disabled" : ""}${isToday ? " today" : ""}${isActive ? " active" : ""}" data-day="${d}">${d}</button>`;
    }
    gridEl.innerHTML = cells;
    gridEl.querySelectorAll("[data-day]").forEach((cell) => {
      cell.addEventListener("click", () => {
        customDateValue = { y: datePickerViewYear, m: datePickerViewMonth, d: parseInt(cell.dataset.day, 10) };
        updateCustomDateTimeLabels();
        hideDateSheet();
      });
    });
  }
  function showDateSheet() {
    const base = customDateValue
      ? new Date(customDateValue.y, customDateValue.m, customDateValue.d)
      : new Date();
    datePickerViewYear = base.getFullYear();
    datePickerViewMonth = base.getMonth();
    renderDatePickerGrid();
    dateBackdrop.classList.add("open");
    datePickerSheet.classList.add("open");
  }
  function hideDateSheet() {
    dateBackdrop.classList.remove("open");
    datePickerSheet.classList.remove("open");
  }
  if (customDateBtn) customDateBtn.addEventListener("click", showDateSheet);
  dateBackdrop.addEventListener("click", hideDateSheet);
  document.getElementById("closeDateSheet").addEventListener("click", hideDateSheet);
  document.getElementById("datePrevMonth").addEventListener("click", () => {
    datePickerViewMonth--;
    if (datePickerViewMonth < 0) {
      datePickerViewMonth = 11;
      datePickerViewYear--;
    }
    renderDatePickerGrid();
  });
  document.getElementById("dateNextMonth").addEventListener("click", () => {
    datePickerViewMonth++;
    if (datePickerViewMonth > 11) {
      datePickerViewMonth = 0;
      datePickerViewYear++;
    }
    renderDatePickerGrid();
  });

  /* ---- Themed Time picker (item 7: scrolling wheels) ---- */
  const timeBackdrop = document.getElementById("timeBackdrop");
  const timePickerSheet = document.getElementById("timePickerSheet");
  const customTimeBtn = document.getElementById("customTimeBtn");
  const customTimeBtnLabel = document.getElementById("customTimeBtnLabel");
  let pendingTime = { hour12: 12, minute: 0, ampm: "PM" };

  function buildWheel(wheelEl, items, activeIndex, onSelect) {
    wheelEl.innerHTML =
      `<div class="time-wheel-pad"></div>` +
      items.map((label, i) => `<div class="time-wheel-item${i === activeIndex ? " active" : ""}" data-index="${i}">${label}</div>`).join("") +
      `<div class="time-wheel-pad"></div>`;
    const itemEls = wheelEl.querySelectorAll(".time-wheel-item");
    const scrollToIndex = (i, smooth) => {
      const el = itemEls[i];
      if (!el) return;
      const top = el.offsetTop - wheelEl.clientHeight / 2 + el.clientHeight / 2;
      if (typeof wheelEl.scrollTo === "function") {
        wheelEl.scrollTo({ top, behavior: smooth ? "smooth" : "instant" });
      } else {
        wheelEl.scrollTop = top;
      }
    };
    scrollToIndex(activeIndex, false);
    itemEls.forEach((el, i) => {
      el.addEventListener("click", () => {
        scrollToIndex(i, true);
        onSelect(i);
      });
    });
    let scrollTimer = null;
    wheelEl.addEventListener("scroll", () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const center = wheelEl.scrollTop + wheelEl.clientHeight / 2;
        let closest = 0;
        let closestDist = Infinity;
        itemEls.forEach((el, i) => {
          const dist = Math.abs(el.offsetTop + el.clientHeight / 2 - center);
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        });
        itemEls.forEach((el, i) => el.classList.toggle("active", i === closest));
        onSelect(closest);
      }, 120);
    });
  }

  function renderTimePickers() {
    const hourWheel = document.getElementById("timeWheelHour");
    const minuteWheel = document.getElementById("timeWheelMinute");
    const ampmWheel = document.getElementById("timeWheelAmpm");
    if (!hourWheel || !minuteWheel || !ampmWheel) return;
    const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
    const ampms = ["AM", "PM"];
    buildWheel(hourWheel, hours, pendingTime.hour12 - 1, (i) => (pendingTime.hour12 = i + 1));
    buildWheel(minuteWheel, minutes, pendingTime.minute, (i) => (pendingTime.minute = i));
    buildWheel(ampmWheel, ampms, pendingTime.ampm === "AM" ? 0 : 1, (i) => (pendingTime.ampm = ampms[i]));
  }
  function showTimeSheet() {
    if (customTimeValue) {
      let h12 = customTimeValue.hour24 % 12;
      if (h12 === 0) h12 = 12;
      pendingTime = { hour12: h12, minute: customTimeValue.minute, ampm: customTimeValue.hour24 < 12 ? "AM" : "PM" };
    }
    timeBackdrop.classList.add("open");
    timePickerSheet.classList.add("open");
    setTimeout(renderTimePickers, 50);
  }
  function hideTimeSheet() {
    timeBackdrop.classList.remove("open");
    timePickerSheet.classList.remove("open");
  }
  if (customTimeBtn) customTimeBtn.addEventListener("click", showTimeSheet);
  timeBackdrop.addEventListener("click", hideTimeSheet);
  document.getElementById("closeTimeSheet").addEventListener("click", hideTimeSheet);
  document.getElementById("timePickerDoneBtn").addEventListener("click", () => {
    let hour24 = pendingTime.hour12 % 12;
    if (pendingTime.ampm === "PM") hour24 += 12;
    customTimeValue = { hour24, minute: pendingTime.minute };
    updateCustomDateTimeLabels();
    hideTimeSheet();
  });

  function updateCustomDateTimeLabels() {
    if (customDateBtnLabel) {
      if (customDateValue) {
        const d = new Date(customDateValue.y, customDateValue.m, customDateValue.d);
        customDateBtnLabel.textContent = d.toLocaleDateString(currentLang === "en" ? "en-IN" : currentLang, { day: "numeric", month: "short", year: "numeric" });
        customDateBtn.classList.add("filled");
      } else {
        customDateBtnLabel.textContent = t("chooseDate");
        customDateBtn.classList.remove("filled");
      }
    }
    if (customTimeBtnLabel) {
      if (customTimeValue) {
        let h12 = customTimeValue.hour24 % 12;
        if (h12 === 0) h12 = 12;
        const ampm = customTimeValue.hour24 < 12 ? "AM" : "PM";
        customTimeBtnLabel.textContent = `${h12}:${String(customTimeValue.minute).padStart(2, "0")} ${ampm}`;
        customTimeBtn.classList.add("filled");
      } else {
        customTimeBtnLabel.textContent = t("chooseTime");
        customTimeBtn.classList.remove("filled");
      }
    }
  }

  document.getElementById("sendCustomEnquiryBtn").addEventListener("click", () => {
    const theme = document.getElementById("customTheme").value.trim();
    const size = document.getElementById("customSize").value.trim();
    const instructions = document.getElementById("customInstructions").value.trim();

    let dateLabel = "";
    if (customDateValue) {
      let d = new Date(customDateValue.y, customDateValue.m, customDateValue.d);
      if (customTimeValue) d.setHours(customTimeValue.hour24, customTimeValue.minute);
      dateLabel = customTimeValue
        ? d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
        : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }

    let msg = "Hello Swader Ghor! I'd like to make a catering enquiry.\n\n";
    msg += "*Event Type:* " + t(customOccasionKey) + "\n";
    if (theme) msg += "*Dishes interested in:* " + theme + "\n";
    if (size) msg += "*Number of people:* " + size + "\n";
    if (dateLabel) msg += "*Preferred date & time:* " + dateLabel + "\n";
    if (instructions) msg += "*Special instructions:* " + instructions + "\n";
    msg += "\n\nPlease let me know if this is possible and the pricing. Thank you!";

    window.open(`https://wa.me/${WHATSAPP_NUMBERS.primary}?text=${encodeURIComponent(msg)}`, "_blank");
    hideCustomSheet();
    showToast(t("toastOpeningWhatsappEnquiry"));
  });

  /* ---------------- LANGUAGE SWITCHER ---------------- */
  /* Looks up `key` in the active language, falling back to English then to
     the key itself so a missing translation never breaks the UI. Supports
     {placeholder} substitution for dynamic strings (toasts, WhatsApp
     messages, etc). This is the single source of truth for every
     user-facing string in the app so switching language updates
     everything (including strings generated at runtime) instantly. */
  function t(key, vars) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    let str = dict[key] || (TRANSLATIONS.en && TRANSLATIONS.en[key]) || key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.split("{" + k + "}").join(vars[k]);
      });
    }
    return str;
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      const val = t(key);
      if (val) el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      const val = t(el.dataset.i18nPh);
      if (val) el.setAttribute("placeholder", val);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const val = t(el.dataset.i18nAria);
      if (val) el.setAttribute("aria-label", val);
    });
    document.documentElement.setAttribute("lang", currentLang);
    /* Re-render any screens/sheets that build their own markup from JS
       (and therefore aren't covered by the data-i18n sweep above), plus
       anything showing a translated value cached in element text. */
    const moreLangVal = document.getElementById("moreLanguageValue");
    if (moreLangVal) {
      const lang = LANGUAGES.find((l) => l.code === currentLang);
      moreLangVal.textContent = lang ? lang.native : currentLang.toUpperCase();
    }
    if (document.getElementById("screen-menu").classList.contains("active")) renderMenuScreen(activeCategory);
    if (document.getElementById("screen-cart").classList.contains("active")) renderCartScreen();
    if (document.getElementById("screen-summary").classList.contains("active")) renderSummaryScreen();
    renderProductGrid();
    injectCheckoutBar();
    if (currentProduct && productSheet.classList.contains("open")) renderProductSheetBody();
    /* Custom catering sheet: occasion value + date/time button labels are
       plain textContent (not data-i18n) since they carry live user state,
       so refresh them explicitly. */
    const occasionValEl = document.getElementById("customOccasionSelectValue");
    if (occasionValEl && typeof customOccasionKey !== "undefined") occasionValEl.textContent = t(customOccasionKey);
    if (typeof updateCustomDateTimeLabels === "function") updateCustomDateTimeLabels();
    if (document.getElementById("occasionPickerSheet") && document.getElementById("occasionPickerSheet").classList.contains("open") && typeof renderOccasionGrid === "function") renderOccasionGrid();
    const versionLabel = document.getElementById("appVersionLabel");
    if (versionLabel && typeof APP_VERSION !== "undefined") {
      versionLabel.textContent = t("appVersionLabel", { version: APP_VERSION });
    }
  }

  function renderLanguageList() {
    const wrap = document.getElementById("languageList");
    if (!wrap || typeof LANGUAGES === "undefined") return;
    wrap.innerHTML = LANGUAGES.map(
      (l) => `
      <button type="button" class="language-option ${l.code === currentLang ? "active" : ""}" data-lang="${l.code}">
        <div class="lang-names">
          <span class="lang-native">${l.native}</span>
          <span class="lang-english">${l.label}</span>
        </div>
        <i class="fa-solid fa-circle-check lang-check"></i>
      </button>`
    ).join("");
    wrap.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentLang = btn.dataset.lang;
        localStorage.setItem("sg_lang", currentLang);
        applyTranslations();
        renderLanguageList();
        hideLanguageSheet();
        showToast(t("toastLanguageUpdated"));
      });
    });
  }

  const languageBackdrop = document.getElementById("languageBackdrop");
  const languageSheet = document.getElementById("languageSheet");
  const openLanguageBtn = document.getElementById("openLanguageSheetMore");
  if (openLanguageBtn) {
    openLanguageBtn.addEventListener("click", () => {
      renderLanguageList();
      languageBackdrop.classList.add("open");
      languageSheet.classList.add("open");
    });
  }
  function hideLanguageSheet() {
    languageBackdrop.classList.remove("open");
    languageSheet.classList.remove("open");
  }
  if (languageBackdrop) languageBackdrop.addEventListener("click", hideLanguageSheet);
  const closeLanguageBtn = document.getElementById("closeLanguageSheet");
  if (closeLanguageBtn) closeLanguageBtn.addEventListener("click", hideLanguageSheet);

  /* ---------------- CUSTOM CONFIRM SHEET (replaces browser confirm()) ---------------- */
  const confirmBackdrop = document.getElementById("confirmBackdrop");
  const confirmSheet = document.getElementById("confirmSheet");
  let confirmResolver = null;

  function showConfirm(opts) {
    const options = opts || {};
    document.getElementById("confirmTitle").textContent = options.title || t("areYouSure");
    document.getElementById("confirmMessage").textContent = options.message || t("cannotBeUndone");
    const okBtn = document.getElementById("confirmOkBtn");
    okBtn.textContent = options.okLabel || t("confirm");
    confirmBackdrop.classList.add("open");
    confirmSheet.classList.add("open");
    return new Promise((resolve) => {
      confirmResolver = resolve;
    });
  }
  function hideConfirmSheet(result) {
    confirmBackdrop.classList.remove("open");
    confirmSheet.classList.remove("open");
    if (confirmResolver) {
      confirmResolver(result);
      confirmResolver = null;
    }
  }
  document.getElementById("confirmOkBtn").addEventListener("click", () => hideConfirmSheet(true));
  document.getElementById("confirmCancelBtn").addEventListener("click", () => hideConfirmSheet(false));
  confirmBackdrop.addEventListener("click", () => hideConfirmSheet(false));

  /* ---------------- UPI PAYMENT SHEET ---------------- */
  const upiBackdrop = document.getElementById("upiBackdrop");
  const upiSheet = document.getElementById("upiSheet");

  function showUpiSheet() {
    const idEl = document.getElementById("upiIdValue");
    const phoneEl = document.getElementById("upiPhoneValue");
    if (idEl && typeof UPI_ID !== "undefined") idEl.textContent = UPI_ID;
    if (phoneEl && typeof PHONE_DISPLAY !== "undefined") phoneEl.textContent = PHONE_DISPLAY;
    upiBackdrop.classList.add("open");
    upiSheet.classList.add("open");
  }
  function hideUpiSheet() {
    upiBackdrop.classList.remove("open");
    upiSheet.classList.remove("open");
  }
  if (upiBackdrop) upiBackdrop.addEventListener("click", hideUpiSheet);
  const closeUpiBtn = document.getElementById("closeUpiSheet");
  if (closeUpiBtn) closeUpiBtn.addEventListener("click", hideUpiSheet);
  const upiDoneBtn = document.getElementById("upiDoneBtn");
  if (upiDoneBtn) upiDoneBtn.addEventListener("click", hideUpiSheet);

  /* Demo QR box: tapping it is a stub for a future real QR (static UPI
     image or dynamically generated code). Kept obviously "Demo" so it's
     easy to spot and swap out later. */
  const upiQrBox = document.getElementById("upiQrBox");
  if (upiQrBox) {
    upiQrBox.addEventListener("click", () => {
      showToast(t("toastDemoQr"));
    });
  }

  async function copyTextToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      /* fall through to legacy method */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      return false;
    }
  }

  function wireCopyButton(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const targetId = btn.dataset.copyTarget;
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;
      const ok = await copyTextToClipboard(targetEl.textContent.trim());
      if (ok) {
        const originalHtml = btn.innerHTML;
        btn.classList.add("copied");
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        showToast(t("toastCopied"));
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.innerHTML = originalHtml;
        }, 1600);
      } else {
        showToast(t("toastCopyFailed"));
      }
    });
  }
  wireCopyButton("copyUpiBtn");
  wireCopyButton("copyPhoneBtn");

  document.getElementById("dismissInstall").addEventListener("click", () => {
    installBanner.classList.add("hidden");
    sessionStorage.setItem("sg_install_dismissed", "1");
  });

  window.addEventListener("appinstalled", () => {
    installBanner.classList.add("hidden");
    showToast(t("toastInstalled"));
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
    toast.innerHTML =
      t("toastNewVersion") +
      ' &middot; <span id="updateReloadBtn" style="text-decoration:underline;cursor:pointer;">' +
      t("toastTapToRefresh") +
      "</span>";
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
    applyTranslations();
    renderCategories();
    renderProductGrid();
    renderOffers();
    renderReviewHighlights();
    updateCartBadges();
    const versionLabel = document.getElementById("appVersionLabel");
    if (versionLabel && typeof APP_VERSION !== "undefined") {
      versionLabel.textContent = "Swader Ghor App \u00B7 Version " + APP_VERSION;
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