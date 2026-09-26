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


let generalSettings = {
  whatsapp: "",
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
   CONFIGURACIÓN GENERAL
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


    if (
      snapshot.exists()
    ) {

      const data =
        snapshot.data();


      generalSettings = {
        whatsapp:
          data.whatsapp || "",

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

    console.error(
      "Error registrando visita:",
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
        (item) => ({
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
    categories.map(
      (category) => `

      <button
        type="button"
        class="category-item"
        data-category="${escapeHTML(
          category.name || ""
        )}"
      >

        <span>
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
    ).join("");


  container
    .querySelectorAll(
      "[data-category]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const category =
              button.dataset.category;

            filterOffersByCategory(
              category
            );

          }
        );

      }
    );


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
        (item) => ({
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

function renderOffers(
  list
) {

  const container =
    document.getElementById(
      "offers"
    );

  if (!container) return;


  if (!list.length) {

    container.innerHTML =
      `
      <div class="empty-state">
        😕 No hay ofertas disponibles.
      </div>
      `;

    return;

  }


  container.innerHTML =
    list.map(
      (offer) => {

        const oldPrice =
          Number(
            offer.oldPrice || 0
          );


        const price =
          Number(
            offer.price || 0
          );


        let discount = "";


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
                  src="${image}"
                  alt="${escapeHTML(
                    offer.name || "Oferta"
                  )}"
                  loading="lazy"
                  onerror="this.style.display='none';"
                >
                `
                : `
                <div class="offer-no-image">
                  🖼️
                </div>
                `
            }

            ${
              discount
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
                offer.name || "Oferta"
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

      }
    ).join("");


  /* =====================================
     CLIC EN TODA LA TARJETA
  ===================================== */

  container
    .querySelectorAll(
      ".offer-card"
    )
    .forEach(
      (card) => {

        card.addEventListener(
          "click",
          (event) => {

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
                (item) =>
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

      }
    );


  /* =====================================
     BOTÓN DE OFERTA
  ===================================== */

  container
    .querySelectorAll(
      "[data-offer-link]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          (event) => {

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

      }
    );


  /*
    Preparar carrusel
  */

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
      (offer) =>
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
   CLICS DE OFERTAS
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

  } catch (error) {

    console.error(
      "Error registrando clic:",
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


  /*
    Si es un objeto:
    oferta o cupón
  */

  if (
    typeof couponOrLink ===
      "object" &&
    couponOrLink
  ) {

    const section =
      String(
        couponOrLink.section || ""
      ).toLowerCase();


    /*
      Relámpago y Bancarios
      usan SIEMPRE el afiliado.
    */

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

  }

  /*
    Si es directamente un link
  */

  else if (
    couponOrLink
  ) {

    destination =
      couponOrLink;

  }


  const cleanUrl =
    String(
      destination
    ).trim();


  if (!cleanUrl) {

    return;

  }


  /*
    Navegación normal.
    Si el teléfono tiene configurado
    Mercado Libre como app para enlaces
    compatibles, el sistema puede abrir
    automáticamente la aplicación.
  */

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


  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "promotions",
          "mercadopago"
        )
      );


    if (
      !snapshot.exists()
    ) {

      container.innerHTML = "";

      return;

    }


    const data =
      snapshot.data();


    container.innerHTML =
      `

      <div class="mp-content">

        ${
          data.image
            ? `
            <img
              src="${data.image}"
              alt="Mercado Pago"
              class="mp-image"
              loading="lazy"
            >
            `
            : ""
        }


        <div class="mp-info">

          <h2>
            ${escapeHTML(
              data.title ||
              "$100 GRATIS para usuarios nuevos de Mercado Pago"
            )}
          </h2>

          <p>
            ${escapeHTML(
              data.text || ""
            )}
          </p>


          ${
            data.link
              ? `
              <a
                href="${escapeHTML(
                  data.link
                )}"
                target="_blank"
                rel="noopener"
                class="mp-button"
              >
                💳 VER PROMOCIÓN
              </a>
              `
              : ""
          }

        </div>

      </div>

      `;


  } catch (error) {

    console.error(
      "Error cargando Mercado Pago:",
      error
    );

  }

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
        (item) => ({
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
   SECCIONES DE CUPONES
===================================== */

function renderCouponSections() {

  const container =
    document.getElementById(
      "couponSections"
    );

  if (!container) return;


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


  container.innerHTML =
    couponSections.map(
      (section) => {

        const sectionCoupons =
          section.id === "todos"
            ? coupons
            : coupons.filter(
                (coupon) =>
                  coupon.section ===
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

          <div class="coupon-section-header">

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
                (coupon) =>
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


  /*
    Copiar cupón
  */

  container
    .querySelectorAll(
      "[data-copy-coupon]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            copyCoupon(
              button.dataset.copyCoupon
            );

          }
        );

      }
    );


  /*
    Ver oferta de cupón agotado
  */

  container
    .querySelectorAll(
      "[data-view-offer]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset.viewOffer;


            const coupon =
              coupons.find(
                (item) =>
                  item.id === id
              );


            if (!coupon) return;


            openMercadoLibre(
              coupon
            );

          }
        );

      }
    );


  enableCouponSliders();

}


/* =====================================
   TARJETA DEL CUPÓN
===================================== */

function renderCouponCard(
  coupon
) {

  const status =
    String(
      coupon.status ||
      "active"
    ).toLowerCase();


  let statusClass =
    "active";


  let statusText =
    "🟢 ACTIVO";


  if (
    status === "soon" ||
    status === "por_agotarse"
  ) {

    statusClass =
      "soon";

    statusText =
      "🟠 POR AGOTARSE";

  }


  if (
    status === "soldout" ||
    status === "agotado"
  ) {

    statusClass =
      "soldout";

    statusText =
      "🔴 AGOTADO";

  }


  const code =
    String(
      coupon.code || ""
    ).toUpperCase();


  /*
    Código oculto.
    Ejemplo:

    SANTANDER10
    SANT*****
  */

  const hiddenCode =
    code.length > 5
      ? code.substring(0, 4) +
        "*".repeat(
          Math.min(
            5,
            code.length - 4
          )
        )
      : "*****";


  const isSoldOut =
    status === "soldout" ||
    status === "agotado";


  return `

    <article
      class="coupon-card ${statusClass}"
      data-coupon-id="${escapeHTML(
        coupon.id
      )}"
    >

      <span
        class="coupon-status ${statusClass}"
      >
        ${statusText}
      </span>


      <div class="coupon-top">

        <span class="coupon-fire">
          🔥
        </span>

        <strong>
          ${escapeHTML(
            coupon.discount ||
            "DESCUENTO"
          )}
        </strong>

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


      <div class="coupon-code-hidden">
        ${hiddenCode}
      </div>


      ${
        coupon.minimumPurchase
          ? `
          <p>
            Compra mínima:
            <strong>
              ${money(
                coupon.minimumPurchase
              )}
            </strong>
          </p>
          `
          : ""
      }


      ${
        coupon.maximumDiscount
          ? `
          <p>
            Descuento máximo:
            <strong>
              ${money(
                coupon.maximumDiscount
              )}
            </strong>
          </p>
          `
          : ""
      }


      ${
        isSoldOut
          ? `
          <button
            type="button"
            class="view-offer-button"
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
            class="copy-coupon"
            data-copy-coupon="${escapeHTML(
              coupon.id
            )}"
          >
            📋 COPIAR CUPÓN
          </button>
          `
      }


      <small class="coupon-copies">
        📋 ${Number(
          coupon.copies || 0
        )} copias
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
      (item) =>
        item.id === couponId
    );


  if (!coupon) return;


  const code =
    String(
      coupon.code || ""
    ).toUpperCase();


  if (!code) return;


  try {

    await copyToClipboard(
      code
    );


    /*
      Incrementar copias
    */

    await updateDoc(
      doc(
        db,
        "coupons",
        couponId
      ),
      {
        copies:
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
        copies:
          increment(1)
      },
      {
        merge: true
      }
    );


    coupon.copies =
      Number(
        coupon.copies || 0
      ) + 1;


    /*
      Mensaje de éxito
    */

    showCopySuccess();


    /*
      Esperar aproximadamente
      1 segundo antes de abrir ML
    */

    setTimeout(
      () => {

        openMercadoLibre(
          coupon
        );

      },
      1000
    );


  } catch (error) {

    console.error(
      "Error copiando cupón:",
      error
    );


    alert(
      "No se pudo copiar el cupón."
    );

  }

}


/* =====================================
   PORTAPAPELES
===================================== */

async function copyToClipboard(
  text
) {

  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {

    await navigator.clipboard.writeText(
      text
    );

    return;

  }


  const textarea =
    document.createElement(
      "textarea"
    );


  textarea.value =
    text;


  textarea.style.position =
    "fixed";

  textarea.style.opacity =
    "0";


  document.body.appendChild(
    textarea
  );


  textarea.select();


  const successful =
    document.execCommand(
      "copy"
    );


  textarea.remove();


  if (!successful) {

    throw new Error(
      "No se pudo copiar"
    );

  }

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


  message.innerHTML =
    `
    ✅ ¡Cupón copiado!
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

  const whatsapp =
    String(
      generalSettings.whatsapp ||
      ""
    ).trim();


  const header =
    document.getElementById(
      "whatsappHeader"
    );


  const floating =
    document.getElementById(
      "whatsappFloat"
    );


  /*
    Si no hay número,
    mantener los enlaces actuales
    sin romper la página.
  */

  if (!whatsapp) return;


  const cleanNumber =
    whatsapp.replace(
      /\D/g,
      ""
    );


  if (!cleanNumber) return;


  const url =
    `https://wa.me/${cleanNumber}`;


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


  let isDown =
    false;

  let startX =
    0;

  let scrollLeft =
    0;


  container.addEventListener(
    "pointerdown",
    (event) => {

      isDown =
        true;

      startX =
        event.clientX;

      scrollLeft =
        container.scrollLeft;

      container.setPointerCapture(
        event.pointerId
      );

    }
  );


  container.addEventListener(
    "pointermove",
    (event) => {

      if (!isDown) return;


      const distance =
        event.clientX -
        startX;


      container.scrollLeft =
        scrollLeft -
        distance;

    }
  );


  const stop =
    () => {

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

}


/* =====================================
   CARRUSEL DE CUPONES
===================================== */

function enableCouponSliders() {

  document
    .querySelectorAll(
      ".coupon-slider"
    )
    .forEach(
      (slider) => {

        enableHorizontalDrag(
          slider
        );

      }
    );

}


/* =====================================
   CARRUSEL DE OFERTAS
===================================== */

function setupOfferCarousel(
  container
) {

  if (!container) return;


  /*
    Agregar espacio lateral dinámico
    para permitir centrar la primera
    y última tarjeta.
  */

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


  window.addEventListener(
    "resize",
    updatePadding
  );


  enableHorizontalDrag(
    container
  );

}


/* =====================================
   CENTRAR OFERTA
===================================== */

function centerOfferCard(
  card
) {

  if (!card) return;


  card.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "center"
  });

}


/* =====================================
   AUTO SCROLL DE OFERTAS
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


  let index =
    0;


  const getCards =
    () =>
      Array.from(
        container.querySelectorAll(
          ".offer-card"
        )
      );


  window.__offerAutoScroll =
    setInterval(
      () => {

        const cards =
          getCards();


        if (
          cards.length <= 1
        ) {

          return;

        }


        index =
          (index + 1) %
          cards.length;


        centerOfferCard(
          cards[index]
        );

      },
      3500
    );

}


/* =====================================
   INICIALIZAR
===================================== */

async function initializeApp() {

  try {

    await loadSettings();

    await registerVisit();

    await loadCategories();

    await loadOffers();

    await loadMercadoPago();

    await loadCoupons();

  } catch (error) {

    console.error(
      "Error inicializando la página:",
      error
    );

  }

}


initializeApp();