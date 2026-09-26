const KEY = "patronOfertas_v1";


/* =========================
   DATOS DEMO
========================= */

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
    }

  ],


  promo: {

    title: "💳 $100 GRATIS",

    text:
      "para usuarios nuevos de Mercado Pago",

    image: "",

    link:
      "https://www.mercadopago.com.mx/"

  },


  stats: {

    visits: 0,

    clicks: 0,

    copies: 0

  },


  settings: {

    waNumber: "",

    mlLink:
      "https://www.mercadolibre.com.mx/"

  }

};



/* =========================
   CARGAR BASE DE DATOS
========================= */

let db =
  JSON.parse(
    localStorage.getItem(KEY) || "null"
  ) || demo;



/* =========================
   ASEGURAR CONFIGURACIÓN
========================= */

db.settings ||= {

  waNumber: "",

  mlLink:
    "https://www.mercadolibre.com.mx/"

};



db.stats ||= {

  visits: 0,

  clicks: 0,

  copies: 0

};



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
   ESTADÍSTICAS
========================= */

function renderStats() {

  const container =
    document.querySelector("#stats");


  if (!container) return;


  container.innerHTML = `

    <div class="stat">

      <span>
        Visitas
      </span>

      <b>
        ${db.stats.visits || 0}
      </b>

    </div>


    <div class="stat">

      <span>
        Clics
      </span>

      <b>
        ${db.stats.clicks || 0}
      </b>

    </div>


    <div class="stat">

      <span>
        Copias
      </span>

      <b>
        ${db.stats.copies || 0}
      </b>

    </div>


    <div class="stat">

      <span>
        Ofertas
      </span>

      <b>
        ${db.offers.length}
      </b>

    </div>

  `;

}



/* =========================
   LISTA DE OFERTAS
========================= */

function renderOffers() {

  const container =
    document.querySelector(
      "#offerList"
    );


  if (!container) return;


  if (!db.offers.length) {

    container.innerHTML =
      "<p>No hay ofertas.</p>";

    return;

  }


  container.innerHTML =
    db.offers
      .map(
        (offer, index) => `

          <div class="admin-item">

            <div>

              <b>
                ${offer.name}
              </b>

              <br>

              Precio:
              $${Number(
                offer.price
              ).toLocaleString("es-MX")}

              <br>

              Clics:
              ${offer.clicks || 0}

            </div>


            <div class="mini-actions">

              <button
                onclick="deleteOffer(${index})"
              >
                🗑️ Eliminar
              </button>

            </div>

          </div>

        `
      )
      .join("");

}



/* =========================
   LISTA DE CUPONES
========================= */

function renderCoupons() {

  const container =
    document.querySelector(
      "#couponList"
    );


  if (!container) return;


  if (!db.coupons.length) {

    container.innerHTML =
      "<p>No hay cupones.</p>";

    return;

  }


  container.innerHTML =
    db.coupons
      .map(
        (coupon, index) => `

          <div class="admin-item">

            <div>

              <b>
                ${coupon.code}
              </b>

              <br>

              ${coupon.discount}

              <br>

              ${coupon.section}

              <br>

              Compra mínima:
              $${Number(
                coupon.min || 0
              ).toLocaleString("es-MX")}

            </div>


            <div class="mini-actions">

              <button
                onclick="deleteCoupon(${index})"
              >
                🗑️ Eliminar
              </button>

            </div>

          </div>

        `
      )
      .join("");

}



/* =========================
   LISTA DE CATEGORÍAS
========================= */

function renderCategories() {

  const container =
    document.querySelector(
      "#categoryList"
    );


  if (!container) return;


  if (!db.categories.length) {

    container.innerHTML =
      "<p>No hay categorías.</p>";

    return;

  }


  container.innerHTML =
    db.categories
      .map(
        (category, index) => `

          <div class="admin-item">

            <b>
              ${category[0]}
              ${category[1]}
            </b>


            <button
              onclick="deleteCategory(${index})"
            >
              🗑️ Eliminar
            </button>

          </div>

        `
      )
      .join("");

}



/* =========================
   RENDER GENERAL
========================= */

function render() {

  renderStats();

  renderOffers();

  renderCoupons();

  renderCategories();


  const wa =
    document.querySelector(
      "#waNumber"
    );


  const ml =
    document.querySelector(
      "#mlLink"
    );


  if (wa) {

    wa.value =
      db.settings.waNumber || "";

  }


  if (ml) {

    ml.value =
      db.settings.mlLink || "";

  }

}



/* =========================
   ELIMINAR OFERTA
========================= */

window.deleteOffer =
  function(index) {

    if (
      !confirm(
        "¿Eliminar esta oferta?"
      )
    ) {
      return;
    }


    db.offers.splice(
      index,
      1
    );


    save();

    render();

  };



/* =========================
   ELIMINAR CUPÓN
========================= */

window.deleteCoupon =
  function(index) {

    if (
      !confirm(
        "¿Eliminar este cupón?"
      )
    ) {
      return;
    }


    db.coupons.splice(
      index,
      1
    );


    save();

    render();

  };



/* =========================
   ELIMINAR CATEGORÍA
========================= */

window.deleteCategory =
  function(index) {

    if (
      !confirm(
        "¿Eliminar esta categoría?"
      )
    ) {
      return;
    }


    db.categories.splice(
      index,
      1
    );


    save();

    render();

  };



/* =========================
   CAMBIAR PESTAÑAS
========================= */

document
  .querySelectorAll(".tab")
  .forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".tab")
          .forEach(item => {

            item.classList.remove(
              "active"
            );

          });


        document
          .querySelectorAll(".panel")
          .forEach(panel => {

            panel.classList.remove(
              "active"
            );

          });


        tab.classList.add(
          "active"
        );


        const target =
          document.querySelector(
            "#tab-" +
            tab.dataset.tab
          );


        if (target) {

          target.classList.add(
            "active"
          );

        }

      }
    );

  });



/* =========================
   AGREGAR OFERTA
========================= */

const offerForm =
  document.querySelector(
    "#offerForm"
  );


if (offerForm) {

  offerForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const form =
        new FormData(
          offerForm
        );


      const name =
        String(
          form.get("name") || ""
        ).trim();


      const image =
        String(
          form.get("image") || ""
        ).trim();


      const oldPrice =
        Number(
          form.get("oldPrice")
        ) || 0;


      const price =
        Number(
          form.get("price")
        ) || 0;


      const link =
        String(
          form.get("link") || ""
        ).trim();


      if (!name || !price) {

        alert(
          "Escribe el nombre y precio."
        );

        return;

      }


      db.offers.push({

        name,

        image,

        oldPrice,

        price,

        link,

        clicks: 0

      });


      save();


      offerForm.reset();


      render();

    }
  );

}



/* =========================
   AGREGAR CUPÓN
========================= */

const couponForm =
  document.querySelector(
    "#couponForm"
  );


if (couponForm) {

  couponForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const form =
        new FormData(
          couponForm
        );


      /*
        Convertimos automáticamente
        el código a MAYÚSCULAS.
      */

      const code =
        String(
          form.get("code") || ""
        )
          .trim()
          .toUpperCase();


      const section =
        String(
          form.get("section") || ""
        );


      const discount =
        String(
          form.get("discount") || ""
        );


      const min =
        Number(
          form.get("min")
        ) || 0;


      const max =
        Number(
          form.get("max")
        ) || 0;


      const link =
        String(
          form.get("link") || ""
        ).trim();


      if (!code) {

        alert(
          "Escribe el código del cupón."
        );

        return;

      }


      db.coupons.push({

        section,

        code,

        discount,

        min,

        max,

        link:
          link ||
          db.settings.mlLink

      });


      save();


      couponForm.reset();


      render();

    }
  );

}



/* =========================
   AGREGAR CATEGORÍA
========================= */

const categoryForm =
  document.querySelector(
    "#categoryForm"
  );


if (categoryForm) {

  categoryForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const form =
        new FormData(
          categoryForm
        );


      const name =
        String(
          form.get("name") || ""
        ).trim();


      const emoji =
        String(
          form.get("emoji") || "📌"
        ).trim();


      if (!name) {

        alert(
          "Escribe el nombre."
        );

        return;

      }


      db.categories.push([
        emoji,
        name
      ]);


      save();


      categoryForm.reset();


      render();

    }
  );

}



/* =========================
   MERCADO PAGO
========================= */

const promoForm =
  document.querySelector(
    "#promoForm"
  );


if (promoForm) {

  promoForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const form =
        new FormData(
          promoForm
        );


      db.promo = {

        title:
          String(
            form.get("title") || ""
          ).trim(),

        text:
          String(
            form.get("text") || ""
          ).trim(),

        image:
          String(
            form.get("image") || ""
          ).trim(),

        link:
          String(
            form.get("link") || ""
          ).trim()

      };


      save();


      alert(
        "✅ Promoción guardada correctamente."
      );

    }
  );

}



/* =========================
   CONFIGURACIÓN
========================= */

const saveSettings =
  document.querySelector(
    "#saveSettings"
  );


if (saveSettings) {

  saveSettings.addEventListener(
    "click",
    () => {

      const wa =
        document.querySelector(
          "#waNumber"
        );


      const ml =
        document.querySelector(
          "#mlLink"
        );


      db.settings.waNumber =
        wa.value.trim();


      db.settings.mlLink =
        ml.value.trim();


      save();


      alert(
        "✅ Configuración guardada."
      );

    }
  );

}



/* =========================
   RESTABLECER DEMO
========================= */

const reset =
  document.querySelector(
    "#reset"
  );


if (reset) {

  reset.addEventListener(
    "click",
    () => {

      const confirmReset =
        confirm(
          "¿Seguro que quieres restablecer todos los datos de demostración?"
        );


      if (!confirmReset) {
        return;
      }


      localStorage.removeItem(
        KEY
      );


      location.reload();

    }
  );

}



/* =========================
   INICIALIZAR
========================= */

render();