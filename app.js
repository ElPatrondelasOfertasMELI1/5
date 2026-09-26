const KEY = "patronOfertas_v1";

const demo = {
  categories: [
    ["📱", "Celulares"],
    ["📺", "Pantallas"],
    ["💻", "Tecnología"],
    ["🎮", "Videojuegos"],
    ["🏠", "Hogar"],
    ["👟", "Moda"]
  ],

  offers: [
    {
      name: "Producto en oferta",
      oldPrice: 1999,
      price: 1499,
      image: "",
      link: "#",
      clicks: 0
    },
    {
      name: "Tecnología con descuento",
      oldPrice: 2499,
      price: 1899,
      image: "",
      link: "#",
      clicks: 0
    },
    {
      name: "Oferta especial",
      oldPrice: 999,
      price: 699,
      image: "",
      link: "#",
      clicks: 0
    }
  ],

  coupons: [
    {
      section: "⚡ Cupones Relámpago",
      code: "OFERTASENCENDIDAS",
      discount: "10% OFF",
      min: 600,
      max: 75,
      link: "https://www.mercadolibre.com.mx/"
    },

    {
      section: "🔥 Exclusivos + Tiendas",
      code: "EXCLUSIVO",
      discount: "14% OFF",
      min: 600,
      max: 105,
      link: "https://www.mercadolibre.com.mx/"
    },

    {
      section: "💳 Cupones Bancarios",
      code: "BANCO",
      discount: "15% OFF",
      min: 1000,
      max: 150,
      link: "https://www.mercadolibre.com.mx/"
    }
  ],

  promo: {
    title: "💳 $100 GRATIS",
    text: "para usuarios nuevos de Mercado Pago",
    image: "",
    link: "https://www.mercadopago.com.mx/"
  },

  stats: {
    visits: 0,
    clicks: 0,
    copies: 0
  },

  settings: {
    mlLink: "https://www.mercadolibre.com.mx/",
    waNumber: ""
  }
};


/* =========================
   CARGAR DATOS
========================= */

let db = JSON.parse(
  localStorage.getItem(KEY) || "null"
) || demo;


/* =========================
   GUARDAR
========================= */

function save() {
  localStorage.setItem(
    KEY,
    JSON.stringify(db)
  );
}


/* =========================
   VISITAS
========================= */

db.stats.visits++;

save();


/* =========================
   CATEGORÍAS
========================= */

const categories =
  document.querySelector("#categories");

if (categories) {

  categories.innerHTML =
    db.categories
      .map(category => {

        return `
          <button class="cat">
            ${category[0]}
            ${category[1]}
          </button>
        `;

      })
      .join("");
}


/* =========================
   OFERTAS
========================= */

const offers =
  document.querySelector("#offers");

if (offers) {

  offers.innerHTML =
    db.offers
      .map((offer, index) => {

        let discount = 0;

        if (
          offer.oldPrice &&
          offer.price
        ) {

          discount = Math.round(
            (1 - offer.price / offer.oldPrice) * 100
          );

        }

        return `
          <article class="card">

            <div class="product-img">

              ${
                offer.image

                  ? `
                    <img
                      src="${offer.image}"
                      alt="${offer.name}"
                    >
                  `

                  : `
                    🛍️
                  `
              }

            </div>


            <div class="card-body">

              <b>
                ${offer.name}
              </b>


              <div>

                <span class="old">
                  ${
                    offer.oldPrice
                      ? "$" +
                        Number(
                          offer.oldPrice
                        ).toLocaleString("es-MX")
                      : ""
                  }
                </span>


                <span class="off">
                  ${discount}% OFF
                </span>

              </div>


              <div class="price">

                $
                ${Number(
                  offer.price
                ).toLocaleString("es-MX")}

              </div>


              <a
                class="buy"
                href="${offer.link || "#"}"
                data-offer="${index}"
                target="_blank"
                rel="noopener"
              >
                Comprar ahora
              </a>

            </div>

          </article>
        `;

      })
      .join("");
}


/* =========================
   CLICS EN OFERTAS
========================= */

if (offers) {

  offers.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-offer]"
        );

      if (!button) return;


      const index =
        Number(
          button.dataset.offer
        );


      if (!db.offers[index]) return;


      db.offers[index].clicks =
        (db.offers[index].clicks || 0) + 1;


      db.stats.clicks++;


      save();

    }
  );

}


/* =========================
   MERCADO PAGO
========================= */

const mercadoPago =
  document.querySelector(
    "#mercadopago"
  );


if (
  mercadoPago &&
  db.promo
) {

  mercadoPago.innerHTML = `

    <div class="mp-inner">

      <div>

        <span class="pill">
          PROMOCIÓN
        </span>


        <h2>
          ${db.promo.title}
        </h2>


        <p>
          ${db.promo.text}
        </p>

      </div>


      <a
        class="btn"
        href="${db.promo.link}"
        target="_blank"
        rel="noopener"
      >
        Aprovechar →
      </a>

    </div>

  `;

}


/* =========================
   CUPONES
========================= */

const couponSections = [
  "⚡ Cupones Relámpago",
  "🔥 Exclusivos + Tiendas",
  "💳 Cupones Bancarios",
  "🎟️ Todos los cupones"
];


const couponContainer =
  document.querySelector(
    "#couponSections"
  );


if (couponContainer) {

  couponContainer.innerHTML =
    couponSections
      .map(section => {

        let coupons;


        if (
          section ===
          "🎟️ Todos los cupones"
        ) {

          coupons = db.coupons;

        } else {

          coupons =
            db.coupons.filter(
              coupon =>
                coupon.section === section
            );

        }


        return `

          <div class="coupon-wrap">

            <h3>
              ${section}
            </h3>


            <div class="coupon-row">

              ${
                coupons.length

                  ? coupons
                      .map(
                        coupon => `

                          <article class="coupon">

                            <strong>
                              ${coupon.discount}
                            </strong>


                            <div>
                              Compra mínima:
                              $
                              ${Number(
                                coupon.min || 0
                              ).toLocaleString("es-MX")}
                            </div>


                            <div>
                              Descuento máximo:
                              $
                              ${Number(
                                coupon.max || 0
                              ).toLocaleString("es-MX")}
                            </div>


                            <div class="code">
                              ${coupon.code}
                            </div>


                            <button
                              class="copy"
                              data-code="${coupon.code}"
                              data-link="${
                                coupon.link ||
                                db.settings.mlLink
                              }"
                            >
                              📋 COPIAR CUPÓN
                            </button>

                          </article>

                        `
                      )
                      .join("")

                  : `
                      <p>
                        No hay cupones disponibles.
                      </p>
                    `
              }

            </div>

          </div>

        `;

      })
      .join("");
}


/* =========================
   COPIAR CUPÓN
========================= */

if (couponContainer) {

  couponContainer.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          ".copy"
        );


      if (!button) return;


      const code =
        button.dataset.code;


      const link =
        button.dataset.link ||
        db.settings.mlLink;


      try {

        await navigator.clipboard.writeText(
          code
        );

      } catch (error) {

        /*
          Compatibilidad con algunos
          navegadores que bloquean
          Clipboard API.
        */

        const textArea =
          document.createElement(
            "textarea"
          );

        textArea.value = code;

        document.body.appendChild(
          textArea
        );

        textArea.select();

        document.execCommand(
          "copy"
        );

        textArea.remove();

      }


      /* Registrar copia */

      db.stats.copies++;

      save();


      /* Cambiar botón */

      button.textContent =
        "✅ ¡COPIADO!";


      setTimeout(() => {

        button.textContent =
          "📋 COPIAR CUPÓN";

      }, 1300);


      /*
        Abrir Mercado Libre.

        En dispositivos donde Mercado Libre
        tenga configurado el enlace universal,
        el sistema puede abrir la aplicación.
      */

      if (link) {

        setTimeout(() => {

          window.location.href =
            link;

        }, 250);

      }

    }
  );

}


/* =========================
   CARRUSEL AUTOMÁTICO
========================= */

function autoScrollSlider(
  slider,
  interval = 4000
) {

  if (!slider) return;


  let timer;


  function start() {

    timer =
      setInterval(() => {

        if (
          slider.scrollWidth <=
          slider.clientWidth
        ) {
          return;
        }


        const first =
          slider.firstElementChild;


        if (!first) return;


        const amount =
          first.offsetWidth + 14;


        const atEnd =
          slider.scrollLeft +
            slider.clientWidth >=
          slider.scrollWidth - 10;


        if (atEnd) {

          slider.scrollTo({
            left: 0,
            behavior: "smooth"
          });

        } else {

          slider.scrollBy({
            left: amount,
            behavior: "smooth"
          });

        }

      }, interval);

  }


  function stop() {

    clearInterval(timer);

  }


  start();


  slider.addEventListener(
    "touchstart",
    stop,
    { passive: true }
  );


  slider.addEventListener(
    "touchend",
    () => {

      setTimeout(
        start,
        1500
      );

    },
    { passive: true }
  );

}


/* =========================
   ACTIVAR CARRUSEL OFERTAS
========================= */

autoScrollSlider(
  document.querySelector("#offers"),
  3500
);


/* =========================
   ACTIVAR CARRUSELES CUPONES
========================= */

document
  .querySelectorAll(".coupon-row")
  .forEach(row => {

    autoScrollSlider(
      row,
      4200
    );

  });