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


/* =====================================
   CONFIGURACIÓN
===================================== */

const MERCADO_LIBRE_AFILIADO =
  "https://meli.la/1mj3itE";

const WHATSAPP_CHANNEL =
  "https://whatsapp.com/channel/0029Vb7W8ijKrWQpUEGkJe1x";

let generalSettings = {
  whatsapp: WHATSAPP_CHANNEL,
  generalMercadoLibre:
    "https://www.mercadolibre.com.mx/"
};

let offers = [];
let coupons = [];
let categories = [];


/* =====================================
   UTILIDADES
===================================== */

function money(value) {

  const number =
    Number(value || 0);

  return number.toLocaleString(
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


/* =====================================
   CONFIGURACIÓN
===================================== */

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

    console.error(
      "Error cargando configuración:",
      error
    );

    setupWhatsApp();

  }

}


/* =====================================
   VISITAS
===================================== */

async function registerVisit() {

  try {

    await setDoc(
      doc(
        db,
        "statistics",
        "general"
      ),
      {
        visits: increment(1)
      },
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


/* =====================================
   CATEGORÍAS
===================================== */

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
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
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


  if (!categories.length) {

    container.innerHTML = "";

    return;

  }


  container.innerHTML =
    categories
      .map(category => `

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

      `)
      .join("");


  container
    .querySelectorAll(
      "[data-category]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const category =
            button.dataset.category;


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
            category
          );

        }
      );

    });


  enableHorizontalDrag(
    container
  );

}


/* =====================================
   OFERTAS
===================================== */

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
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
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


/* =====================================
   RENDER OFERTAS
===================================== */

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
    list.map(offer => {

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

          <div class="offer-image-wrapper">

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
                      this.parentElement
                        .classList.add('image-error');
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
                    ${money(
                      oldPrice
                    )}
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

    }).join("");


  /* =====================================
     CLIC EN TARJETA
  ===================================== */

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


  /* =====================================
     BOTÓN OFERTA
  ===================================== */

  container
    .querySelectorAll(
      "[data-offer-link]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const link =
            button.dataset.offerLink;


          const card =
            button.closest(
              ".offer-card"
            );


          const id =
            card?.dataset.offerId;


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


  enableOfferAutoScroll();

}


/* =====================================
   FILTRAR OFERTAS
===================================== */

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
    filtered
  );

}


/* =====================================
   CLICS OFERTAS
===================================== */

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
        clicks: increment(1)
      }
    );


    await setDoc(
      doc(
        db,
        "statistics",
        "general"
      ),
      {
        clicks: increment(1)
      },
      {
        merge: true
      }
    );

  } catch (error) {

    console.warn(
      "No se pudo registrar clic:",
      error
    );

  }

}


/* =====================================
   MERCADO LIBRE
===================================== */

function openMercadoLibre(
  couponOrLink
) {

  let destination =
    MERCADO_LIBRE_AFILIADO;


  if (
    typeof couponOrLink ===
      "object" &&
    couponOrLink
  ) {

    const section =
      String(
        couponOrLink.section || ""
      ).toLowerCase();


    if (
      section === "relampago" ||
      section === "bancarios"
    ) {

      destination =
        MERCADO_LIBRE_AFILIADO;

    } else {

      destination =
        couponOrLink.link ||
        generalSettings.generalMercadoLibre ||
        MERCADO_LIBRE_AFILIADO;

    }

  } else if (
    couponOrLink
  ) {

    destination =
      couponOrLink;

  }


  const cleanUrl =
    String(
      destination
    ).trim();


  if (!cleanUrl) return;


  window.location.href =
    cleanUrl;

}


/* =====================================
   MERCADO PAGO
===================================== */

async function loadMercadoPago() {

  const container =
    document.getElementById(
      "mercadopago"
    );

  if (!container) return;


  const mercadoPagoLink =
    "https://mpago.li/1VU1UaW";


  container.innerHTML = `

    <a
      href="${mercadoPagoLink}"
      target="_blank"
      rel="noopener"
      class="mp-promo"
    >

      <div class="mp-logo-animation">

        <div class="mp-logo-circle">
          <span>MP</span>
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
          OBTENER $100 →
        </div>

      </div>

    </a>

  `;

}


/* =====================================
   CUPONES
===================================== */

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
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );


    renderCouponSections();

  } catch (error) {

    console.error(
      "Error cargando cupones:",
      error
    );

  }

}


/* =====================================
   SECCIONES CUPONES
===================================== */

function renderCouponSections() {

  const container =
    document.getElementById(
      "couponSections"
    );

  if (!container) return;


  const sections = [

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


  container.innerHTML =
    sections.map(
      section => {

        const sectionCoupons =
          section.id === "todos"
            ? coupons
            : coupons.filter(
                coupon =>
                  String(
                    coupon.section || ""
                  ).toLowerCase() ===
                  section.id
              );


        if (!sectionCoupons.length) {
          return "";
        }


        return `

          <section class="coupon-section">

            <div class="coupon-section-title">

              <h3>
                ${section.title}
              </h3>

            </div>


            <div
              class="coupon-slider"
              data-coupon-slider="${section.id}"
            >

              ${sectionCoupons
                .map(
                  coupon =>
                    renderCouponCard(
                      coupon
                    )
                )
                .join("")}

            </div>

          </section>

        `;

      }
    ).join("");


  /* =====================================
     BOTONES COPIAR
  ===================================== */

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


  /* =====================================
     BOTONES VER OFERTA
  ===================================== */

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


          if (!coupon) return;


          openMercadoLibre(
            coupon
          );

        }
      );

    });


  enableCouponSliders();

}


/* =====================================
   TARJETA CUPÓN
===================================== */

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
    ).toUpperCase();


  const hiddenCode =
    code.length > 4
      ? code.substring(
          0,
          4
        ) +
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
        coupon.name
          ? `
            <div class="coupon-name">
              🏦 ${escapeHTML(
                coupon.name
              )}
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
        📋 ${
          Number(
            coupon.copies || 0
          )
        } copias
      </small>

    </article>

  `;

}


/* =====================================
   COPIAR CUPÓN
===================================== */

async function copyCoupon(
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
    ).toUpperCase().trim();


  if (!code) {

    alert(
      "Este cupón no tiene código."
    );

    return;

  }


  /* =========================
     PRIMERO COPIAMOS
  ========================= */

  try {

    await copyToClipboard(
      code
    );

  } catch (error) {

    console.error(
      "Error real copiando cupón:",
      error
    );

    alert(
      "No se pudo copiar el cupón. Intenta nuevamente."
    );

    return;

  }


  /* =========================
     COPIA CORRECTA
  ========================= */

  showCopySuccess();


  /* =========================
     ABRIR MERCADO LIBRE
  ========================= */

  setTimeout(
    () => {

      openMercadoLibre(
        coupon
      );

    },
    1000
  );


  /* =========================
     CONTADOR CUPÓN
     NO BLOQUEA LA COPIA
  ========================= */

  try {

    await updateDoc(
      doc(
        db,
        "coupons",
        couponId
      ),
      {
        copies: increment(1)
      }
    );

  } catch (error) {

    console.warn(
      "No se pudo actualizar contador del cupón:",
      error
    );

  }


  /* =========================
     ESTADÍSTICAS
  ========================= */

  try {

    await setDoc(
      doc(
        db,
        "statistics",
        "general"
      ),
      {
        copies: increment(1)
      },
      {
        merge: true
      }
    );

  } catch (error) {

    console.warn(
      "No se pudo actualizar estadísticas:",
      error
    );

  }


  coupon.copies =
    Number(
      coupon.copies || 0
    ) + 1;

}


/* =====================================
   PORTAPAPELES
===================================== */

async function copyToClipboard(
  text
) {

  const code =
    String(
      text || ""
    ).trim();


  if (!code) {

    throw new Error(
      "Cupón vacío"
    );

  }


  /* =========================
     MÉTODO MODERNO
  ========================= */

  try {

    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText ===
        "function"
    ) {

      await navigator.clipboard.writeText(
        code
      );

      return true;

    }

  } catch (error) {

    console.warn(
      "Clipboard API bloqueada:",
      error
    );

  }


  /* =========================
     MÉTODO ALTERNATIVO
  ========================= */

  try {

    const textarea =
      document.createElement(
        "textarea"
      );


    textarea.value =
      code;


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


    document.body.removeChild(
      textarea
    );


    if (successful) {

      return true;

    }

  } catch (error) {

    console.error(
      "Error con método alternativo:",
      error
    );

  }


  throw new Error(
    "No se pudo copiar el cupón"
  );

}


/* =====================================
   MENSAJE COPIADO
===================================== */

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
    2500
  );

}


/* =====================================
   WHATSAPP
===================================== */

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


  if (header) {

    header.href =
      url;

    header.target =
      "_blank";

    header.rel =
      "noopener";

  }


  if (floating) {

    floating.href =
      url;

    floating.target =
      "_blank";

    floating.rel =
      "noopener";

  }

}


/* =====================================
   DRAG HORIZONTAL
===================================== */

function enableHorizontalDrag(
  container
) {

  if (!container) return;


  let isDown = false;

  let startX = 0;

  let scrollLeft = 0;


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

}


/* =====================================
   CARRUSEL CUPONES
===================================== */

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


/* =====================================
   CARRUSEL OFERTAS
===================================== */

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
        card.getBoundingClientRect()
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
    !container.dataset
      .resizeReady
  ) {

    window.addEventListener(
      "resize",
      updatePadding
    );


    container.dataset.resizeReady =
      "true";

  }


  enableHorizontalDrag(
    container
  );

}


/* =====================================
   AUTO SCROLL OFERTAS
===================================== */

function enableOfferAutoScroll() {

  const container =
    document.getElementById(
      "offers"
    );


  if (!container) return;


  clearInterval(
    window.__offerAutoScroll
  );


  let index = 0;


  window.__offerAutoScroll =
    setInterval(
      () => {

        const cards =
          Array.from(
            container.querySelectorAll(
              ".offer-card"
            )
          );


        if (
          cards.length <= 1
        ) {

          return;

        }


        index =
          (
            index + 1
          ) %
          cards.length;


        cards[index].scrollIntoView(
          {
            behavior:
              "smooth",

            block:
              "nearest",

            inline:
              "center"
          }
        );

      },
      3500
    );

}


/* =====================================
   INICIAR
===================================== */

async function initializeApp() {

  try {

    await Promise.all([

      loadSettings(),

      registerVisit(),

      loadCategories(),

      loadOffers(),

      loadMercadoPago(),

      loadCoupons()

    ]);

  } catch (error) {

    console.error(
      "Error iniciando página:",
      error
    );

  }

}


initializeApp();