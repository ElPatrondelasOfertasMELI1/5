import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

/* =====================================
   CONFIGURACIÓN
===================================== */

const ADMIN_UID =
  "XrkjAonD9tWUD6X1rWWJsaQsh9J2";

const MERCADO_LIBRE_AFILIADO =
  "https://meli.la/1mj3itE";

let editingOfferId = null;
let editingCouponId = null;
let editingCategoryId = null;

let offerImageBase64 = "";
let mercadoImageBase64 = "";

let categories = [];
let offers = [];
let coupons = [];
let banks = [];

let bankLogoBase64 = "";

const MERCADO_LIBRE_AFILIADO_PRINCIPAL =
  "https://meli.la/1mj3itE";

const MERCADO_LIBRE_AFILIADO_ALTERNATIVO =
  "https://meli.la/2ths6Hi";

/* =====================================
   UTILIDADES
===================================== */

function showMessage(message, type = "success") {

  const element =
    document.getElementById("adminMessage");

  if (!element) return;

  element.textContent =
    message;

  element.className =
    `admin-message ${type}`;

  clearTimeout(
    window.__adminMessageTimer
  );

  window.__adminMessageTimer =
    setTimeout(() => {

      element.textContent = "";
      element.className =
        "admin-message";

    }, 3500);

}

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

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

/* =====================================
   IMÁGENES → BASE64
===================================== */

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

      const reader =
        new FileReader();

      reader.onload =
        (event) => {

          const img =
            new Image();

          img.onload =
            () => {

              let width =
                img.width;

              let height =
                img.height;

              if (width > maxSize) {

                height =
                  Math.round(
                    height *
                    (maxSize / width)
                  );

                width =
                  maxSize;

              }

              if (height > maxSize) {

                width =
                  Math.round(
                    width *
                    (maxSize / height)
                  );

                height =
                  maxSize;

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
                img,
                0,
                0,
                width,
                height
              );

              const result =
                canvas.toDataURL(
                  "image/jpeg",
                  quality
                );

              resolve(result);

            };

          img.onerror =
            reject;

          img.src =
            event.target.result;

        };

      reader.onerror =
        reject;

      reader.readAsDataURL(file);

    }
  );

}

/* =====================================
   PREVISUALIZACIÓN IMAGEN OFERTA
===================================== */

function setupImagePreviews() {

  const offerInput =
    document.getElementById(
      "offerImage"
    );

  const offerPreview =
    document.getElementById(
      "offerImagePreview"
    );

  if (offerInput) {

    offerInput.addEventListener(
      "change",
      async () => {

        const file =
          offerInput.files[0];

        if (!file) return;

        try {

          offerImageBase64 =
            await imageToBase64(file);

          if (offerPreview) {

            offerPreview.innerHTML =
              `
              <img
                src="${offerImageBase64}"
                alt="Vista previa"
                class="admin-image-preview"
              >
              `;

          }

        } catch (error) {

          console.error(error);

          showMessage(
            "❌ No se pudo cargar la imagen.",
            "error"
          );

        }

      }
    );

  }

  const mpInput =
    document.getElementById(
      "mpImage"
    );

  const mpPreview =
    document.getElementById(
      "mpImagePreview"
    );

  if (mpInput) {

    mpInput.addEventListener(
      "change",
      async () => {

        const file =
          mpInput.files[0];

        if (!file) return;

        try {

          mercadoImageBase64 =
            await imageToBase64(file);

          if (mpPreview) {

            mpPreview.innerHTML =
              `
              <img
                src="${mercadoImageBase64}"
                alt="Vista previa"
                class="admin-image-preview"
              >
              `;

          }

        } catch (error) {

          console.error(error);

          showMessage(
            "❌ No se pudo cargar la imagen.",
            "error"
          );

        }

      }
    );

  }

}

/* =====================================
   TABS
===================================== */

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
            (item) =>
              item.classList.remove(
                "active"
              )
          );

          tab.classList.add(
            "active"
          );

          panels.forEach(
            (panel) => {

              panel.style.display =
                panel.id === target
                  ? "block"
                  : "none";

            }
          );

        }
      );

    }
  );

}

/* =====================================
   CATEGORÍAS
===================================== */

async function loadCategories() {

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

  renderCategorySelect();
  renderCategories();

}

function renderCategorySelect() {

  const select =
    document.getElementById(
      "offerCategory"
    );

  if (!select) return;

  select.innerHTML =
    `
    <option value="">
      Selecciona una categoría
    </option>
    `;

  categories.forEach(
    (category) => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        category.name || "";

      option.textContent =
        `${category.emoji || "📂"} ${category.name || ""}`;

      select.appendChild(
        option
      );

    }
  );

}

function renderCategories() {

  const container =
    document.getElementById(
      "categoriesList"
    );

  if (!container) return;

  if (!categories.length) {

    container.innerHTML =
      "<p>No hay categorías todavía.</p>";

    return;

  }

  container.innerHTML =
    categories.map(
      (category) => `

      <div class="admin-list-item">

        <div>

          <strong>
            ${escapeHTML(
              category.emoji || "📂"
            )}
            ${escapeHTML(
              category.name || ""
            )}
          </strong>

        </div>

        <div class="admin-list-actions">

          <button
            type="button"
            class="edit-button"
            data-edit-category="${escapeHTML(category.id)}"
          >
            ✏️
          </button>

          <button
            type="button"
            class="delete-button"
            data-delete-category="${escapeHTML(category.id)}"
          >
            🗑️
          </button>

        </div>

      </div>

      `
    ).join("");

  container
    .querySelectorAll(
      "[data-edit-category]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset.editCategory;

            editCategory(id);

          }
        );

      }
    );

  container
    .querySelectorAll(
      "[data-delete-category]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            deleteCategory(
              button.dataset.deleteCategory
            );

          }
        );

      }
    );

}

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

    showMessage(
      "❌ Escribe el nombre de la categoría.",
      "error"
    );

    return;

  }

  const id =
    editingCategoryId ||
    crypto.randomUUID();

  await setDoc(
    doc(
      db,
      "categories",
      id
    ),
    {
      name,
      emoji,
      updatedAt:
        new Date().toISOString()
    },
    {
      merge: true
    }
  );

  editingCategoryId =
    null;

  document
    .getElementById(
      "categoryForm"
    )
    .reset();

  await loadCategories();

  showMessage(
    "✅ Categoría guardada."
  );

}

function editCategory(id) {

  const category =
    categories.find(
      (item) =>
        item.id === id
    );

  if (!category) return;

  editingCategoryId =
    id;

  document
    .getElementById(
      "categoryName"
    )
    .value =
    category.name || "";

  document
    .getElementById(
      "categoryEmoji"
    )
    .value =
    category.emoji || "";

}

async function deleteCategory(id) {

  if (
    !confirm(
      "¿Eliminar esta categoría?"
    )
  ) return;

  await deleteDoc(
    doc(
      db,
      "categories",
      id
    )
  );

  await loadCategories();

  showMessage(
    "🗑️ Categoría eliminada."
  );

}

/* =====================================
   BANCOS / TIENDAS
===================================== */

async function loadBanks() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "banks"
      )
    );

  banks =
    snapshot.docs.map(
      item => ({
        id: item.id,
        ...item.data()
      })
    );

  renderBankSelect();
  renderBanksAdmin();
}

function renderBankSelect() {

  const select =
    document.getElementById(
      "couponBank"
    );

  if (!select) return;

  select.innerHTML = `
    <option value="">
      🏦 Sin banco / General
    </option>
  `;

  banks.forEach(bank => {

    const option =
      document.createElement(
        "option"
      );

    option.value =
      bank.id;

    option.textContent =
      `🏦 ${bank.name || ""}`;

    select.appendChild(
      option
    );

  });

}

function renderBanksAdmin() {

  const container =
    document.getElementById(
      "banksList"
    );

  if (!container) return;

  if (!banks.length) {

    container.innerHTML =
      "<p>No hay bancos guardados todavía.</p>";

    return;
  }

  container.innerHTML =
    banks.map(bank => `

      <div class="admin-list-item">

        <div class="admin-item-main">

          ${
            bank.logo
              ? `
                <img
                  src="${bank.logo}"
                  class="bank-admin-logo"
                  alt=""
                >
              `
              : `
                <div class="bank-admin-logo no-image">
                  🏦
                </div>
              `
          }

          <div>

            <strong>
              ${escapeHTML(
                bank.name || ""
              )}
            </strong>

          </div>

        </div>

        <div class="admin-list-actions">

          <button
            type="button"
            class="delete-button"
            data-delete-bank="${escapeHTML(
              bank.id
            )}"
          >
            🗑️
          </button>

        </div>

      </div>

    `).join("");

  container
    .querySelectorAll(
      "[data-delete-bank]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          deleteBank(
            button.dataset.deleteBank
          );

        }
      );

    });

}

async function saveBank() {

  try {

    const nameInput =
      document.getElementById(
        "bankName"
      );

    const logoInput =
      document.getElementById(
        "bankLogo"
      );

    const preview =
      document.getElementById(
        "bankLogoPreview"
      );

    const name =
      nameInput?.value
        .trim() || "";

    /* =====================================
       VALIDAR NOMBRE
    ====================================== */

    if (!name) {

      showMessage(
        "❌ Escribe el nombre del banco o tienda.",
        "error"
      );

      nameInput?.focus();

      return;
    }

    /* =====================================
       VALIDAR LOGO
    ====================================== */

    if (!bankLogoBase64) {

      showMessage(
        "❌ Primero selecciona un logo.",
        "error"
      );

      logoInput?.click();

      return;
    }

    /* =====================================
       CREAR ID
    ====================================== */

    const id =
      crypto.randomUUID();

    /* =====================================
       GUARDAR EN FIRESTORE
    ====================================== */

    await setDoc(
      doc(
        db,
        "banks",
        id
      ),
      {
        name: name,
        logo: bankLogoBase64,
        updatedAt:
          new Date().toISOString()
      }
    );

    /* =====================================
       LIMPIAR FORMULARIO
    ====================================== */

    bankLogoBase64 = "";

    if (nameInput) {
      nameInput.value = "";
    }

    if (logoInput) {
      logoInput.value = "";
    }

    if (preview) {
      preview.innerHTML = "";
    }

    /* =====================================
       ACTUALIZAR LISTA
    ====================================== */

    await loadBanks();

    /* =====================================
       CONFIRMACIÓN
    ====================================== */

    showMessage(
      "✅ Banco guardado correctamente. Ya puedes seleccionarlo en tus cupones."
    );

  } catch (error) {

    console.error(
      "❌ ERROR GUARDANDO BANCO:",
      error
    );

    showMessage(
      "❌ No se pudo guardar el banco. Revisa las reglas de Firebase.",
      "error"
    );

  }

}
  if (
    !confirm(
      "¿Eliminar este banco y su logo?"
    )
  ) {
    return;
  }

  await deleteDoc(
    doc(
      db,
      "banks",
      id
    )
  );

  await loadBanks();

  showMessage(
    "🗑️ Banco eliminado."
  );

}

function setupBankLogoPreview() {

  const input =
    document.getElementById(
      "bankLogo"
    );

  const preview =
    document.getElementById(
      "bankLogoPreview"
    );

  if (!input) return;

  input.addEventListener(
    "change",
    async () => {

      const file =
        input.files[0];

      if (!file) return;

      try {

        bankLogoBase64 =
          await imageToBase64(
            file,
            500,
            0.82
          );

        if (preview) {

          preview.innerHTML = `
            <img
              src="${bankLogoBase64}"
              class="bank-logo-preview"
              alt="Logo"
            >
          `;

        }

      } catch (error) {

        console.error(error);

        showMessage(
          "❌ No se pudo cargar el logo.",
          "error"
        );

      }

    }
  );

}

/* =====================================
   OFERTAS
===================================== */

async function loadOffers() {

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

  renderOffersAdmin();

}

function renderOffersAdmin() {

  const container =
    document.getElementById(
      "offersList"
    );

  if (!container) return;

  if (!offers.length) {

    container.innerHTML =
      "<p>No hay ofertas todavía.</p>";

    return;

  }

  container.innerHTML =
    offers.map(
      (offer) => {

        const image =
          offer.image || "";

        return `

        <div class="admin-list-item">

          <div class="admin-item-main">

            ${
              image
                ? `
                <img
                  src="${image}"
                  class="admin-list-image"
                  alt=""
                >
                `
                : `
                <div class="admin-list-image no-image">
                  🖼️
                </div>
                `
            }

            <div>

              <strong>
                ${escapeHTML(
                  offer.name || ""
                )}
              </strong>

              <small>
                ${escapeHTML(
                  offer.category || ""
                )}
              </small>

              <small>
                ${money(
                  offer.price
                )}
              </small>

            </div>

          </div>

          <div class="admin-list-actions">

            <button
              type="button"
              class="edit-button"
              data-edit-offer="${escapeHTML(offer.id)}"
            >
              ✏️
            </button>

            <button
              type="button"
              class="delete-button"
              data-delete-offer="${escapeHTML(offer.id)}"
            >
              🗑️
            </button>

          </div>

        </div>

        `;

      }
    ).join("");

  container
    .querySelectorAll(
      "[data-edit-offer]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            editOffer(
              button.dataset.editOffer
            );

          }
        );

      }
    );

  container
    .querySelectorAll(
      "[data-delete-offer]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            deleteOffer(
              button.dataset.deleteOffer
            );

          }
        );

      }
    );

}

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
        .value || 0
    );

  const price =
    Number(
      document
        .getElementById(
          "offerPrice"
        )
        .value || 0
    );

  const link =
    document
      .getElementById(
        "offerLink"
      )
      .value
      .trim();

  if (!name || !price || !link) {

    showMessage(
      "❌ Completa los campos obligatorios.",
      "error"
    );

    return;

  }

  const id =
    editingOfferId ||
    crypto.randomUUID();

  const existing =
    offers.find(
      (item) =>
        item.id === id
    );

  const image =
    offerImageBase64 ||
    existing?.image ||
    "";

  await setDoc(
    doc(
      db,
      "offers",
      id
    ),
    {
      name,
      category,
      image,
      oldPrice,
      price,
      link,
      clicks:
        existing?.clicks || 0,
      updatedAt:
        new Date().toISOString()
    },
    {
      merge: true
    }
  );

  editingOfferId =
    null;

  offerImageBase64 =
    "";

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

  await loadOffers();

  showMessage(
    "✅ Oferta guardada."
  );

}

function editOffer(id) {

  const offer =
    offers.find(
      (item) =>
        item.id === id
    );

  if (!offer) return;

  editingOfferId =
    id;

  offerImageBase64 =
    offer.image || "";

  document
    .getElementById(
      "offerName"
    )
    .value =
    offer.name || "";

  document
    .getElementById(
      "offerCategory"
    )
    .value =
    offer.category || "";

  document
    .getElementById(
      "offerOldPrice"
    )
    .value =
    offer.oldPrice || "";

  document
    .getElementById(
      "offerPrice"
    )
    .value =
    offer.price || "";

  document
    .getElementById(
      "offerLink"
    )
    .value =
    offer.link || "";

  const preview =
    document.getElementById(
      "offerImagePreview"
    );

  if (
    preview &&
    offer.image
  ) {

    preview.innerHTML =
      `
      <img
        src="${offer.image}"
        class="admin-image-preview"
        alt=""
      >
      `;

  }

}

async function deleteOffer(id) {

  if (
    !confirm(
      "¿Eliminar esta oferta?"
    )
  ) return;

  await deleteDoc(
    doc(
      db,
      "offers",
      id
    )
  );

  await loadOffers();

  showMessage(
    "🗑️ Oferta eliminada."
  );

}

/* =====================================
   CUPONES
===================================== */

async function loadCoupons() {

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

  renderCouponsAdmin();

}

function renderCouponsAdmin() {

  const container =
    document.getElementById(
      "couponsList"
    );

  if (!container) return;

  if (!coupons.length) {

    container.innerHTML =
      "<p>No hay cupones todavía.</p>";

    return;

  }

  container.innerHTML =
    coupons.map(
      (coupon) => {

        const status =
          String(
            coupon.status ||
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

        return `

        <div class="admin-list-item">

          <div>

            ${
              coupon.name
                ? `
                <strong>
                  🏦 ${escapeHTML(
                    coupon.name
                  )}
                </strong>
                `
                : ""
            }

            <strong>
              🎟️ ${escapeHTML(
                coupon.code || ""
              )}
            </strong>

            <small>
              ${escapeHTML(
                coupon.discount || ""
              )}
            </small>

            <small>
              ${statusText}
            </small>

          </div>

          <div class="admin-list-actions">

            <button
              type="button"
              class="edit-button"
              data-edit-coupon="${escapeHTML(coupon.id)}"
            >
              ✏️
            </button>

            <button
              type="button"
              class="delete-button"
              data-delete-coupon="${escapeHTML(coupon.id)}"
            >
              🗑️
            </button>

          </div>

        </div>

        `;

      }
    ).join("");

  container
    .querySelectorAll(
      "[data-edit-coupon]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            editCoupon(
              button.dataset.editCoupon
            );

          }
        );

      }
    );

  container
    .querySelectorAll(
      "[data-delete-coupon]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            deleteCoupon(
              button.dataset.deleteCoupon
            );

          }
        );

      }
    );

}

async function saveCoupon(
  event
) {

  event.preventDefault();

  /* NOMBRE */

  const name =
    document
      .getElementById(
        "couponName"
      )
      .value
      .trim();

  /* CÓDIGO */

  const code =
    document
      .getElementById(
        "couponCode"
      )
      .value
      .trim()
      .toUpperCase();

  /* SECCIÓN */

  const section =
    document
      .getElementById(
        "couponSection"
      )
      .value;

  /* ESTADO */

  const status =
    document
      .getElementById(
        "couponStatus"
      )
      .value;

  /* DESCUENTO */

  const discount =
    document
      .getElementById(
        "couponDiscount"
      )
      .value
      .trim();

  /* MÍNIMO */

  const minimumPurchase =
    Number(
      document
        .getElementById(
          "couponMin"
        )
        .value || 0
    );

  /* MÁXIMO */

  const maximumDiscount =
    Number(
      document
        .getElementById(
          "couponMax"
        )
        .value || 0
    );

    /* LINK */

  let link =
    document
      .getElementById(
        "couponLink"
      )
      .value
      .trim();

  /* BANCO */

  const bankId =
    document
      .getElementById(
        "couponBank"
      )
      ?.value || "";

  /* TIPO DE AFILIADO */

  const affiliateType =
    document
      .getElementById(
        "couponAffiliateType"
      )
      ?.value || "principal";

  /* AFILIADO PRINCIPAL */

  if (
    affiliateType === "principal"
  ) {

    link =
      MERCADO_LIBRE_AFILIADO_PRINCIPAL;

  }

  /* AFILIADO ALTERNATIVO */

  if (
    affiliateType === "alternativo"
  ) {

    link =
      MERCADO_LIBRE_AFILIADO_ALTERNATIVO;

  }

  /* ENLACE MANUAL */

  if (
    affiliateType === "manual" &&
    !link
  ) {

    showMessage(
      "❌ Escribe el enlace personalizado.",
      "error"
    );

    return;

  }

  /* CÓDIGO OBLIGATORIO */

  if (!code) {

    showMessage(
      "❌ Escribe el código del cupón.",
      "error"
    );

    return;

  }

  const id =
    editingCouponId ||
    crypto.randomUUID();

  const existing =
    coupons.find(
      (item) =>
        item.id === id
    );

  await setDoc(
    doc(
      db,
      "coupons",
      id
    ),
        {
      name,
      code,
      section,
      status,
      discount,
      minimumPurchase,
      maximumDiscount,

      bankId,

      affiliateType,

      link,

      copies:
        existing?.copies || 0,

      updatedAt:
        new Date().toISOString()
    },
    {
      merge: true
    }
  );

  editingCouponId =
    null;

  document
    .getElementById(
      "couponForm"
    )
    .reset();

  await loadCoupons();

  showMessage(
    "✅ Cupón guardado."
  );

}

function editCoupon(id) {

  const coupon =
    coupons.find(
      (item) =>
        item.id === id
    );

  if (!coupon) return;

  editingCouponId =
    id;

  /*
    NOMBRE DEL CUPÓN
  */

  document
    .getElementById(
      "couponName"
    )
    .value =
    coupon.name || "";

  /*
    CÓDIGO
  */

  document
    .getElementById(
      "couponCode"
    )
    .value =
    String(
      coupon.code || ""
    ).toUpperCase();

  /*
    SECCIÓN
  */

  document
    .getElementById(
      "couponSection"
    )
    .value =
    coupon.section ||
    "relampago";

  /*
    ESTADO
  */

  document
    .getElementById(
      "couponStatus"
    )
    .value =
    coupon.status ||
    "active";

  /*
    DESCUENTO
  */

  document
    .getElementById(
      "couponDiscount"
    )
    .value =
    coupon.discount || "";

  /*
    MÍNIMO
  */

  document
    .getElementById(
      "couponMin"
    )
    .value =
    coupon.minimumPurchase || "";

  /*
    MÁXIMO
  */

  document
    .getElementById(
      "couponMax"
    )
    .value =
    coupon.maximumDiscount || "";

    /*
    LINK
  */

  document
    .getElementById(
      "couponLink"
    )
    .value =
    coupon.link || "";

  /*
    BANCO
  */

  const bankSelect =
    document.getElementById(
      "couponBank"
    );

  if (bankSelect) {

    bankSelect.value =
      coupon.bankId || "";

  }

  /*
    TIPO DE AFILIADO
  */

  const affiliateSelect =
    document.getElementById(
      "couponAffiliateType"
    );

  if (affiliateSelect) {

    affiliateSelect.value =
      coupon.affiliateType ||
      "principal";

  }

  /*
    BOTONES DE ESTADO
  */

  const status =
    coupon.status ||
    "active";

  document
    .querySelectorAll(
      "[data-status]"
    )
    .forEach(
      (button) => {

        button.classList.toggle(
          "active",
          button.dataset.status ===
            status
        );

      }
    );

}

async function deleteCoupon(id) {

  if (
    !confirm(
      "¿Eliminar este cupón?"
    )
  ) return;

  await deleteDoc(
    doc(
      db,
      "coupons",
      id
    )
  );

  await loadCoupons();

  showMessage(
    "🗑️ Cupón eliminado."
  );

}

/* =====================================
   MERCADO PAGO
===================================== */

async function loadMercadoPago() {

  const ref =
    doc(
      db,
      "promotions",
      "mercadopago"
    );

  const snapshot =
    await getDoc(ref);

  if (!snapshot.exists())
    return;

  const data =
    snapshot.data();

  document
    .getElementById(
      "mpTitle"
    )
    .value =
    data.title || "";

  document
    .getElementById(
      "mpText"
    )
    .value =
    data.text || "";

  document
    .getElementById(
      "mpLink"
    )
    .value =
    data.link || "";

  mercadoImageBase64 =
    data.image || "";

  const preview =
    document.getElementById(
      "mpImagePreview"
    );

  if (
    preview &&
    data.image
  ) {

    preview.innerHTML =
      `
      <img
        src="${data.image}"
        class="admin-image-preview"
        alt=""
      >
      `;

  }

}

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

  const existing =
    await getDoc(
      doc(
        db,
        "promotions",
        "mercadopago"
      )
    );

  const oldImage =
    existing.exists()
      ? existing.data().image || ""
      : "";

  await setDoc(
    doc(
      db,
      "promotions",
      "mercadopago"
    ),
    {
      title,
      text,
      link,
      image:
        mercadoImageBase64 ||
        oldImage,
      updatedAt:
        new Date().toISOString()
    },
    {
      merge: true
    }
  );

  showMessage(
    "✅ Promoción de Mercado Pago guardada."
  );

}

/* =====================================
   CONFIGURACIÓN
===================================== */

async function loadSettings() {

  const snapshot =
    await getDoc(
      doc(
        db,
        "settings",
        "general"
      )
    );

  if (!snapshot.exists())
    return;

  const data =
    snapshot.data();

  document
    .getElementById(
      "whatsapp"
    )
    .value =
    data.whatsapp || "";

  document
    .getElementById(
      "generalMercadoLibre"
    )
    .value =
    data.generalMercadoLibre ||
    "https://www.mercadolibre.com.mx/";

}

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
        new Date().toISOString()
    },
    {
      merge: true
    }
  );

  showMessage(
    "✅ Configuración guardada."
  );

}

/* =====================================
   ESTADÍSTICAS
===================================== */

async function loadStats() {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "statistics",
          "general"
        )
      );

    if (!snapshot.exists())
      return;

    const data =
      snapshot.data();

    document
      .getElementById(
        "statVisits"
      )
      .textContent =
      data.visits || 0;

    document
      .getElementById(
        "statUnique"
      )
      .textContent =
      data.uniqueVisitors || 0;

    document
      .getElementById(
        "statClicks"
      )
      .textContent =
      data.clicks || 0;

    document
      .getElementById(
        "statCopies"
      )
      .textContent =
      data.copies || 0;

    document
      .getElementById(
        "statPromotions"
      )
      .textContent =
      data.promotions || 0;

    document
      .getElementById(
        "statSavings"
      )
      .textContent =
      money(
        data.savings || 0
      );

  } catch (error) {

    console.error(
      "Error cargando estadísticas:",
      error
    );

  }

}

/* =====================================
   FORMULARIOS
===================================== */

function setupForms() {

  document
    .getElementById(
      "offerForm"
    )
    ?.addEventListener(
      "submit",
      saveOffer
    );

  document
    .getElementById(
      "couponForm"
    )
    ?.addEventListener(
      "submit",
      saveCoupon
    );

  document
    .getElementById(
      "categoryForm"
    )
    ?.addEventListener(
      "submit",
      saveCategory
    );

  document
    .getElementById(
      "mercadoForm"
    )
    ?.addEventListener(
      "submit",
      saveMercadoPago
    );

  document
    .getElementById(
      "settingsForm"
    )
    ?.addEventListener(
      "submit",
      saveSettings
    );

  document
    .getElementById(
      "couponCode"
    )
    ?.addEventListener(
      "input",
      (event) => {

        event.target.value =
          event.target.value.toUpperCase();

      }
    );

  /* =====================================
     BOTONES DE ESTADO DE CUPÓN
  ====================================== */

  document
    .querySelectorAll(
      "[data-status]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const status =
              button.dataset.status;

            const input =
              document.getElementById(
                "couponStatus"
              );

            if (input) {

              input.value =
                status;

            }

            document
              .querySelectorAll(
                "[data-status]"
              )
              .forEach(
                (item) => {

                  item.classList.remove(
                    "active"
                  );

                }
              );

            button.classList.add(
              "active"
            );

          }
        );

      }
    );

  /* =====================================
     GUARDAR BANCO
  ====================================== */

  document
    .getElementById(
      "saveBankButton"
    )
    ?.addEventListener(
      "click",
      saveBank
    );

}

/* =====================================
   INICIALIZAR
===================================== */

async function initializeAdmin() {

  try {

    setupTabs();

    setupForms();

    setupImagePreviews();

    setupBankLogoPreview();

    await loadCategories();

    await loadBanks();

    await loadOffers();

    await loadCoupons();

    await loadMercadoPago();

    await loadSettings();

    await loadStats();

  } catch (error) {

    console.error(
      "Error inicializando administración:",
      error
    );

    showMessage(
      "❌ Ocurrió un error cargando el panel.",
      "error"
    );

  }

}

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) return;

    if (
      user.uid !== ADMIN_UID
    ) {

      return;

    }

    await initializeAdmin();

  }
);