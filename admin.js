import { auth, db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";


// ======================================================
// CONFIGURACIÓN
// ======================================================

const ADMIN_UID =
  "XrkjAonD9tWUD6X1rWWJsaQsh9J2";

const MERCADO_LIBRE_AFILIADO =
  "https://meli.la/1mj3itE";


// ======================================================
// ELEMENTOS
// ======================================================

let adminInitialized = false;


// ======================================================
// MENSAJES
// ======================================================

function showMessage(
  message,
  type = "success"
) {

  const box =
    document.getElementById(
      "adminMessage"
    );

  if (!box) {
    return;
  }

  box.textContent = message;

  box.className =
    `admin-message ${type}`;

  box.style.display =
    "block";

  setTimeout(() => {

    box.style.display =
      "none";

  }, 3500);

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ======================================================
// DINERO
// ======================================================

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


// ======================================================
// IMAGEN
// GALERÍA → BASE64
// CON COMPRESIÓN
// ======================================================

function imageToBase64(
  file,
  maxSize = 1200,
  quality = 0.78
) {

  return new Promise(
    (resolve, reject) => {

      if (!file) {

        resolve("");

        return;

      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        reject(
          new Error(
            "El archivo seleccionado no es una imagen."
          )
        );

        return;

      }


      const reader =
        new FileReader();


      reader.onload = () => {

        const image =
          new Image();


        image.onload = () => {

          let width =
            image.width;

          let height =
            image.height;


          /*
           * Reducimos imágenes
           * demasiado grandes.
           */

          if (
            width > maxSize ||
            height > maxSize
          ) {

            if (
              width > height
            ) {

              height =
                Math.round(
                  height *
                  maxSize /
                  width
                );

              width =
                maxSize;

            } else {

              width =
                Math.round(
                  width *
                  maxSize /
                  height
                );

              height =
                maxSize;

            }

          }


          const canvas =
            document.createElement(
              "canvas"
            );


          canvas.width =
            width;

          canvas.height =
            height;


          const ctx =
            canvas.getContext(
              "2d"
            );


          ctx.drawImage(
            image,
            0,
            0,
            width,
            height
          );


          /*
           * JPEG comprimido.
           * Esto reduce muchísimo
           * el tamaño del Base64.
           */

          const base64 =
            canvas.toDataURL(
              "image/jpeg",
              quality
            );


          resolve(base64);

        };


        image.onerror = () => {

          reject(
            new Error(
              "No se pudo procesar la imagen."
            )
          );

        };


        image.src =
          reader.result;

      };


      reader.onerror = () => {

        reject(
          new Error(
            "No se pudo leer la imagen."
          )
        );

      };


      reader.readAsDataURL(file);

    }
  );

}


// ======================================================
// PREVIEW DE IMÁGENES
// ======================================================

function setupImagePreview(
  inputId,
  previewId
) {

  const input =
    document.getElementById(
      inputId
    );

  const preview =
    document.getElementById(
      previewId
    );


  if (!input || !preview) {
    return;
  }


  input.addEventListener(
    "change",
    () => {

      const file =
        input.files?.[0];


      if (!file) {

        preview.innerHTML =
          "";

        return;

      }


      const reader =
        new FileReader();


      reader.onload = () => {

        preview.innerHTML = `
          <img
            src="${reader.result}"
            alt="Vista previa"
          >
        `;

      };


      reader.readAsDataURL(
        file
      );

    }
  );

}


// ======================================================
// INICIALIZAR PREVIEWS
// ======================================================

function setupImagePreviews() {

  setupImagePreview(
    "offerImage",
    "offerImagePreview"
  );


  setupImagePreview(
    "mpImage",
    "mpImagePreview"
  );

}


// ======================================================
// COMPROBAR ADMIN
// ======================================================

async function checkAdmin(
  user
) {

  if (!user) {
    return false;
  }


  if (
    user.uid !==
    ADMIN_UID
  ) {

    return false;

  }


  try {

    const adminRef =
      doc(
        db,
        "admins",
        user.uid
      );


    const adminSnap =
      await getDoc(
        adminRef
      );


    if (
      !adminSnap.exists()
    ) {

      return false;

    }


    const data =
      adminSnap.data();


    return (
      data.role ===
      "admin"
    );

  } catch (error) {

    console.error(
      "Error comprobando admin:",
      error
    );

    return false;

  }

}


// ======================================================
// PESTAÑAS
// ======================================================

function setupTabs() {

  const tabs =
    document.querySelectorAll(
      ".admin-tab"
    );


  const panels =
    document.querySelectorAll(
      ".admin-panel"
    );


  tabs.forEach(
    (tab) => {

      tab.addEventListener(
        "click",
        () => {

          const target =
            tab.dataset.tab;


          tabs.forEach(
            (item) => {

              item.classList.remove(
                "active"
              );

            }
          );


          panels.forEach(
            (panel) => {

              panel.classList.remove(
                "active"
              );

            }
          );


          tab.classList.add(
            "active"
          );


          const panel =
            document.getElementById(
              target
            );


          if (panel) {

            panel.classList.add(
              "active"
            );

          }

        }
      );

    }
  );

}


// ======================================================
// CARGAR ESTADÍSTICAS
// ======================================================

async function loadStats() {

  try {

    const statsRef =
      doc(
        db,
        "statistics",
        "general"
      );


    const snapshot =
      await getDoc(
        statsRef
      );


    if (
      !snapshot.exists()
    ) {

      return;

    }


    const data =
      snapshot.data();


    const visits =
      data.visits || 0;

    const unique =
      data.uniqueVisitors || 0;

    const clicks =
      data.clicks || 0;

    const copies =
      data.copies || 0;

    const promotions =
      data.promotions || 0;

    const savings =
      data.savings || 0;


    const elements = {

      statVisits:
        visits,

      statUnique:
        unique,

      statClicks:
        clicks,

      statCopies:
        copies,

      statPromotions:
        promotions,

      statSavings:
        money(savings)

    };


    Object.entries(
      elements
    ).forEach(
      ([id, value]) => {

        const element =
          document.getElementById(
            id
          );


        if (element) {

          element.textContent =
            value;

        }

      }
    );

  } catch (error) {

    console.error(
      "Error cargando estadísticas:",
      error
    );

  }

}


// ======================================================
// OFERTAS
// ======================================================

async function loadOffers() {

  const container =
    document.getElementById(
      "offersList"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    "<p>Cargando ofertas...</p>";


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "offers"
        )
      );


    if (
      snapshot.empty
    ) {

      container.innerHTML = `
        <div class="empty-state">
          🔥 No hay ofertas todavía.
        </div>
      `;

      return;

    }


    container.innerHTML = "";


    snapshot.forEach(
      (item) => {

        const data =
          item.data();


        const card =
          document.createElement(
            "article"
          );


        card.className =
          "admin-item";


        card.innerHTML = `

          <div class="admin-item-image">

            ${
              data.image
                ? `
                  <img
                    src="${data.image}"
                    alt=""
                  >
                `
                : `
                  <span>🖼️</span>
                `
            }

          </div>


          <div class="admin-item-content">

            <strong>
              ${escapeHTML(
                data.name
              )}
            </strong>


            ${
              data.category
                ? `
                  <small>
                    📂 ${escapeHTML(
                      data.category
                    )}
                  </small>
                `
                : ""
            }


            <div>

              <span class="old-price">
                ${money(
                  data.oldPrice
                )}
              </span>

              <strong class="final-price">
                ${money(
                  data.price
                )}
              </strong>

            </div>

          </div>


          <div class="admin-item-actions">

            <a
              href="${escapeHTML(
                data.link || "#"
              )}"
              target="_blank"
              rel="noopener"
              class="btn-secondary"
            >
              👁️
            </a>


            <button
              type="button"
              class="btn-danger"
              data-delete-offer="${item.id}"
            >
              🗑️
            </button>

          </div>

        `;


        container.appendChild(
          card
        );

      }
    );


    setupOfferDeleteButtons();

  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        ❌ Error cargando ofertas.
      </div>
    `;

  }

}


// ======================================================
// BORRAR OFERTA
// ======================================================

function setupOfferDeleteButtons() {

  document
    .querySelectorAll(
      "[data-delete-offer]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const id =
              button.dataset.deleteOffer;


            if (
              !confirm(
                "¿Eliminar esta oferta?"
              )
            ) {

              return;

            }


            try {

              await deleteDoc(
                doc(
                  db,
                  "offers",
                  id
                )
              );


              showMessage(
                "✅ Oferta eliminada."
              );


              loadOffers();

            } catch (error) {

              console.error(error);

              showMessage(
                "❌ No se pudo eliminar.",
                "error"
              );

            }

          }
        );

      }
    );

}


// ======================================================
// GUARDAR OFERTA
// ======================================================

async function saveOffer(
  event
) {

  event.preventDefault();


  const name =
    document
      .getElementById(
        "offerName"
      )
      .value
      .trim();


  const category =
    document
      .getElementById(
        "offerCategory"
      )
      .value
      .trim();


  const oldPrice =
    Number(
      document
        .getElementById(
          "offerOldPrice"
        )
        .value
    );


  const price =
    Number(
      document
        .getElementById(
          "offerPrice"
        )
        .value
    );


  const link =
    document
      .getElementById(
        "offerLink"
      )
      .value
      .trim();


  const imageFile =
    document
      .getElementById(
        "offerImage"
      )
      .files?.[0];


  try {

    showMessage(
      "⏳ Procesando imagen..."
    );


    const image =
      await imageToBase64(
        imageFile
      );


    const offerRef =
      doc(
        collection(
          db,
          "offers"
        )
      );


    await setDoc(
      offerRef,
      {

        name,

        category,

        image,

        oldPrice,

        price,

        link,

        clicks: 0,

        createdAt:
          Date.now()

      }
    );


    document
      .getElementById(
        "offerForm"
      )
      .reset();


    document
      .getElementById(
        "offerImagePreview"
      )
      .innerHTML =
      "";


    showMessage(
      "✅ Oferta guardada correctamente."
    );


    loadOffers();

  } catch (error) {

    console.error(error);

    showMessage(
      "❌ No se pudo guardar la oferta.",
      "error"
    );

  }

}


// ======================================================
// CUPONES
// ======================================================

async function loadCoupons() {

  const container =
    document.getElementById(
      "couponsList"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    "<p>Cargando cupones...</p>";


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "coupons"
        )
      );


    if (
      snapshot.empty
    ) {

      container.innerHTML = `
        <div class="empty-state">
          🎟️ No hay cupones todavía.
        </div>
      `;

      return;

    }


    container.innerHTML =
      "";


    snapshot.forEach(
      (item) => {

        const data =
          item.data();


        const status =
          String(
            data.status ||
            "active"
          ).toLowerCase();


        let statusText =
          "🟢 ACTIVO";


        if (
          status === "soon" ||
          status === "por_agotarse"
        ) {

          statusText =
            "🟠 POR AGOTARSE";

        }


        if (
          status === "soldout" ||
          status === "agotado"
        ) {

          statusText =
            "🔴 AGOTADO";

        }


        const card =
          document.createElement(
            "article"
          );


        card.className =
          "admin-item";


        card.innerHTML = `

          <div class="admin-item-content">

            <strong>
              ${escapeHTML(
                String(
                  data.code || ""
                ).toUpperCase()
              )}
            </strong>


            <small>
              ${escapeHTML(
                data.discount ||
                "Descuento"
              )}
            </small>


            <small>
              ${statusText}
            </small>


            ${
              data.minimumPurchase
                ? `
                  <small>
                    Compra mínima:
                    ${money(
                      data.minimumPurchase
                    )}
                  </small>
                `
                : ""
            }


            ${
              data.maximumDiscount
                ? `
                  <small>
                    Descuento máximo:
                    ${money(
                      data.maximumDiscount
                    )}
                  </small>
                `
                : ""
            }


            <small>
              📋 ${data.copies || 0}
              copias
            </small>

          </div>


          <div class="admin-item-actions">

            <button
              type="button"
              class="btn-secondary"
              data-toggle-coupon="${item.id}"
            >
              ✏️
            </button>


            <button
              type="button"
              class="btn-danger"
              data-delete-coupon="${item.id}"
            >
              🗑️
            </button>

          </div>

        `;


        container.appendChild(
          card
        );

      }
    );


    setupCouponButtons();

  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        ❌ Error cargando cupones.
      </div>
    `;

  }

}


// ======================================================
// BOTONES CUPONES
// ======================================================

function setupCouponButtons() {

  document
    .querySelectorAll(
      "[data-delete-coupon]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const id =
              button.dataset.deleteCoupon;


            if (
              !confirm(
                "¿Eliminar este cupón?"
              )
            ) {

              return;

            }


            try {

              await deleteDoc(
                doc(
                  db,
                  "coupons",
                  id
                )
              );


              showMessage(
                "✅ Cupón eliminado."
              );


              loadCoupons();

            } catch (error) {

              console.error(error);

              showMessage(
                "❌ No se pudo eliminar.",
                "error"
              );

            }

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-toggle-coupon]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            showMessage(
              "ℹ️ Para modificarlo puedes eliminarlo y volverlo a crear."
            );

          }
        );

      }
    );

}


// ======================================================
// GUARDAR CUPÓN
// ======================================================

async function saveCoupon(
  event
) {

  event.preventDefault();


  const code =
    document
      .getElementById(
        "couponCode"
      )
      .value
      .trim()
      .toUpperCase();


  const section =
    document
      .getElementById(
        "couponSection"
      )
      .value;


  const status =
    document
      .getElementById(
        "couponStatus"
      )
      .value;


  const discount =
    document
      .getElementById(
        "couponDiscount"
      )
      .value
      .trim();


  const minimumPurchase =
    Number(
      document
        .getElementById(
          "couponMin"
        )
        .value
    ) || 0;


  const maximumDiscount =
    Number(
      document
        .getElementById(
          "couponMax"
        )
        .value
    ) || 0;


  const link =
    document
      .getElementById(
        "couponLink"
      )
      .value
      .trim();


  try {

    const couponRef =
      doc(
        collection(
          db,
          "coupons"
        )
      );


    await setDoc(
      couponRef,
      {

        code,

        section,

        status,

        discount,

        minimumPurchase,

        maximumDiscount,

        link,

        copies: 0,

        createdAt:
          Date.now()

      }
    );


    document
      .getElementById(
        "couponForm"
      )
      .reset();


    showMessage(
      "✅ Cupón guardado correctamente."
    );


    loadCoupons();

  } catch (error) {

    console.error(error);

    showMessage(
      "❌ No se pudo guardar el cupón.",
      "error"
    );

  }

}


// ======================================================
// CATEGORÍAS
// ======================================================

async function loadCategories() {

  const container =
    document.getElementById(
      "categoriesList"
    );


  if (!container) {
    return;
  }


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "categories"
        )
      );


    container.innerHTML =
      "";


    if (
      snapshot.empty
    ) {

      container.innerHTML = `
        <div class="empty-state">
          📂 No hay categorías.
        </div>
      `;

      return;

    }


    snapshot.forEach(
      (item) => {

        const data =
          item.data();


        const card =
          document.createElement(
            "article"
          );


        card.className =
          "admin-item";


        card.innerHTML = `

          <div class="admin-item-content">

            <strong>
              ${escapeHTML(
                data.emoji || "📂"
              )}
              ${escapeHTML(
                data.name || ""
              )}
            </strong>

          </div>


          <div class="admin-item-actions">

            <button
              type="button"
              class="btn-danger"
              data-delete-category="${item.id}"
            >
              🗑️
            </button>

          </div>

        `;


        container.appendChild(
          card
        );

      }
    );


    setupCategoryDeleteButtons();

  } catch (error) {

    console.error(error);

  }

}


// ======================================================
// BORRAR CATEGORÍA
// ======================================================

function setupCategoryDeleteButtons() {

  document
    .querySelectorAll(
      "[data-delete-category]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const id =
              button.dataset.deleteCategory;


            if (
              !confirm(
                "¿Eliminar esta categoría?"
              )
            ) {

              return;

            }


            try {

              await deleteDoc(
                doc(
                  db,
                  "categories",
                  id
                )
              );


              showMessage(
                "✅ Categoría eliminada."
              );


              loadCategories();

            } catch (error) {

              console.error(error);

              showMessage(
                "❌ No se pudo eliminar.",
                "error"
              );

            }

          }
        );

      }
    );

}


// ======================================================
// GUARDAR CATEGORÍA
// ======================================================

async function saveCategory(
  event
) {

  event.preventDefault();


  const name =
    document
      .getElementById(
        "categoryName"
      )
      .value
      .trim();


  const emoji =
    document
      .getElementById(
        "categoryEmoji"
      )
      .value
      .trim();


  if (!name) {
    return;
  }


  try {

    const categoryRef =
      doc(
        collection(
          db,
          "categories"
        )
      );


    await setDoc(
      categoryRef,
      {

        name,

        emoji,

        createdAt:
          Date.now()

      }
    );


    document
      .getElementById(
        "categoryForm"
      )
      .reset();


    showMessage(
      "✅ Categoría guardada."
    );


    loadCategories();

  } catch (error) {

    console.error(error);

    showMessage(
      "❌ No se pudo guardar.",
      "error"
    );

  }

}


// ======================================================
// MERCADO PAGO
// ======================================================

async function loadMercadoPago() {

  try {

    const reference =
      doc(
        db,
        "promotions",
        "mercadopago"
      );


    const snapshot =
      await getDoc(
        reference
      );


    if (
      !snapshot.exists()
    ) {

      return;

    }


    const data =
      snapshot.data();


    const title =
      document.getElementById(
        "mpTitle"
      );


    const text =
      document.getElementById(
        "mpText"
      );


    const link =
      document.getElementById(
        "mpLink"
      );


    if (title) {
      title.value =
        data.title || "";
    }


    if (text) {
      text.value =
        data.text || "";
    }


    if (link) {
      link.value =
        data.link || "";
    }


    if (data.image) {

      const preview =
        document.getElementById(
          "mpImagePreview"
        );


      if (preview) {

        preview.innerHTML = `
          <img
            src="${data.image}"
            alt="Mercado Pago"
          >
        `;

      }

    }

  } catch (error) {

    console.error(
      "Error cargando Mercado Pago:",
      error
    );

  }

}


// ======================================================
// GUARDAR MERCADO PAGO
// ======================================================

async function saveMercadoPago(
  event
) {

  event.preventDefault();


  const title =
    document
      .getElementById(
        "mpTitle"
      )
      .value
      .trim();


  const text =
    document
      .getElementById(
        "mpText"
      )
      .value
      .trim();


  const link =
    document
      .getElementById(
        "mpLink"
      )
      .value
      .trim();


  const imageFile =
    document
      .getElementById(
        "mpImage"
      )
      .files?.[0];


  try {

    showMessage(
      "⏳ Procesando imagen..."
    );


    let image = "";


    /*
     * Si no seleccionas una nueva imagen,
     * conservamos la anterior.
     */

    if (imageFile) {

      image =
        await imageToBase64(
          imageFile
        );

    } else {

      const current =
        await getDoc(
          doc(
            db,
            "promotions",
            "mercadopago"
          )
        );


      if (
        current.exists()
      ) {

        image =
          current.data().image ||
          "";

      }

    }


    await setDoc(
      doc(
        db,
        "promotions",
        "mercadopago"
      ),
      {

        title,

        text,

        image,

        link,

        updatedAt:
          Date.now()

      }
    );


    showMessage(
      "✅ Promoción de Mercado Pago guardada."
    );


  } catch (error) {

    console.error(error);

    showMessage(
      "❌ No se pudo guardar Mercado Pago.",
      "error"
    );

  }

}


// ======================================================
// CONFIGURACIÓN
// ======================================================

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
      !snapshot.exists()
    ) {

      return;

    }


    const data =
      snapshot.data();


    const whatsapp =
      document.getElementById(
        "whatsapp"
      );


    const generalMercadoLibre =
      document.getElementById(
        "generalMercadoLibre"
      );


    if (whatsapp) {

      whatsapp.value =
        data.whatsapp || "";

    }


    if (
      generalMercadoLibre
    ) {

      generalMercadoLibre.value =
        data.generalMercadoLibre ||
        "https://www.mercadolibre.com.mx/";

    }

  } catch (error) {

    console.error(
      "Error cargando configuración:",
      error
    );

  }

}


// ======================================================
// GUARDAR CONFIGURACIÓN
// ======================================================

async function saveSettings(
  event
) {

  event.preventDefault();


  const whatsapp =
    document
      .getElementById(
        "whatsapp"
      )
      .value
      .trim();


  const generalMercadoLibre =
    document
      .getElementById(
        "generalMercadoLibre"
      )
      .value
      .trim();


  try {

    await setDoc(
      doc(
        db,
        "settings",
        "general"
      ),
      {

        whatsapp,

        generalMercadoLibre,

        updatedAt:
          Date.now()

      }
    );


    showMessage(
      "✅ Configuración guardada."
    );

  } catch (error) {

    console.error(error);

    showMessage(
      "❌ No se pudo guardar la configuración.",
      "error"
    );

  }

}


// ======================================================
// FORMULARIOS
// ======================================================

function setupForms() {

  const offerForm =
    document.getElementById(
      "offerForm"
    );


  const couponForm =
    document.getElementById(
      "couponForm"
    );


  const categoryForm =
    document.getElementById(
      "categoryForm"
    );


  const mercadoForm =
    document.getElementById(
      "mercadoForm"
    );


  const settingsForm =
    document.getElementById(
      "settingsForm"
    );


  if (offerForm) {

    offerForm.addEventListener(
      "submit",
      saveOffer
    );

  }


  if (couponForm) {

    couponForm.addEventListener(
      "submit",
      saveCoupon
    );

  }


  if (categoryForm) {

    categoryForm.addEventListener(
      "submit",
      saveCategory
    );

  }


  if (mercadoForm) {

    mercadoForm.addEventListener(
      "submit",
      saveMercadoPago
    );

  }


  if (settingsForm) {

    settingsForm.addEventListener(
      "submit",
      saveSettings
    );

  }

}


// ======================================================
// CONVERTIR CÓDIGO DE CUPÓN A MAYÚSCULAS
// ======================================================

function setupCouponUppercase() {

  const input =
    document.getElementById(
      "couponCode"
    );


  if (!input) {
    return;
  }


  input.addEventListener(
    "input",
    () => {

      input.value =
        input.value.toUpperCase();

    }
  );

}


// ======================================================
// INICIALIZAR ADMIN
// ======================================================

async function initializeAdmin(
  user
) {

  if (adminInitialized) {
    return;
  }


  const isAdmin =
    await checkAdmin(
      user
    );


  if (!isAdmin) {

    alert(
      "No tienes permisos de administrador."
    );


    await auth.signOut();

    return;

  }


  adminInitialized =
    true;


  setupTabs();

  setupForms();

  setupImagePreviews();

  setupCouponUppercase();


  await Promise.all([

    loadStats(),

    loadOffers(),

    loadCoupons(),

    loadCategories(),

    loadMercadoPago(),

    loadSettings()

  ]);

}


// ======================================================
// AUTENTICACIÓN
// ======================================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {
      return;
    }


    try {

      await initializeAdmin(
        user
      );

    } catch (error) {

      console.error(
        "Error inicializando admin:",
        error
      );

      showMessage(
        "❌ Error cargando el panel.",
        "error"
      );

    }

  }
);