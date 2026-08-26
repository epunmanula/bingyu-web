/* ════════════════════════════════════════════════════════════
   BINGYU 冰语 — Frontend Interactions & Shopping Cart Engine
   ════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── CONSTANTS & STATE ─────────────────────────── */
  const FREE_DELIVERY_THRESHOLD = 1500;
  const DEFAULT_DELIVERY_FEE = 250;
  const WHATSAPP_PHONE_NUMBER = "94771234567"; // Bingyu Sri Lanka Order Hotline

  // Promo code definitions
  const PROMO_CODES = {
    BINGYU10: { type: "percent", value: 10, label: "10% Off (BINGYU10)" },
    FREESHIP: { type: "shipping", value: 0, label: "Free Delivery (FREESHIP)" },
    CATLOVER: { type: "flat", value: 100, label: "Rs. 100 Off (CATLOVER)" },
  };

  // State
  let cart = [];
  let appliedPromo = null;
  let activeCustomProduct = null;

  // Load from localStorage
  try {
    const savedCart = localStorage.getItem("bingyu_cart");
    if (savedCart) cart = JSON.parse(savedCart);
    const savedPromo = localStorage.getItem("bingyu_promo");
    if (savedPromo) appliedPromo = JSON.parse(savedPromo);
  } catch (e) {
    console.error("Could not load cart from localStorage", e);
  }

  /* ── DOM ELEMENTS ──────────────────────────────── */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("navBurger");
  const links = document.getElementById("navLinks");
  const yearEl = document.getElementById("year");

  // Badges & Cart Triggers
  const openCartBtn = document.getElementById("openCartBtn");
  const floatingCartBtn = document.getElementById("floatingCartBtn");
  const closeCartBtn = document.getElementById("closeCartBtn");
  const cartOverlay = document.getElementById("cartOverlay");
  const cartDrawer = document.getElementById("cartDrawer");
  const cartBadge = document.getElementById("cartBadge");
  const floatingCartBadge = document.getElementById("floatingCartBadge");
  const cartHeaderCount = document.getElementById("cartHeaderCount");
  const cartItemsContainer = document.getElementById("cartItemsContainer");
  const cartFooter = document.getElementById("cartFooter");

  // Delivery meter & pricing summary
  const freeDeliveryText = document.getElementById("freeDeliveryText");
  const freeDeliveryBar = document.getElementById("freeDeliveryBar");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartDiscountRow = document.getElementById("cartDiscountRow");
  const cartDiscount = document.getElementById("cartDiscount");
  const discountLabel = document.getElementById("discountLabel");
  const cartDelivery = document.getElementById("cartDelivery");
  const cartTotal = document.getElementById("cartTotal");

  // Promo
  const promoInput = document.getElementById("promoInput");
  const applyPromoBtn = document.getElementById("applyPromoBtn");
  const promoAppliedTag = document.getElementById("promoAppliedTag");
  const removePromoBtn = document.getElementById("removePromoBtn");
  const clearCartBtn = document.getElementById("clearCartBtn");
  const proceedCheckoutBtn = document.getElementById("proceedCheckoutBtn");

  // Search & Filter
  const menuSearchInput = document.getElementById("menuSearchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const searchSummary = document.getElementById("searchSummary");
  const filterBtns = document.querySelectorAll(".filter");
  const cards = document.querySelectorAll("#menuGrid .card");

  // Customizer Modal
  const customModalOverlay = document.getElementById("customModalOverlay");
  const customModal = document.getElementById("customModal");
  const closeCustomModalBtn = document.getElementById("closeCustomModalBtn");
  const customModalImg = document.getElementById("customModalImg");
  const customModalCat = document.getElementById("customModalCat");
  const customModalTitle = document.getElementById("customModalTitle");
  const customModalDesc = document.getElementById("customModalDesc");
  const customModalBasePrice = document.getElementById("customModalBasePrice");
  const customModalFinalPrice = document.getElementById("customModalFinalPrice");
  const sugarGroup = document.getElementById("sugarGroup");
  const iceGroup = document.getElementById("iceGroup");
  const customNotes = document.getElementById("customNotes");
  const customQtyVal = document.getElementById("customQtyVal");
  const customQtyDec = document.getElementById("customQtyDec");
  const customQtyInc = document.getElementById("customQtyInc");
  const customAddToCartBtn = document.getElementById("customAddToCartBtn");

  // Checkout Modal
  const checkoutModalOverlay = document.getElementById("checkoutModalOverlay");
  const closeCheckoutModalBtn = document.getElementById("closeCheckoutModalBtn");
  const typeDeliveryLabel = document.getElementById("typeDeliveryLabel");
  const typePickupLabel = document.getElementById("typePickupLabel");
  const pickupStoreGroup = document.getElementById("pickupStoreGroup");
  const deliveryFieldsGroup = document.getElementById("deliveryFieldsGroup");
  const custName = document.getElementById("custName");
  const custPhone = document.getElementById("custPhone");
  const custStore = document.getElementById("custStore");
  const custAddress = document.getElementById("custAddress");
  const custCity = document.getElementById("custCity");
  const custPayment = document.getElementById("custPayment");
  const checkoutItemCount = document.getElementById("checkoutItemCount");
  const checkoutMiniList = document.getElementById("checkoutMiniList");
  const checkoutFinalTotal = document.getElementById("checkoutFinalTotal");
  const orderWhatsAppBtn = document.getElementById("orderWhatsAppBtn");
  const orderDirectBtn = document.getElementById("orderDirectBtn");

  // Receipt Modal
  const receiptModalOverlay = document.getElementById("receiptModalOverlay");
  const closeReceiptModalBtn = document.getElementById("closeReceiptModalBtn");
  const doneReceiptBtn = document.getElementById("doneReceiptBtn");
  const receiptOrderId = document.getElementById("receiptOrderId");
  const receiptCustomerName = document.getElementById("receiptCustomerName");
  const receiptType = document.getElementById("receiptType");
  const receiptDest = document.getElementById("receiptDest");
  const receiptPayment = document.getElementById("receiptPayment");
  const receiptTotalAmount = document.getElementById("receiptTotalAmount");

  // Toast Container
  const toastContainer = document.getElementById("toastContainer");

  let currentModalQty = 1;

  /* ── 1. STICKY NAV & MOBILE MENU ──────────────── */
  const onScroll = () => {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (burger && links) {
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      })
    );
  }

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── 2. TOAST NOTIFICATION HELPER ─────────────── */
  function showToast(message, emoji = "🧋") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>${emoji}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("toast--out");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /* ── 3. SEARCH & CATEGORY FILTERING ───────────── */
  let currentCategory = "all";
  let currentSearchQuery = "";

  function applyMenuFilters() {
    let visibleCount = 0;
    const query = currentSearchQuery.trim().toLowerCase();

    cards.forEach((card) => {
      const cat = card.dataset.cat;
      const name = (card.dataset.name || "").toLowerCase();
      const desc = (card.dataset.desc || "").toLowerCase();

      const matchesCat = currentCategory === "all" || cat === currentCategory;
      const matchesSearch = !query || name.includes(query) || desc.includes(query);

      if (matchesCat && matchesSearch) {
        card.classList.remove("is-hidden");
        visibleCount++;
      } else {
        card.classList.add("is-hidden");
      }
    });

    // Update search summary
    if (searchSummary) {
      if (query) {
        searchSummary.style.display = "block";
        searchSummary.textContent = `Found ${visibleCount} delicious treat${visibleCount === 1 ? "" : "s"} matching "${query}"`;
      } else {
        searchSummary.style.display = "none";
      }
    }

    if (clearSearchBtn) {
      clearSearchBtn.style.display = query ? "flex" : "none";
    }
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentCategory = btn.dataset.filter;
      applyMenuFilters();
    });
  });

  if (menuSearchInput) {
    menuSearchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value;
      applyMenuFilters();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      menuSearchInput.value = "";
      currentSearchQuery = "";
      applyMenuFilters();
      menuSearchInput.focus();
    });
  }

  /* ── 4. CART CALCULATIONS & STORAGE ───────────── */
  function saveCart() {
    try {
      localStorage.setItem("bingyu_cart", JSON.stringify(cart));
      if (appliedPromo) {
        localStorage.setItem("bingyu_promo", JSON.stringify(appliedPromo));
      } else {
        localStorage.removeItem("bingyu_promo");
      }
    } catch (e) {
      console.error(e);
    }
  }

  function getCartSubtotal() {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  }

  function getCartItemCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function updateCartUI() {
    const count = getCartItemCount();
    const subtotal = getCartSubtotal();

    // Update badge numbers
    if (cartBadge) {
      cartBadge.textContent = count;
      cartBadge.classList.add("bump");
      setTimeout(() => cartBadge.classList.remove("bump"), 350);
    }
    if (floatingCartBadge) floatingCartBadge.textContent = count;
    if (cartHeaderCount) cartHeaderCount.textContent = count;

    // Delivery calculation
    let deliveryFee = subtotal > 0 ? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DEFAULT_DELIVERY_FEE) : 0;

    // Promo calculation
    let discountAmount = 0;
    if (appliedPromo && subtotal > 0) {
      if (appliedPromo.type === "percent") {
        discountAmount = Math.round((subtotal * appliedPromo.value) / 100);
      } else if (appliedPromo.type === "flat") {
        discountAmount = Math.min(appliedPromo.value, subtotal);
      } else if (appliedPromo.type === "shipping") {
        deliveryFee = 0;
      }
    }

    const total = Math.max(0, subtotal - discountAmount + deliveryFee);

    // Free delivery progress meter
    if (freeDeliveryText && freeDeliveryBar) {
      if (subtotal >= FREE_DELIVERY_THRESHOLD) {
        freeDeliveryText.innerHTML = `🎉 You unlocked <strong>FREE Colombo Delivery!</strong>`;
        freeDeliveryBar.style.width = "100%";
      } else {
        const remaining = FREE_DELIVERY_THRESHOLD - subtotal;
        const pct = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));
        freeDeliveryText.innerHTML = `Add <strong>Rs. ${remaining}</strong> more for <strong>FREE Colombo Delivery</strong> 🛵`;
        freeDeliveryBar.style.width = `${pct}%`;
      }
    }

    // Price summary rows
    if (cartSubtotal) cartSubtotal.textContent = `Rs. ${subtotal}`;
    if (cartDelivery) cartDelivery.textContent = deliveryFee === 0 ? "FREE" : `Rs. ${deliveryFee}`;
    if (cartTotal) cartTotal.textContent = `Rs. ${total}`;

    if (cartDiscountRow && cartDiscount) {
      if (discountAmount > 0 || (appliedPromo && appliedPromo.type === "shipping")) {
        cartDiscountRow.style.display = "flex";
        discountLabel.textContent = appliedPromo.label;
        cartDiscount.textContent = discountAmount > 0 ? `-Rs. ${discountAmount}` : "Free Delivery";
      } else {
        cartDiscountRow.style.display = "none";
      }
    }

    // Render cart items
    renderCartItems();

    // Promo tag display in footer
    if (promoAppliedTag) {
      if (appliedPromo) {
        promoAppliedTag.style.display = "flex";
        promoAppliedTag.querySelector("span").innerHTML = `🎉 Code <b>${appliedPromo.label}</b> applied!`;
      } else {
        promoAppliedTag.style.display = "none";
      }
    }

    saveCart();
  }

  function renderCartItems() {
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty">
          <svg class="cart-empty__cat"><use href="#cat-head"/></svg>
          <h4>Your bag is feeling light!</h4>
          <p>Treat yourself with creamy boba, cold brews or cloud-soft sundaes.</p>
          <a href="#menu" class="btn btn--red" onclick="document.getElementById('cartDrawer').classList.remove('is-open');document.getElementById('cartOverlay').classList.remove('is-active');">Explore Menu 🧋</a>
        </div>
      `;
      if (cartFooter) cartFooter.style.display = "none";
      return;
    }

    if (cartFooter) cartFooter.style.display = "flex";

    cartItemsContainer.innerHTML = cart
      .map(
        (item, index) => `
      <div class="cart-item" data-index="${index}">
        <img class="cart-item__thumb" src="${item.img}" alt="${item.name}" />
        <div class="cart-item__content">
          <div class="cart-item__top">
            <h4 class="cart-item__name">${item.name}</h4>
            <button type="button" class="cart-item__delete" data-action="delete" data-index="${index}" aria-label="Remove item">✕</button>
          </div>
          <div class="cart-item__customs">
            <span class="cart-item__custom-tag">${item.size}</span>
            ${item.sugar ? `<span class="cart-item__custom-tag">${item.sugar}</span>` : ""}
            ${item.ice ? `<span class="cart-item__custom-tag">${item.ice}</span>` : ""}
            ${
              item.toppings && item.toppings.length > 0
                ? item.toppings.map((t) => `<span class="cart-item__custom-tag">+${t}</span>`).join("")
                : ""
            }
            ${item.notes ? `<div style="font-style:italic;color:#8A5A33;margin-top:2px;">"${item.notes}"</div>` : ""}
          </div>
          <div class="cart-item__bottom">
            <span class="cart-item__price">Rs. ${item.unitPrice * item.qty}</span>
            <div class="cart-item__qty">
              <button type="button" class="qty-mini-btn" data-action="dec" data-index="${index}">−</button>
              <span class="qty-mini-val">${item.qty}</span>
              <button type="button" class="qty-mini-btn" data-action="inc" data-index="${index}">+</button>
            </div>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  // Cart item events (increment, decrement, delete)
  if (cartItemsContainer) {
    cartItemsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const index = parseInt(btn.dataset.index, 10);
      const action = btn.dataset.action;

      if (action === "inc") {
        cart[index].qty++;
      } else if (action === "dec") {
        if (cart[index].qty > 1) {
          cart[index].qty--;
        } else {
          cart.splice(index, 1);
          showToast("Item removed from bag", "🗑️");
        }
      } else if (action === "delete") {
        cart.splice(index, 1);
        showToast("Item removed from bag", "🗑️");
      }
      updateCartUI();
    });
  }

  /* ── 5. PROMO CODE APPLICATION ────────────────── */
  if (applyPromoBtn && promoInput) {
    applyPromoBtn.addEventListener("click", () => {
      const code = promoInput.value.trim().toUpperCase();
      if (!code) return;

      if (PROMO_CODES[code]) {
        appliedPromo = PROMO_CODES[code];
        promoInput.value = "";
        updateCartUI();
        showToast(`Promo "${code}" applied successfully! 🎉`, "✨");
      } else {
        showToast("Invalid promo code. Try BINGYU10 or CATLOVER!", "⚠️");
      }
    });

    promoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyPromoBtn.click();
      }
    });
  }

  if (removePromoBtn) {
    removePromoBtn.addEventListener("click", () => {
      appliedPromo = null;
      updateCartUI();
      showToast("Promo code removed", "ℹ️");
    });
  }

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear your bag?")) {
        cart = [];
        appliedPromo = null;
        updateCartUI();
        showToast("Bag cleared", "🧹");
      }
    });
  }

  /* ── 6. DRAWER CONTROLS ───────────────────────── */
  function openCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.add("is-open");
      cartOverlay.classList.add("is-active");
      cartDrawer.setAttribute("aria-hidden", "false");
      cartOverlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }
  }

  function closeCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.remove("is-open");
      cartOverlay.classList.remove("is-active");
      cartDrawer.setAttribute("aria-hidden", "true");
      cartOverlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    }
  }

  if (openCartBtn) openCartBtn.addEventListener("click", openCart);
  if (floatingCartBtn) floatingCartBtn.addEventListener("click", openCart);
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

  /* ── 7. PRODUCT CUSTOMIZER MODAL ──────────────── */
  function openCustomizer(product) {
    activeCustomProduct = product;
    currentModalQty = 1;

    if (customModalImg) customModalImg.src = product.img;
    if (customModalCat) customModalCat.textContent = product.cat.toUpperCase();
    if (customModalTitle) customModalTitle.textContent = product.name;
    if (customModalDesc) customModalDesc.textContent = product.desc;
    if (customModalBasePrice) customModalBasePrice.textContent = `Rs. ${product.price}`;
    if (customQtyVal) customQtyVal.textContent = "1";
    if (customNotes) customNotes.value = "";

    // Show/hide drink-specific controls (sugar and ice)
    const isDrink = product.type === "drink";
    if (sugarGroup) sugarGroup.style.display = isDrink ? "flex" : "none";
    if (iceGroup) iceGroup.style.display = isDrink ? "flex" : "none";

    // Reset size radio
    const sizeRadios = document.querySelectorAll('input[name="customSize"]');
    sizeRadios.forEach((r, idx) => (r.checked = idx === 0));

    // Reset sugar radio
    const sugarRadios = document.querySelectorAll('input[name="customSugar"]');
    sugarRadios.forEach((r, idx) => (r.checked = idx === 0));

    // Reset ice radio
    const iceRadios = document.querySelectorAll('input[name="customIce"]');
    iceRadios.forEach((r, idx) => (r.checked = idx === 0));

    // Reset toppings
    const toppingChecks = document.querySelectorAll('input[name="customToppings"]');
    toppingChecks.forEach((c) => (c.checked = false));

    recalcCustomizerPrice();

    if (customModalOverlay) {
      customModalOverlay.classList.add("is-active");
      customModalOverlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }
  }

  function closeCustomizer() {
    if (customModalOverlay) {
      customModalOverlay.classList.remove("is-active");
      customModalOverlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    }
  }

  function recalcCustomizerPrice() {
    if (!activeCustomProduct) return;

    let base = parseInt(activeCustomProduct.price, 10) || 0;

    // Size addition
    const checkedSize = document.querySelector('input[name="customSize"]:checked');
    const sizeExtra = checkedSize ? parseInt(checkedSize.dataset.price, 10) || 0 : 0;

    // Toppings addition
    let toppingsExtra = 0;
    const checkedToppings = document.querySelectorAll('input[name="customToppings"]:checked');
    checkedToppings.forEach((top) => {
      toppingsExtra += parseInt(top.dataset.price, 10) || 0;
    });

    const unitPrice = base + sizeExtra + toppingsExtra;
    const finalPrice = unitPrice * currentModalQty;

    if (customModalFinalPrice) {
      customModalFinalPrice.textContent = `Rs. ${finalPrice}`;
    }

    return { unitPrice, finalPrice };
  }

  // Listen to option changes in modal
  if (customModal) {
    customModal.addEventListener("change", recalcCustomizerPrice);
  }

  if (customQtyInc) {
    customQtyInc.addEventListener("click", () => {
      currentModalQty++;
      if (customQtyVal) customQtyVal.textContent = currentModalQty;
      recalcCustomizerPrice();
    });
  }

  if (customQtyDec) {
    customQtyDec.addEventListener("click", () => {
      if (currentModalQty > 1) {
        currentModalQty--;
        if (customQtyVal) customQtyVal.textContent = currentModalQty;
        recalcCustomizerPrice();
      }
    });
  }

  if (closeCustomModalBtn) closeCustomModalBtn.addEventListener("click", closeCustomizer);
  if (customModalOverlay) {
    customModalOverlay.addEventListener("click", (e) => {
      if (e.target === customModalOverlay) closeCustomizer();
    });
  }

  // Add customized item to cart
  if (customAddToCartBtn) {
    customAddToCartBtn.addEventListener("click", () => {
      if (!activeCustomProduct) return;

      const checkedSize = document.querySelector('input[name="customSize"]:checked');
      const sizeVal = checkedSize ? checkedSize.value : "Regular";
      const sizePrice = checkedSize ? parseInt(checkedSize.dataset.price, 10) || 0 : 0;

      const isDrink = activeCustomProduct.type === "drink";
      const checkedSugar = isDrink ? document.querySelector('input[name="customSugar"]:checked') : null;
      const sugarVal = checkedSugar ? checkedSugar.value : "";

      const checkedIce = isDrink ? document.querySelector('input[name="customIce"]:checked') : null;
      const iceVal = checkedIce ? checkedIce.value : "";

      const selectedToppings = [];
      let toppingsExtra = 0;
      const checkedToppings = document.querySelectorAll('input[name="customToppings"]:checked');
      checkedToppings.forEach((top) => {
        selectedToppings.push(top.value);
        toppingsExtra += parseInt(top.dataset.price, 10) || 0;
      });

      const noteVal = customNotes ? customNotes.value.trim() : "";
      const base = parseInt(activeCustomProduct.price, 10) || 0;
      const unitPrice = base + sizePrice + toppingsExtra;

      // Unique hash for identical item grouping
      const itemConfigId = `${activeCustomProduct.id}_${sizeVal}_${sugarVal}_${iceVal}_${selectedToppings.sort().join("-")}_${noteVal}`;

      const existingIndex = cart.findIndex((item) => item.configId === itemConfigId);
      if (existingIndex > -1) {
        cart[existingIndex].qty += currentModalQty;
      } else {
        cart.push({
          configId: itemConfigId,
          id: activeCustomProduct.id,
          name: activeCustomProduct.name,
          img: activeCustomProduct.img,
          cat: activeCustomProduct.cat,
          size: sizeVal,
          sugar: sugarVal,
          ice: iceVal,
          toppings: selectedToppings,
          notes: noteVal,
          unitPrice: unitPrice,
          qty: currentModalQty,
        });
      }

      updateCartUI();
      closeCustomizer();
      showToast(`Added ${currentModalQty}x ${activeCustomProduct.name} to Bag!`, "🧋");
    });
  }

  /* ── 8. CARD BUTTON ACTIONS (CUSTOMIZE & QUICK ADD) ───────────── */
  cards.forEach((card) => {
    const product = {
      id: card.dataset.id,
      name: card.dataset.name,
      price: card.dataset.price,
      cat: card.dataset.cat,
      img: card.dataset.img,
      desc: card.dataset.desc,
      type: card.dataset.type || "drink",
    };

    // Customize button and card image click
    const customizeBtn = card.querySelector(".btn-customize");
    if (customizeBtn) {
      customizeBtn.addEventListener("click", () => openCustomizer(product));
    }

    const cardMedia = card.querySelector(".card__media");
    if (cardMedia) {
      cardMedia.addEventListener("click", () => openCustomizer(product));
    }

    // Quick add 1x with defaults
    const quickAddBtn = card.querySelector(".btn-quick-add");
    if (quickAddBtn) {
      quickAddBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        const base = parseInt(product.price, 10);
        const itemConfigId = `${product.id}_Regular_100%_Regular Ice__`;

        const existingIndex = cart.findIndex((item) => item.configId === itemConfigId);
        if (existingIndex > -1) {
          cart[existingIndex].qty++;
        } else {
          cart.push({
            configId: itemConfigId,
            id: product.id,
            name: product.name,
            img: product.img,
            cat: product.cat,
            size: "Regular",
            sugar: product.type === "drink" ? "100%" : "",
            ice: product.type === "drink" ? "Regular Ice" : "",
            toppings: [],
            notes: "",
            unitPrice: base,
            qty: 1,
          });
        }

        updateCartUI();
        showToast(`Added 1x ${product.name} to Bag! 🧋`, "✨");
      });
    }
  });

  /* ── 9. CHECKOUT MODAL & ORDERING ─────────────── */
  function openCheckoutModal() {
    if (cart.length === 0) {
      showToast("Your bag is empty! Add treats first.", "⚠️");
      return;
    }
    closeCart();

    const subtotal = getCartSubtotal();
    let deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DEFAULT_DELIVERY_FEE;
    let discountAmount = 0;
    if (appliedPromo) {
      if (appliedPromo.type === "percent") discountAmount = Math.round((subtotal * appliedPromo.value) / 100);
      else if (appliedPromo.type === "flat") discountAmount = Math.min(appliedPromo.value, subtotal);
      else if (appliedPromo.type === "shipping") deliveryFee = 0;
    }
    const total = Math.max(0, subtotal - discountAmount + deliveryFee);

    if (checkoutItemCount) checkoutItemCount.textContent = `${getCartItemCount()} items`;
    if (checkoutFinalTotal) checkoutFinalTotal.textContent = `Rs. ${total}`;

    // Render mini list in checkout
    if (checkoutMiniList) {
      checkoutMiniList.innerHTML = cart
        .map(
          (item) => `
        <div style="display:flex;justify-content:space-between;">
          <span>${item.qty}x ${item.name} (${item.size})</span>
          <b>Rs. ${item.unitPrice * item.qty}</b>
        </div>
      `
        )
        .join("");
    }

    if (checkoutModalOverlay) {
      checkoutModalOverlay.classList.add("is-active");
      checkoutModalOverlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }
  }

  function closeCheckoutModal() {
    if (checkoutModalOverlay) {
      checkoutModalOverlay.classList.remove("is-active");
      checkoutModalOverlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    }
  }

  if (proceedCheckoutBtn) proceedCheckoutBtn.addEventListener("click", openCheckoutModal);
  if (closeCheckoutModalBtn) closeCheckoutModalBtn.addEventListener("click", closeCheckoutModal);
  if (checkoutModalOverlay) {
    checkoutModalOverlay.addEventListener("click", (e) => {
      if (e.target === checkoutModalOverlay) closeCheckoutModal();
    });
  }

  // Delivery vs Pickup toggle
  const orderTypeRadios = document.querySelectorAll('input[name="orderType"]');
  orderTypeRadios.forEach((r) => {
    r.addEventListener("change", () => {
      const isDelivery = r.value === "delivery";
      if (typeDeliveryLabel) typeDeliveryLabel.classList.toggle("is-active", isDelivery);
      if (typePickupLabel) typePickupLabel.classList.toggle("is-active", !isDelivery);

      if (pickupStoreGroup) pickupStoreGroup.style.display = isDelivery ? "none" : "block";
      if (deliveryFieldsGroup) deliveryFieldsGroup.style.display = isDelivery ? "block" : "none";
    });
  });

  // Validate form details
  function getOrderData() {
    const name = custName ? custName.value.trim() : "";
    const phone = custPhone ? custPhone.value.trim() : "";
    const isDelivery = document.querySelector('input[name="orderType"]:checked').value === "delivery";
    const store = custStore ? custStore.value : "Nugegoda Flagship";
    const address = custAddress ? custAddress.value.trim() : "";
    const city = custCity ? custCity.value.trim() : "";
    const payment = custPayment ? custPayment.value : "Cash";

    if (!name) {
      showToast("Please enter your Name", "⚠️");
      custName.focus();
      return null;
    }
    if (!phone) {
      showToast("Please enter your Phone Number", "⚠️");
      custPhone.focus();
      return null;
    }
    if (isDelivery && !address) {
      showToast("Please enter your Delivery Address", "⚠️");
      custAddress.focus();
      return null;
    }

    const subtotal = getCartSubtotal();
    let deliveryFee = isDelivery ? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DEFAULT_DELIVERY_FEE) : 0;
    let discountAmount = 0;
    if (appliedPromo) {
      if (appliedPromo.type === "percent") discountAmount = Math.round((subtotal * appliedPromo.value) / 100);
      else if (appliedPromo.type === "flat") discountAmount = Math.min(appliedPromo.value, subtotal);
      else if (appliedPromo.type === "shipping") deliveryFee = 0;
    }
    const total = Math.max(0, subtotal - discountAmount + deliveryFee);

    return {
      name,
      phone,
      isDelivery,
      store,
      address,
      city,
      payment,
      subtotal,
      deliveryFee,
      discountAmount,
      total,
      items: [...cart],
    };
  }

  // 1. Order via WhatsApp
  if (orderWhatsAppBtn) {
    orderWhatsAppBtn.addEventListener("click", () => {
      const order = getOrderData();
      if (!order) return;

      let msg = `🧋 *NEW ORDER — BINGYU LK* 🐱\n`;
      msg += `━━━━━━━━━━━━━━━━━━━\n`;
      msg += `👤 *Customer:* ${order.name}\n`;
      msg += `📞 *Phone:* ${order.phone}\n`;
      msg += `📦 *Type:* ${order.isDelivery ? "🛵 Delivery" : "🛍️ Store Pickup"}\n`;
      if (order.isDelivery) {
        msg += `📍 *Address:* ${order.address}${order.city ? `, ${order.city}` : ""}\n`;
      } else {
        msg += `🏬 *Branch:* ${order.store}\n`;
      }
      msg += `💳 *Payment:* ${order.payment}\n\n`;

      msg += `🛒 *ORDER ITEMS:*\n`;
      order.items.forEach((item, i) => {
        msg += `${i + 1}. *${item.name}* (x${item.qty}) - Rs. ${item.unitPrice * item.qty}\n`;
        msg += `   • Size: ${item.size}\n`;
        if (item.sugar) msg += `   • Sweetness: ${item.sugar}\n`;
        if (item.ice) msg += `   • Ice: ${item.ice}\n`;
        if (item.toppings && item.toppings.length) msg += `   • Toppings: ${item.toppings.join(", ")}\n`;
        if (item.notes) msg += `   • Note: "${item.notes}"\n`;
      });

      msg += `\n━━━━━━━━━━━━━━━━━━━\n`;
      msg += `💰 *Subtotal:* Rs. ${order.subtotal}\n`;
      if (order.discountAmount > 0) msg += `🎉 *Discount:* -Rs. ${order.discountAmount}\n`;
      msg += `🚚 *Delivery Fee:* ${order.deliveryFee === 0 ? "FREE" : `Rs. ${order.deliveryFee}`}\n`;
      msg += `✨ *Total Payable:* *Rs. ${order.total}*\n`;
      msg += `━━━━━━━━━━━━━━━━━━━\n`;
      msg += `✨ _Sent via bingyu-web online shop_`;

      const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(msg)}`;
      window.open(whatsappUrl, "_blank");

      closeCheckoutModal();
      showReceiptModal(order);
    });
  }

  // 2. Direct Order Confirmation
  if (orderDirectBtn) {
    orderDirectBtn.addEventListener("click", () => {
      const order = getOrderData();
      if (!order) return;

      closeCheckoutModal();
      showReceiptModal(order);
    });
  }

  /* ── 10. RECEIPT MODAL ────────────────────────── */
  function showReceiptModal(order) {
    const randomOrderId = `#BY-${Math.floor(10000 + Math.random() * 90000)}`;

    if (receiptOrderId) receiptOrderId.textContent = randomOrderId;
    if (receiptCustomerName) receiptCustomerName.textContent = order.name;
    if (receiptType) receiptType.textContent = order.isDelivery ? "🛵 Delivery" : "🛍️ Pickup";
    if (receiptDest) {
      receiptDest.textContent = order.isDelivery
        ? `${order.address}${order.city ? `, ${order.city}` : ""}`
        : order.store;
    }
    if (receiptPayment) receiptPayment.textContent = order.payment;
    if (receiptTotalAmount) receiptTotalAmount.textContent = `Rs. ${order.total}`;

    // Clear cart
    cart = [];
    appliedPromo = null;
    updateCartUI();

    if (receiptModalOverlay) {
      receiptModalOverlay.classList.add("is-active");
      receiptModalOverlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }
  }

  function closeReceiptModal() {
    if (receiptModalOverlay) {
      receiptModalOverlay.classList.remove("is-active");
      receiptModalOverlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    }
  }

  if (closeReceiptModalBtn) closeReceiptModalBtn.addEventListener("click", closeReceiptModal);
  if (doneReceiptBtn) doneReceiptBtn.addEventListener("click", closeReceiptModal);
  if (receiptModalOverlay) {
    receiptModalOverlay.addEventListener("click", (e) => {
      if (e.target === receiptModalOverlay) closeReceiptModal();
    });
  }

  /* ── 11. SCROLL REVEAL OBSERVER ───────────────── */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            entry.target.style.transitionDelay = `${Math.min(i * 60, 240)}ms`;
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  // Initial cart update on page load
  updateCartUI();
})();
