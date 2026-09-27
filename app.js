// ========================================
// EL PATRÓN DE LAS OFERTAS
// APP.JS - FIREBASE
// ========================================

import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  increment
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// ========================================
// CONFIGURACIÓN
// ========================================

const MERCADO_LIBRE_AFILIADO =
  "https://meli.la/1mj3itE";

const WHATSAPP_CHANNEL =
  "https://whatsapp.com/channel/0029Vb7W8ijKrWQpUEGkJe1x";

const MERCADO_PAGO_LINK =
  "https://mpago.li/1VU1UaW";

const MERCADO_PAGO_LOGO =
  "./IMG_1100.png";

const HERO_TITLE =
  `Encuentra la oferta.<br><strong>Activa el ahorro.</strong>`;

const HERO_TEXT =
  "Cupones, ofertas y descuentos antes de que se agoten.";

let generalSettings = {
  whatsapp: WHATSAPP_CHANNEL,
  generalMercadoLibre:
    "https://www.mercadolibre.com.mx/"
};

let offers = [];
let coupons = [];
let categories = [];
let banks = [];

// ========================================
// UTILIDADES
// ========================================

function money(value) {

  return Number(value || 0).toLocaleString(
    "es-MX",
    {
      style: "currency",
      currency: "MXN"
    }
  );

}

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

function safeUrl(value) {

  const url =
    String(value || "").trim();

  return (
    url ||
    "https://www.mercadolibre.com.mx/"
  );

}

// ========================================
// FECHA DE MÉXICO
// ========================================

function getMexicoDate() {

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(new Date());

}

// ========================================
// VISITANTE ÚNICO
// ========================================

function getVisitorId() {

  const storageKey =
    "elp_patron_visitor_id";

  try {

    let visitorId =
      localStorage.getItem(
        storageKey
      );

    if (!visitorId) {

      visitorId =
        crypto.randomUUID();

      localStorage.setItem(
        storageKey,
        visitorId
      );

    }

    return visitorId;

  } catch (error) {

    return "visitor-" +
      Math.random()
        .toString(36)
        .substring(2);
  }

}

// ========================================
// PRIMERA VISTA
// ========================================

function setupHero() {

  const hero =
    document.querySelector(".hero");

  if (!hero) return;

  const title =
    hero.querySelector("h1");

  const paragraph =
    hero.querySelector("p");

  if (title) {

    title.innerHTML =
      HERO_TITLE;

  }

  if (paragraph) {

    paragraph.textContent =
      HERO_TEXT;

  }

  if (!hero.querySelector(".hero-cta")) {

    const button =
      document.createElement("a");

    button.href =
      "#offers";

    button.className =
      "hero-cta";

    button.textContent =
      "🔥 VER OFERTAS";

    hero.appendChild(
      button
    );

  }

}

// ========================================
// CONFIGURACIÓN FIREBASE
// ========================================

async function loadSettings() {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "settings",
          "general"
        )
      );

    if (snapshot.exists()) {

      const data =
        snapshot.data();

      generalSettings = {

        whatsapp:
          data.whatsapp ||
          WHATSAPP_CHANNEL,

        generalMercadoLibre:
          data.generalMercadoLibre ||
          "https://www.mercadolibre.com.mx/"
      };

    }

    setupWhatsApp();

  } catch (error) {

    console.warn(
      "No se pudo cargar configuración:",
      error
    );

    setupWhatsApp();

  }

}

// ========================================
// ESTADÍSTICAS DIARIAS
// ========================================

async function registerVisit() {

  try {

    const today =
      getMexicoDate();

    const dailyRef =
      doc(
        db,
        "statistics",
        `daily_${today}`
      );

    const visitorId =
      getVisitorId();

    let isUniqueToday = false;

    try {

      const uniqueKey =
        `elp_patron_unique_${today}`;

      const alreadyVisited =
        localStorage.getItem(
          uniqueKey
        );

      if (!alreadyVisited) {

        localStorage.setItem(
          uniqueKey,
          visitorId
        );

        isUniqueToday = true;

      }

    } catch (error) {

      isUniqueToday = false;

    }

    const dailyData = {

      visits:
        increment(1),

      date:
        today,

      updatedAt:
        new Date().toISOString()

    };

    if (isUniqueToday) {

      dailyData.users =
        increment(1);

      dailyData.uniqueVisitors =
        increment(1);

    }

    await setDoc(
      dailyRef,
      dailyData,
      {
        merge: true
      }
    );

    // ====================================
    // ESTADÍSTICAS GENERALES
    // ====================================

    const generalData = {

      visits:
        increment(1)

    };

    if (isUniqueToday) {

      generalData.uniqueVisitors =
        increment(1);

    }

    await setDoc(
      doc(
        db,
        "statistics",
        "general"
      ),
      generalData,
      {
        merge: true
      }
    );

  } catch (error) {

    console.warn(
      "No se pudo registrar visita:",
      error
    );

  }

}

// ========================================
// REGISTRAR CLIC DIARIO
// ========================================

async function registerDailyClick() {

  try {

    const today =
      getMexicoDate();

    await setDoc(
      doc(
        db,
        "statistics",
        `daily_${today}`
      ),
      {
        clicks:
          increment(1),

        date:
          today,

        updatedAt:
          new Date().toISOString()
      },
      {
        merge: true
      }
    );

  } catch (error) {

    console.warn(
      "No se pudo registrar clic diario:",
      error
    );

  }

}

// ========================================
// REGISTRAR COPIA DIARIA
// ========================================

async function registerDailyCopy(
  savings = 0
) {

  try {

    const today =
      getMexicoDate();

    await setDoc(
      doc(
        db,
        "statistics",
        `daily_${today}`
      ),
      {
        copies:
          increment(1),

        savings:
          increment(
            Number(savings || 0)
          ),

        date:
          today,

        updatedAt:
          new Date().toISOString()
      },
      {
        merge: true
      }
    );

  } catch (error) {

    console.warn(
      "No se pudo registrar copia diaria:",
      error
    );

  }

}

// ========================================
// REGISTRAR PROMOCIÓN DIARIA
// ========================================

async function registerDailyPromotion() {

  try {

    const today =
      getMexicoDate();

    await setDoc(
      doc(
        db,
        "statistics",
        `daily_${today}`
      ),
      {
        promotions:
          increment(1),

        date:
          today,

        updatedAt:
          new Date().toISOString()
      },
      {
        merge: true
      }
    );

  } catch (error) {

    console.warn(
      "No se pudo registrar promoción diaria:",
      error
    );

  }

}

// ========================================
// CATEGORÍAS
// ========================================

async function loadCategories() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "categories"
        )
      );

    categories =
      snapshot.docs
        .map(item => ({
          id: item.id,
          ...item.data()
        }))
        .filter(
          item =>
            item.active !== false
        );

    renderCategories();

  } catch (error) {

    console.error(
      "Error cargando categorías:",
      error
    );

  }

}

function renderCategories() {

  const container =
    document.getElementById(
      "categories"
    );

  if (!container) return;

  container.innerHTML =
    categories
      .map(
        category => `

        <button
          type="button"
          class="category-item"
          data-category="${escapeHTML(
            category.name || ""
          )}"
        >

          <span class="category-emoji">
            ${escapeHTML(
              category.emoji || "📂"
            )}
          </span>

          <strong>
            ${escapeHTML(
              category.name || ""
            )}
          </strong>

        </button>

      `
      )
      .join("");

  container
    .querySelectorAll(
      "[data-category]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          container
            .querySelectorAll(
              ".category-item"
            )
            .forEach(item => {

              item.classList.remove(
                "active"
              );

            });

          button.classList.add(
            "active"
          );

          filterOffersByCategory(
            button.dataset.category
          );

        }
      );

    });

  enableHorizontalDrag(
    container
  );

}

// ========================================
// OFERTAS
// ========================================

async function loadOffers() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "offers"
        )
      );

    offers =
      snapshot.docs
        .map(item => ({
          id: item.id,
          ...item.data()
        }))
        .filter(
          item =>
            item.active !== false
        );

    renderOffers(
      offers
    );

  } catch (error) {

    console.error(
      "Error cargando ofertas:",
      error
    );

  }

}

function renderOffers(list) {

  const container =
    document.getElementById(
      "offers"
    );

  if (!container) return;

  if (!list.length) {

    container.innerHTML = `
      <div class="empty-state">
        😕 No hay ofertas disponibles.
      </div>
    `;

    return;

  }

  container.innerHTML =
    list
      .map(offer => {

        const oldPrice =
          Number(
            offer.oldPrice || 0
          );

        const price =
          Number(
            offer.price || 0
          );

        let discount = 0;

        if (
          oldPrice > 0 &&
          price > 0 &&
          oldPrice > price
        ) {

          discount =
            Math.round(
              (
                (oldPrice - price) /
                oldPrice
              ) * 100
            );

        }

        const image =
          String(
            offer.image || ""
          ).trim();

        return `

          <article
            class="offer-card"
            data-offer-id="${escapeHTML(
              offer.id
            )}"
          >

            <div
              class="offer-image-wrapper"
            >

              ${
                image
                  ? `
                    <img
                      class="offer-image"
                      src="${escapeHTML(
                        image
                      )}"
                      alt="${escapeHTML(
                        offer.name ||
                        "Oferta"
                      )}"
                      loading="lazy"
                      onerror="
                        this.style.display='none';
                        this.parentElement.classList.add(
                          'image-error'
                        );
                      "
                    >
                  `
                  : `
                    <div class="offer-no-image">
                      🖼️
                    </div>
                  `
              }

              ${
                discount > 0
                  ? `
                    <span class="offer-discount">
                      -${discount}%
                    </span>
                  `
                  : ""
              }

            </div>

            <div class="offer-content">

              <div class="offer-category">

                ${
                  offer.category
                    ? escapeHTML(
                        offer.category
                      )
                    : "🔥 OFERTA"
                }

              </div>

              <h3 class="offer-name">

                ${escapeHTML(
                  offer.name ||
                  "Oferta"
                )}

              </h3>

              ${
                oldPrice > 0
                  ? `
                    <div class="offer-old-price">
                      ${money(oldPrice)}
                    </div>
                  `
                  : ""
              }

              <div class="offer-price">

                ${money(price)}

              </div>

              <button
                type="button"
                class="offer-button"
                data-offer-link="${escapeHTML(
                  offer.link || ""
                )}"
              >

                🛒 VER OFERTA

              </button>

            </div>

          </article>

        `;

      })
      .join("");

  // ========================================
  // CLICK EN TARJETA
  // ========================================

  container
    .querySelectorAll(
      ".offer-card"
    )
    .forEach(card => {

      card.addEventListener(
        "click",
        event => {

          if (
            event.target.closest(
              ".offer-button"
            )
          ) {

            return;

          }

          const id =
            card.dataset.offerId;

          const offer =
            offers.find(
              item =>
                item.id === id
            );

          if (!offer) return;

          registerOfferClick(
            id
          );

          openMercadoLibre(
            offer
          );

        }
      );

    });

  // ========================================
  // BOTÓN VER OFERTA
  // ========================================

  container
    .querySelectorAll(
      "[data-offer-link]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          const card =
            button.closest(
              ".offer-card"
            );

          const id =
            card?.dataset.offerId;

          const link =
            button.dataset.offerLink;

          if (id) {

            registerOfferClick(
              id
            );

          }

          if (link) {

            openMercadoLibre(
              link
            );

          }

        }
      );

    });

  setupOfferCarousel(
    container
  );

}

function filterOffersByCategory(
  categoryName
) {

  const filtered =
    offers.filter(
      offer =>
        String(
          offer.category || ""
        ).toLowerCase() ===
        String(
          categoryName || ""
        ).toLowerCase()
    );

  renderOffers(
    filtered.length
      ? filtered
      : offers
  );

}

async function registerOfferClick(
  offerId
) {

  try {

    await updateDoc(
      doc(
        db,
        "offers",
        offerId
      ),
      {
        clicks:
          increment(1)
      }
    );

    await setDoc(
      doc(
        db,
        "statistics",
        "general"
      ),
      {
        clicks:
          increment(1)
      },
      {
        merge: true
      }
    );

    registerDailyClick();

  } catch (error) {

    console.warn(
      "No se pudo registrar clic:",
      error
    );

  }

}

// ========================================
// MERCADO LIBRE
// ========================================

function openMercadoLibre(
  destination
) {

  let url = "";

  if (
    destination &&
    typeof destination ===
      "object"
  ) {

    url =
      destination.link ||
      destination.url ||
      "";

  } else if (
    typeof destination ===
      "string"
  ) {

    url =
      destination;

  }

  if (!url) {

    url =
      MERCADO_LIBRE_AFILIADO;

  }

  const cleanUrl =
    safeUrl(url);

  if (!cleanUrl) return;

  window.location.href =
    cleanUrl;

}

// ========================================
// MERCADO PAGO
// ========================================

async function loadMercadoPago() {

  const container =
    document.getElementById(
      "mercadopago"
    );

  if (!container) return;

  container.innerHTML = `

    <a
      href="${MERCADO_PAGO_LINK}"
      class="mp-promo"
      target="_blank"
      rel="noopener"
      aria-label="Obtener promoción de Mercado Pago"
    >

      <span class="mp-shine"></span>

      <span class="mp-orbit mp-orbit-one"></span>

      <span class="mp-orbit mp-orbit-two"></span>

      <div class="mp-logo-animation">

        <img
          src="${MERCADO_PAGO_LOGO}"
          alt="Mercado Pago"
          class="mp-logo-image"
          loading="lazy"
          onerror="
            this.style.display='none';
            this.nextElementSibling.style.display='flex';
          "
        >

        <div
          class="mp-logo-circle"
          style="display:none;"
        >

          <span>
            MP
          </span>

        </div>

      </div>

      <div class="mp-promo-content">

        <div class="mp-promo-badge">
          💳 MERCADO PAGO
        </div>

        <h2>
          $100 GRATIS
        </h2>

        <h3>
          En tu primera compra
        </h3>

        <div class="mp-promo-button">

          OBTENER $100

          <span>
            →
          </span>

        </div>

      </div>

    </a>

  `;

  const link =
    container.querySelector(
      ".mp-promo"
    );

  if (link) {

    link.addEventListener(
      "click",
      () => {

        setDoc(
          doc(
            db,
            "statistics",
            "general"
          ),
          {
            promotions:
              increment(1)
          },
          {
            merge: true
          }
        ).catch(() => {});

        registerDailyPromotion();

      }
    );

  }

}

// ========================================
// BANCOS / TIENDAS
// ========================================

async function loadBanks() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "banks"
        )
      );

    banks =
      snapshot.docs.map(
        item => {

          const data =
            item.data();

          console.log(
            "🏦 BANCO CARGADO:",
            item.id,
            data
          );

          return {
            id: item.id,
            ...data
          };

        }
      );

    console.log(
      "🏦 TODOS LOS BANCOS:",
      banks
    );

  } catch (error) {

    console.error(
      "❌ Error cargando bancos:",
      error
    );

    banks = [];

  }

}

// ========================================
// CUPONES
// ========================================

async function loadCoupons() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "coupons"
        )
      );

    coupons =
      snapshot.docs
        .map(item => ({
          id: item.id,
          ...item.data()
        }))
        .filter(
          item =>
            item.active !== false
        );

    renderCouponSections();

  } catch (error) {

    console.error(
      "Error cargando cupones:",
      error
    );

  }

}

const couponSections = [

  {
    id: "relampago",
    title:
      "⚡ Cupones Relámpago"
  },

  {
    id: "exclusivos",
    title:
      "🔥 Exclusivos + Tiendas"
  },

  {
    id: "bancarios",
    title:
      "💳 Cupones Bancarios"
  },

  {
    id: "todos",
    title:
      "🎟️ Todos los cupones"
  }

];

function renderCouponSections() {

  const container =
    document.getElementById(
      "couponSections"
    );

  if (!container) return;

  container.innerHTML =
    couponSections
      .map(section => {

        const sectionCoupons =
          section.id === "todos"
            ? coupons
            : coupons.filter(
                coupon =>
                  String(
                    coupon.section ||
                    ""
                  ).toLowerCase() ===
                  section.id
              );

        if (
          !sectionCoupons.length
        ) {

          return "";

        }

        return `

          <section
            class="coupon-section"
          >

            <div
              class="coupon-section-title"
            >

              <h3>
                ${section.title}
              </h3>

            </div>

            <div
              class="coupon-slider"
              data-coupon-slider="${section.id}"
            >

              ${
                sectionCoupons
                  .map(
                    renderCouponCard
                  )
                  .join("")
              }

            </div>

          </section>

        `;

      })
      .join("");

  // ========================================
  // COPIAR CUPÓN
  // ========================================

  container
    .querySelectorAll(
      "[data-copy-coupon]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          copyCoupon(
            button.dataset.copyCoupon
          );

        }
      );

    });

  // ========================================
  // VER OFERTA
  // ========================================

  container
    .querySelectorAll(
      "[data-view-offer]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          const coupon =
            coupons.find(
              item =>
                item.id ===
                button.dataset.viewOffer
            );

          if (coupon) {

            openMercadoLibre(
              coupon
            );

          }

        }
      );

    });

  enableCouponSliders();

}

// ========================================
// TARJETA CUPÓN
// ========================================

function renderCouponCard(
  coupon
) {

  const rawStatus =
    String(
      coupon.status ||
      "active"
    ).toLowerCase();

  let statusClass =
    "active";

  let statusText =
    "🟢 ACTIVO";

  if (
    rawStatus === "soon" ||
    rawStatus === "por_agotarse" ||
    rawStatus === "por agotarse"
  ) {

    statusClass =
      "warning";

    statusText =
      "🟠 POR AGOTARSE";

  }

  if (
    rawStatus === "soldout" ||
    rawStatus === "agotado"
  ) {

    statusClass =
      "expired";

    statusText =
      "🔴 AGOTADO";

  }

  const code =
    String(
      coupon.code || ""
    )
      .toUpperCase()
      .trim();

  const hiddenCode =
    code.length > 4
      ? code.substring(0, 4) +
        "*".repeat(
          Math.min(
            5,
            Math.max(
              1,
              code.length - 4
            )
          )
        )
      : "*****";

  const isSoldOut =
    statusClass ===
    "expired";

  // =====================================
  // BANCO
  // =====================================

  const bank =
    banks.find(
      item =>
        String(item.id) ===
        String(
          coupon.bankId || ""
        )
    );

  const bankName =
    bank?.name ||
    "";

  const bankLogo =
    bank?.logo
      ? String(
          bank.logo
        ).trim()
      : "";

  return `

    <article
      class="coupon-card ${statusClass}"
      data-coupon-id="${escapeHTML(
        coupon.id
      )}"
    >

      <div class="coupon-status">
        ${statusText}
      </div>

      ${
        bankName
          ? `
            <div class="coupon-name">

              ${
                bankLogo
                  ? `
                    <img
                      src="${escapeHTML(
                        bankLogo
                      )}"
                      alt="${escapeHTML(
                        bankName
                      )}"
                      class="coupon-bank-logo"
                      loading="lazy"
                    >
                  `
                  : `
                    <span class="coupon-bank-icon">
                      🏦
                    </span>
                  `
              }

              <span>
                ${escapeHTML(
                  bankName
                )}
              </span>

            </div>
          `
          : ""
      }

      <div class="coupon-discount">

        ${escapeHTML(
          coupon.discount ||
          "DESCUENTO"
        )}

      </div>

      <div class="coupon-code">

        ${hiddenCode}

      </div>

      ${
        coupon.minimumPurchase
          ? `
            <div class="coupon-info">

              🛒 Compra mínima:

              <strong>
                ${money(
                  coupon.minimumPurchase
                )}
              </strong>

            </div>
          `
          : ""
      }

      ${
        coupon.maximumDiscount
          ? `
            <div class="coupon-info">

              💰 Descuento máximo:

              <strong>
                ${money(
                  coupon.maximumDiscount
                )}
              </strong>

            </div>
          `
          : ""
      }

      ${
        isSoldOut
          ? `
            <button
              type="button"
              class="coupon-copy view-offer-button"
              data-view-offer="${escapeHTML(
                coupon.id
              )}"
            >

              👀 VER OFERTA

            </button>
          `
          : `
            <button
              type="button"
              class="coupon-copy"
              data-copy-coupon="${escapeHTML(
                coupon.id
              )}"
            >

              📋 COPIAR CUPÓN

            </button>
          `
      }

      <small class="coupon-copies">

        📋
        ${Number(
          coupon.copies || 0
        )}
        copias

      </small>

    </article>

  `;

}

// ========================================
// COPIAR CUPÓN
// ========================================

function copyCoupon(
  couponId
) {

  const coupon =
    coupons.find(
      item =>
        item.id ===
        couponId
    );

  if (!coupon) return;

  const code =
    String(
      coupon.code || ""
    )
      .toUpperCase()
      .trim();

  if (!code) {

    openMercadoLibre(
      coupon
    );

    return;

  }

  let copied = false;

  try {

    if (
      navigator.clipboard &&
      typeof navigator
        .clipboard
        .writeText ===
        "function"
    ) {

      navigator.clipboard
        .writeText(code);

      copied = true;

    }

  } catch (error) {

    console.warn(
      "Clipboard:",
      error
    );

  }

  if (!copied) {

    copied =
      copyWithExecCommand(
        code
      );

  }

  registerCouponCopy(
    couponId
  );

  showCopySuccess();

  openMercadoLibre(
    coupon
  );

}

// ========================================
// COPIA ALTERNATIVA
// ========================================

function copyWithExecCommand(
  text
) {

  try {

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      text;

    textarea.setAttribute(
      "readonly",
      ""
    );

    textarea.style.position =
      "fixed";

    textarea.style.left =
      "-9999px";

    textarea.style.top =
      "0";

    textarea.style.opacity =
      "0";

    document.body.appendChild(
      textarea
    );

    textarea.focus();

    textarea.select();

    textarea.setSelectionRange(
      0,
      textarea.value.length
    );

    const successful =
      document.execCommand(
        "copy"
      );

    textarea.remove();

    return successful;

  } catch (error) {

    console.warn(
      "No se pudo usar copia alternativa:",
      error
    );

    return false;

  }

}

// ========================================
// COPIA MANUAL
// ========================================

function showManualCopy(
  code
) {

  const message =
    document.getElementById(
      "copySuccessMessage"
    ) ||
    document.createElement(
      "div"
    );

  message.id =
    "copySuccessMessage";

  message.className =
    "copy-success-message show";

  message.innerHTML = `

    <strong>

      📋 Cupón:
      ${escapeHTML(code)}

    </strong>

    <small>
      Cópialo manualmente
    </small>

  `;

  if (
    !message.parentElement
  ) {

    document.body.appendChild(
      message
    );

  }

}

// ========================================
// REGISTRAR COPIA
// ========================================

function registerCouponCopy(
  couponId
) {

  const coupon =
    coupons.find(
      item =>
        item.id ===
        couponId
    );

  // =====================================
  // AHORRO
  // =====================================

  const savings =
    Number(
      coupon?.maximumDiscount ||
      0
    );

  // =====================================
  // ACTUALIZAR CUPÓN
  // =====================================

  updateDoc(
    doc(
      db,
      "coupons",
      couponId
    ),
    {
      copies:
        increment(1)
    }
  ).catch(error => {

    console.warn(
      "No se pudo actualizar contador del cupón:",
      error
    );

  });

  // =====================================
  // ESTADÍSTICAS GENERALES
  // =====================================

  setDoc(
    doc(
      db,
      "statistics",
      "general"
    ),
    {
      copies:
        increment(1),

      savings:
        increment(savings)

    },
    {
      merge: true
    }
  ).catch(error => {

    console.warn(
      "No se pudo actualizar estadísticas:",
      error
    );

  });

  // =====================================
  // ESTADÍSTICAS DIARIAS
  // =====================================

  registerDailyCopy(
    savings
  );

  // =====================================
  // ACTUALIZAR CONTADOR VISUAL
  // =====================================

  if (coupon) {

    coupon.copies =
      Number(
        coupon.copies || 0
      ) + 1;

  }

}

// ========================================
// MENSAJE COPIADO
// ========================================

function showCopySuccess() {

  let message =
    document.getElementById(
      "copySuccessMessage"
    );

  if (!message) {

    message =
      document.createElement(
        "div"
      );

    message.id =
      "copySuccessMessage";

    message.className =
      "copy-success-message";

    document.body.appendChild(
      message
    );

  }

  message.innerHTML = `

    <strong>
      ✅ ¡Cupón copiado!
    </strong>

    <small>
      Abriendo Mercado Libre...
    </small>

  `;

  message.classList.add(
    "show"
  );

  setTimeout(
    () => {

      message.classList.remove(
        "show"
      );

    },
    1800
  );

}

// ========================================
// WHATSAPP
// ========================================

function setupWhatsApp() {

  const url =
    WHATSAPP_CHANNEL;

  const header =
    document.getElementById(
      "whatsappHeader"
    );

  const floating =
    document.getElementById(
      "whatsappFloat"
    );

  [
    header,
    floating
  ].forEach(element => {

    if (!element) return;

    element.href =
      url;

    element.target =
      "_blank";

    element.rel =
      "noopener";

  });

}

// ========================================
// ARRASTRE HORIZONTAL
// ========================================

function enableHorizontalDrag(
  container
) {

  if (
    !container ||
    container.dataset
      .dragReady ===
      "true"
  ) {

    return;

  }

  let isDown =
    false;

  let startX =
    0;

  let scrollLeft =
    0;

  container.addEventListener(
    "pointerdown",
    event => {

      isDown =
        true;

      startX =
        event.clientX;

      scrollLeft =
        container.scrollLeft;

      try {

        container.setPointerCapture(
          event.pointerId
        );

      } catch (error) {}

    }
  );

  container.addEventListener(
    "pointermove",
    event => {

      if (!isDown) return;

      const distance =
        event.clientX -
        startX;

      container.scrollLeft =
        scrollLeft -
        distance;

    }
  );

  const stop = () => {

    isDown =
      false;

  };

  container.addEventListener(
    "pointerup",
    stop
  );

  container.addEventListener(
    "pointercancel",
    stop
  );

  container.addEventListener(
    "pointerleave",
    stop
  );

  container.dataset
    .dragReady =
    "true";

}

function enableCouponSliders() {

  document
    .querySelectorAll(
      ".coupon-slider"
    )
    .forEach(
      slider => {

        enableHorizontalDrag(
          slider
        );

      }
    );

}

// ========================================
// CARRUSEL OFERTAS
// ========================================

function setupOfferCarousel(
  container
) {

  if (!container) return;

  const updatePadding =
    () => {

      const card =
        container.querySelector(
          ".offer-card"
        );

      if (!card) return;

      const cardWidth =
        card
          .getBoundingClientRect()
          .width;

      const sideSpace =
        Math.max(
          0,
          (
            container.clientWidth -
            cardWidth
          ) / 2
        );

      container.style.paddingLeft =
        `${sideSpace}px`;

      container.style.paddingRight =
        `${sideSpace}px`;

    };

  updatePadding();

  if (
    container.dataset
      .resizeReady !==
    "true"
  ) {

    window.addEventListener(
      "resize",
      updatePadding
    );

    container.dataset
      .resizeReady =
      "true";

  }

  enableHorizontalDrag(
    container
  );

}

// ========================================
// INICIAR
// ========================================

async function initializeApp() {

  setupHero();

  setupWhatsApp();

  try {

    await Promise.all([

      loadSettings(),

      registerVisit(),

      loadCategories(),

      loadOffers(),

      loadMercadoPago()

    ]);

    // ====================================
    // PRIMERO BANCOS
    // ====================================

    await loadBanks();

    // ====================================
    // DESPUÉS CUPONES
    // ====================================

    await loadCoupons();

  } catch (error) {

    console.error(
      "Error iniciando página:",
      error
    );

  }

}

initializeApp();