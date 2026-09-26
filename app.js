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
// ELEMENTOS
// ========================================

const categoriesContainer =
  document.getElementById("categories");

const offersContainer =
  document.getElementById("offers");

const couponSectionsContainer =
  document.getElementById("couponSections");

const mercadoPagoContainer =
  document.getElementById("mercadopago");


// ========================================
// CONFIGURACIÓN
// ========================================

let generalSettings = {
  whatsapp: "",
  generalMercadoLibre: "https://www.mercadolibre.com.mx/"
};

let offers = [];
let coupons = [];
let categories = [];


// ========================================
// FORMATO DE DINERO
// ========================================

function money(value) {

  return new Intl.NumberFormat(
    "es-MX",
    {
      style: "currency",
      currency: "MXN"
    }
  ).format(Number(value || 0));

}


// ========================================
// ESCAPAR HTML
// ========================================

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ========================================
// CARGAR CONFIGURACIÓN
// ========================================

async function loadSettings() {

  try {

    const reference =
      doc(
        db,
        "settings",
        "general"
      );

    const snapshot =
      await getDoc(reference);

    if (snapshot.exists()) {

      generalSettings = {
        ...generalSettings,
        ...snapshot.data()
      };

    }

  } catch (error) {

    console.error(
      "Error cargando configuración:",
      error
    );

  }

}


// ========================================
// ESTADÍSTICAS
// ========================================

async function registerVisit() {

  try {

    const statisticsRef =
      doc(
        db,
        "statistics",
        "general"
      );

    await setDoc(
      statisticsRef,
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


// ========================================
// CARGAR CATEGORÍAS
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

    categories = [];

    snapshot.forEach((item) => {

      const data =
        item.data();

      if (
        data.active !== false
      ) {

        categories.push({
          id: item.id,
          ...data
        });

      }

    });

    renderCategories();

  } catch (error) {

    console.error(
      "Error cargando categorías:",
      error
    );

    categoriesContainer.innerHTML = `
      <div class="empty-state">
        No se pudieron cargar las categorías.
      </div>
    `;

  }

}


// ========================================
// RENDER CATEGORÍAS
// ========================================

function renderCategories() {

  if (!categoriesContainer) {
    return;
  }

  if (!categories.length) {

    categoriesContainer.innerHTML = "";

    return;
  }


  categoriesContainer.innerHTML =
    categories.map(
      (category) => `

        <button
          class="category-pill"
          data-category="${escapeHTML(
            category.name
          )}"
        >

          <span>
            ${escapeHTML(
              category.emoji || "📂"
            )}
          </span>

          ${escapeHTML(
            category.name
          )}

        </button>

      `
    ).join("");


  document
    .querySelectorAll(
      ".category-pill"
    )
    .forEach((button) => {

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

    });

}


// ========================================
// CARGAR OFERTAS
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

    offers = [];

    snapshot.forEach((item) => {

      const data =
        item.data();

      if (
        data.active !== false
      ) {

        offers.push({
          id: item.id,
          ...data
        });

      }

    });

    renderOffers(offers);

  } catch (error) {

    console.error(
      "Error cargando ofertas:",
      error
    );

    offersContainer.innerHTML = `
      <div class="empty-state">
        No se pudieron cargar las ofertas.
      </div>
    `;

  }

}


// ========================================
// RENDER OFERTAS
// ========================================

function renderOffers(list) {

  if (!offersContainer) {
    return;
  }

  if (!list.length) {

    offersContainer.innerHTML = `
      <div class="empty-state">
        🔎 No hay ofertas disponibles.
      </div>
    `;

    return;
  }


  offersContainer.innerHTML =
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

        let discount = 0;

        if (
          oldPrice > 0 &&
          price > 0
        ) {

          discount =
            Math.round(
              (
                (oldPrice - price) /
                oldPrice
              ) * 100
            );

        }


        return `

          <article
            class="offer-card"
            data-offer-id="${offer.id}"
          >

            <div class="offer-image-wrap">

              ${
                offer.image
                  ? `
                    <img
                      src="${escapeHTML(
                        offer.image
                      )}"
                      alt="${escapeHTML(
                        offer.name || ""
                      )}"
                      class="offer-image"
                      loading="lazy"
                    >
                  `
                  : `
                    <div class="offer-no-image">
                      🔥
                    </div>
                  `
              }

              ${
                discount > 0
                  ? `
                    <span class="discount-badge">
                      ${discount}% OFF
                    </span>
                  `
                  : ""
              }

            </div>


            <div class="offer-content">

              <h3>
                ${escapeHTML(
                  offer.name ||
                  "Oferta"
                )}
              </h3>


              <div class="offer-prices">

                ${
                  oldPrice > 0
                    ? `
                      <span class="old-price">
                        ${money(oldPrice)}
                      </span>
                    `
                    : ""
                }

                <strong class="final-price">
                  ${money(price)}
                </strong>

              </div>


              <button
                class="buy-button"
                data-offer-link="${escapeHTML(
                  offer.link || ""
                )}"
                data-offer-id="${offer.id}"
              >
                🛒 VER OFERTA
              </button>


              <small class="click-counter">
                👆 ${offer.clicks || 0} clics
              </small>

            </div>

          </article>

        `;

      }
    ).join("");


  document
    .querySelectorAll(
      "[data-offer-link]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.offerId;

          const link =
            button.dataset.offerLink;

          registerOfferClick(id);

          openMercadoLibre(link);

        }
      );

    });


  enableHorizontalDrag(
    offersContainer
  );

}


// ========================================
// FILTRAR OFERTAS
// ========================================

function filterOffersByCategory(
  categoryName
) {

  const filtered =
    offers.filter(
      (offer) => {

        if (!offer.category) {
          return false;
        }

        return (
          offer.category
            .toLowerCase()
            ===
          categoryName
            .toLowerCase()
        );

      }
    );


  if (!filtered.length) {

    // Si todavía no hay categorías
    // asignadas a las ofertas,
    // mostramos todas.

    renderOffers(offers);

    return;

  }


  renderOffers(filtered);

}


// ========================================
// CONTAR CLIC EN OFERTA
// ========================================

async function registerOfferClick(
  offerId
) {

  try {

    const offerRef =
      doc(
        db,
        "offers",
        offerId
      );

    await updateDoc(
      offerRef,
      {
        clicks: increment(1)
      }
    );


    const statisticsRef =
      doc(
        db,
        "statistics",
        "general"
      );

    await setDoc(
      statisticsRef,
      {
        clicks: increment(1)
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


// ========================================
// ABRIR MERCADO LIBRE
// ========================================

function openMercadoLibre(
  link
) {

  const destination =
    link ||
    generalSettings.generalMercadoLibre ||
    "https://www.mercadolibre.com.mx/";


  window.location.href =
    destination;

}


// ========================================
// MERCADO PAGO
// ========================================

async function loadMercadoPago() {

  if (!mercadoPagoContainer) {
    return;
  }

  try {

    const reference =
      doc(
        db,
        "promotions",
        "mercadopago"
      );

    const snapshot =
      await getDoc(reference);

    if (
      !snapshot.exists()
    ) {

      mercadoPagoContainer.innerHTML =
        "";

      return;

    }


    const promo =
      snapshot.data();


    if (
      promo.active === false
    ) {

      mercadoPagoContainer.innerHTML =
        "";

      return;

    }


    mercadoPagoContainer.innerHTML = `

      <div class="mp-inner">

        ${
          promo.image
            ? `
              <img
                src="${escapeHTML(
                  promo.image
                )}"
                alt="Mercado Pago"
                class="mp-image"
                loading="lazy"
              >
            `
            : ""
        }


        <div class="mp-content">

          <span class="mp-label">
            💳 PROMOCIÓN
          </span>

          <h2>
            ${escapeHTML(
              promo.title ||
              "$100 GRATIS"
            )}
          </h2>

          <p>
            ${escapeHTML(
              promo.text ||
              "Promoción especial"
            )}
          </p>


          ${
            promo.link
              ? `
                <a
                  href="${escapeHTML(
                    promo.link
                  )}"
                  class="mp-button"
                  target="_blank"
                  rel="noopener"
                >
                  🚀 VER PROMOCIÓN
                </a>
              `
              : ""
          }

        </div>

      </div>

    `;


    const promotionLink =
      mercadoPagoContainer
        .querySelector(
          ".mp-button"
        );


    if (promotionLink) {

      promotionLink.addEventListener(
        "click",
        async () => {

          try {

            const statsRef =
              doc(
                db,
                "statistics",
                "general"
              );

            await setDoc(
              statsRef,
              {
                promotions:
                  increment(1)
              },
              {
                merge: true
              }
            );

          } catch (error) {

            console.error(error);

          }

        }
      );

    }

  } catch (error) {

    console.error(
      "Error cargando Mercado Pago:",
      error
    );

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

    coupons = [];

    snapshot.forEach((item) => {

      const data =
        item.data();

      if (
        data.active !== false
      ) {

        coupons.push({
          id: item.id,
          ...data
        });

      }

    });

    renderCouponSections();

  } catch (error) {

    console.error(
      "Error cargando cupones:",
      error
    );

    couponSectionsContainer.innerHTML = `
      <div class="empty-state">
        No se pudieron cargar los cupones.
      </div>
    `;

  }

}


// ========================================
// SECCIONES DE CUPONES
// ========================================

const couponSections = [

  {
    id: "relampago",
    title: "⚡ Cupones Relámpago"
  },

  {
    id: "exclusivos",
    title: "🔥 Exclusivos + Tiendas"
  },

  {
    id: "bancarios",
    title: "💳 Cupones Bancarios"
  },

  {
    id: "todos",
    title: "🎟️ Todos los cupones"
  }

];


// ========================================
// RENDER CUPONES
// ========================================

function renderCouponSections() {

  if (!couponSectionsContainer) {
    return;
  }


  couponSectionsContainer.innerHTML =
    couponSections
      .map(
        (section) => {

          const sectionCoupons =
            coupons.filter(
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

              <div
                class="section-heading"
              >

                <h2>
                  ${section.title}
                </h2>

              </div>


              <div
                class="coupon-slider"
                data-section="${section.id}"
              >

                ${sectionCoupons
                  .map(
                    renderCouponCard
                  )
                  .join("")}

              </div>

            </section>

          `;

        }
      )
      .join("");


  document
    .querySelectorAll(
      "[data-copy-coupon]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.copyCoupon;

          copyCoupon(id);

        }
      );

    });


  enableCouponSliders();

}


// ========================================
// TARJETA DE CUPÓN
// ========================================

function renderCouponCard(
  coupon
) {

  return `

    <article
      class="coupon-card"
      data-coupon-id="${coupon.id}"
    >

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


      <h3>
        ${escapeHTML(
          coupon.code ||
          ""
        )}
      </h3>


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


      <button
        class="copy-coupon"
        data-copy-coupon="${coupon.id}"
      >
        📋 COPIAR CUPÓN
      </button>


      <small class="coupon-copies">
        📋 ${coupon.copies || 0} copias
      </small>

    </article>

  `;

}


// ========================================
// COPIAR CUPÓN
// ========================================

async function copyCoupon(
  couponId
) {

  const coupon =
    coupons.find(
      (item) =>
        item.id === couponId
    );


  if (!coupon) {
    return;
  }


  const code =
    String(
      coupon.code || ""
    ).toUpperCase();


  try {

    await copyToClipboard(
      code
    );


    const couponRef =
      doc(
        db,
        "coupons",
        couponId
      );


    await updateDoc(
      couponRef,
      {
        copies: increment(1)
      }
    );


    const statsRef =
      doc(
        db,
        "statistics",
        "general"
      );


    await setDoc(
      statsRef,
      {
        copies: increment(1)
      },
      {
        merge: true
      }
    );


    const button =
      document.querySelector(
        `[data-copy-coupon="${couponId}"]`
      );


    if (button) {

      const original =
        button.innerHTML;

      button.innerHTML =
        "✅ ¡COPIADO!";

      button.classList.add(
        "copied"
      );


      setTimeout(() => {

        button.innerHTML =
          original;

        button.classList.remove(
          "copied"
        );

      }, 2200);

    }


    // Después de copiar,
    // intentamos abrir Mercado Libre.

    setTimeout(() => {

      openMercadoLibre(
        coupon.link ||
        generalSettings.generalMercadoLibre
      );

    }, 350);


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


// ========================================
// PORTAPAPELES
// ========================================

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

  textarea.value = text;

  textarea.style.position =
    "fixed";

  textarea.style.opacity =
    "0";

  document.body.appendChild(
    textarea
  );

  textarea.focus();

  textarea.select();

  const success =
    document.execCommand(
      "copy"
    );

  document.body.removeChild(
    textarea
  );


  if (!success) {

    throw new Error(
      "No se pudo copiar"
    );

  }

}


// ========================================
// WHATSAPP
// ========================================

function setupWhatsApp() {

  if (
    !generalSettings.whatsapp
  ) {

    return;

  }


  const number =
    String(
      generalSettings.whatsapp
    )
      .replace(
        /\D/g,
        ""
      );


  if (!number) {
    return;
  }


  const message =
    encodeURIComponent(
      "Hola, vi una oferta en El Patrón de las Ofertas 🔥"
    );


  const url =
    `https://wa.me/${number}?text=${message}`;


  document
    .querySelectorAll(
      ".whatsapp-link"
    )
    .forEach(
      (element) => {

        element.href =
          url;

      }
    );


  const floating =
    document.querySelector(
      ".whatsapp-float"
    );


  if (floating) {

    floating.href =
      url;

    floating.target =
      "_blank";

    floating.rel =
      "noopener";

  }

}


// ========================================
// SLIDER DE OFERTAS
// ========================================

function enableHorizontalDrag(
  container
) {

  if (!container) {
    return;
  }


  let isDown = false;

  let startX = 0;

  let scrollLeft = 0;


  container.addEventListener(
    "pointerdown",
    (event) => {

      isDown = true;

      startX =
        event.pageX;

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

      if (!isDown) {
        return;
      }

      const distance =
        event.pageX -
        startX;

      container.scrollLeft =
        scrollLeft -
        distance;

    }
  );


  container.addEventListener(
    "pointerup",
    () => {

      isDown = false;

    }
  );


  container.addEventListener(
    "pointercancel",
    () => {

      isDown = false;

    }
  );

}


// ========================================
// SLIDER CUPONES
// ========================================

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

        let autoScroll =
          setInterval(
            () => {

              if (
                slider.scrollWidth <=
                slider.clientWidth
              ) {

                return;

              }


              const maxScroll =
                slider.scrollWidth -
                slider.clientWidth;


              if (
                slider.scrollLeft >=
                maxScroll - 10
              ) {

                slider.scrollTo({
                  left: 0,
                  behavior: "smooth"
                });

              } else {

                slider.scrollBy({
                  left: 280,
                  behavior: "smooth"
                });

              }

            },
            4200
          );


        slider.addEventListener(
          "pointerdown",
          () => {

            clearInterval(
              autoScroll
            );

          },
          {
            once: true
          }
        );

      }
    );

}


// ========================================
// SLIDER AUTOMÁTICO OFERTAS
// ========================================

function enableOfferAutoScroll() {

  if (!offersContainer) {
    return;
  }


  const slider =
    offersContainer;


  setInterval(
    () => {

      if (
        slider.scrollWidth <=
        slider.clientWidth
      ) {

        return;

      }


      const maxScroll =
        slider.scrollWidth -
        slider.clientWidth;


      if (
        slider.scrollLeft >=
        maxScroll - 10
      ) {

        slider.scrollTo({
          left: 0,
          behavior: "smooth"
        });

      } else {

        slider.scrollBy({
          left: 300,
          behavior: "smooth"
        });

      }

    },
    3500
  );

}


// ========================================
// CARGAR TODO
// ========================================

async function initializeApp() {

  await loadSettings();

  await Promise.all([

    loadCategories(),

    loadOffers(),

    loadCoupons(),

    loadMercadoPago()

  ]);


  setupWhatsApp();

  enableOfferAutoScroll();

  registerVisit();

}


// ========================================
// INICIAR
// ========================================

initializeApp();