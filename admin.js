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

const MERCADO_LIBRE_AFILIADO_PRINCIPAL =
  "https://meli.la/1mj3itE";

const MERCADO_LIBRE_AFILIADO_ALTERNATIVO =
  "https://meli.la/2ths6Hi";

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
   FECHA MÉXICO
===================================== */

function mexicoDateKey(date = new Date()) {

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(date);

}

function getLastDays(numberOfDays) {

  const dates = [];

  const now =
    new Date();

  for (
    let i = 0;
    i < numberOfDays;
    i++
  ) {

    const date =
      new Date(now);

    date.setDate(
      date.getDate() - i
    );

    dates.push(
      mexicoDateKey(date)
    );

  }

  return dates;

}

function numberValue(value) {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;

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

            editCategory(
              button.dataset.editCategory
            );

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

  banks.forEach(
    bank => {

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

    }
  );

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
    banks.map(
      bank => `

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
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            deleteBank(
              button.dataset.deleteBank
            );

          }
        );

      }
    );

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

    if (!name) {

      showMessage(
        "❌ Escribe el nombre del banco o tienda.",
        "error"
      );

      nameInput?.focus();

      return;

    }

    if (!bankLogoBase64) {

      showMessage(
        "❌ Primero selecciona un logo.",
        "error"
      );

      logoInput?.click();

      return;

    }

    const id =
      crypto.randomUUID();

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

    await loadBanks();

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

async function deleteBank(id) {

  try {

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

  } catch (error) {

    console.error(
      "❌ ERROR ELIMINANDO BANCO:",
      error
    );

    showMessage(
      "❌ No se pudo eliminar el banco.",
      "error"
    );

  }

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

  const name =
    document
      .getElementById(
        "couponName"
      )
      .value
      .trim();

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
        .value || 0
    );

  const maximumDiscount =
    Number(
      document
        .getElementById(
          "couponMax"
        )
        .value || 0
    );

  let link =
    document
      .getElementById(
        "couponLink"
      )
      .value
      .trim();

  const bankId =
    document
      .getElementById(
        "couponBank"
      )
      ?.value || "";

  const affiliateType =
    document
      .getElementById(
        "couponAffiliateType"
      )
      ?.value || "principal";

  if (
    affiliateType === "principal"
  ) {

    link =
      MERCADO_LIBRE_AFILIADO_PRINCIPAL;

  }

  if (
    affiliateType === "alternativo"
  ) {

    link =
      MERCADO_LIBRE_AFILIADO_ALTERNATIVO;

  }

  if (
    affiliateType === "custom" &&
    !link
  ) {

    showMessage(
      "❌ Escribe el enlace personalizado.",
      "error"
    );

    return;

  }

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

  document
    .getElementById(
      "couponName"
    )
    .value =
    coupon.name || "";

  document
    .getElementById(
      "couponCode"
    )
    .value =
    String(
      coupon.code || ""
    ).toUpperCase();

  document
    .getElementById(
      "couponSection"
    )
    .value =
    coupon.section ||
    "flash";

  document
    .getElementById(
      "couponStatus"
    )
    .value =
    coupon.status ||
    "active";

  document
    .getElementById(
      "couponDiscount"
    )
    .value =
    coupon.discount || "";

  document
    .getElementById(
      "couponMin"
    )
    .value =
    coupon.minimumPurchase || "";

  document
    .getElementById(
      "couponMax"
    )
    .value =
    coupon.maximumDiscount || "";

  document
    .getElementById(
      "couponLink"
    )
    .value =
    coupon.link || "";

  const bankSelect =
    document.getElementById(
      "couponBank"
    );

  if (bankSelect) {

    bankSelect.value =
      coupon.bankId || "";

  }

  const affiliateSelect =
    document.getElementById(
      "couponAffiliateType"
    );

  if (affiliateSelect) {

    affiliateSelect.value =
      coupon.affiliateType ||
      "principal";

  }

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
   ESTADÍSTICAS GENERALES
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

    const data =
      snapshot.exists()
        ? snapshot.data()
        : {};

    const visits =
      numberValue(data.visits);

    const uniqueVisitors =
      numberValue(
        data.uniqueVisitors
      );

    const clicks =
      numberValue(data.clicks);

    const copies =
      numberValue(data.copies);

    const promotions =
      numberValue(data.promotions);

    const savings =
      numberValue(data.savings);

    const activeOffers =
      offers.filter(
        offer =>
          offer.active !== false &&
          offer.status !== "inactive"
      ).length;

    const activeCoupons =
      coupons.filter(
        coupon =>
          String(
            coupon.status || "active"
          ).toLowerCase() ===
          "active"
      ).length;

    const statVisits =
      document.getElementById(
        "statVisits"
      );

    if (statVisits) {
      statVisits.textContent =
        visits;
    }

    const statUnique =
      document.getElementById(
        "statUnique"
      );

    if (statUnique) {
      statUnique.textContent =
        uniqueVisitors;
    }

    const statClicks =
      document.getElementById(
        "statClicks"
      );

    if (statClicks) {
      statClicks.textContent =
        clicks;
    }

    const statCopies =
      document.getElementById(
        "statCopies"
      );

    if (statCopies) {
      statCopies.textContent =
        copies;
    }

    const statPromotions =
      document.getElementById(
        "statPromotions"
      );

    if (statPromotions) {
      statPromotions.textContent =
        promotions;
    }

    const statSavings =
      document.getElementById(
        "statSavings"
      );

    if (statSavings) {
      statSavings.textContent =
        money(savings);
    }

    const statOffers =
      document.getElementById(
        "statOffers"
      );

    if (statOffers) {
      statOffers.textContent =
        activeOffers;
    }

    const statCoupons =
      document.getElementById(
        "statCoupons"
      );

    if (statCoupons) {
      statCoupons.textContent =
        activeCoupons;
    }

    await loadDailyStats();

  } catch (error) {

    console.error(
      "Error cargando estadísticas:",
      error
    );

  }

}

/* =====================================
   ESTADÍSTICAS DIARIAS
===================================== */

async function loadDailyStats() {

  try {

    const today =
      mexicoDateKey();

    const last30 =
      getLastDays(30);

    const refs =
      last30.map(
        dateKey =>
          getDoc(
            doc(
              db,
              "statistics",
              `daily_${dateKey}`
            )
          )
      );

    const snapshots =
      await Promise.all(refs);

    const dailyData =
      snapshots.map(
        (snapshot, index) => {

          const dateKey =
            last30[index];

          const data =
            snapshot.exists()
              ? snapshot.data()
              : {};

          return {
            date: dateKey,
            users:
              numberValue(
                data.users ??
                data.uniqueUsers ??
                data.uniqueVisitors ??
                data.visitors
              ),
            visits:
              numberValue(
                data.visits
              ),
            clicks:
              numberValue(
                data.clicks
              ),
            copies:
              numberValue(
                data.copies
              ),
            savings:
              numberValue(
                data.savings
              )
          };

        }
      );

    const todayData =
      dailyData.find(
        item =>
          item.date === today
      ) || {
        date: today,
        users: 0,
        visits: 0,
        clicks: 0,
        copies: 0,
        savings: 0
      };

    const last7 =
      dailyData.slice(
        0,
        7
      );

    const last30Data =
      dailyData.slice(
        0,
        30
      );

    const total7 =
      calculateTotals(
        last7
      );

    const total30 =
      calculateTotals(
        last30Data
      );

    setText(
      "metricUsers7",
      total7.users
    );

    setText(
      "metricVisits7",
      total7.visits
    );

    setText(
      "metricClicks7",
      total7.clicks
    );

    setText(
      "metricCopies7",
      total7.copies
    );

    setText(
      "metricUsers30",
      total30.users
    );

    setText(
      "metricVisits30",
      total30.visits
    );

    setText(
      "metricClicks30",
      total30.clicks
    );

    setText(
      "metricCopies30",
      total30.copies
    );

    const bestDay =
      findBestDay(
        last30Data
      );

    setText(
      "metricBestDay",
      bestDay
        ? `${formatDateLabel(bestDay.date)} · ${bestDay.users} usuarios`
        : "Sin datos"
    );

    setText(
      "metricSavings",
      money(
        total30.savings
      )
    );

    /*
      "Usuarios hoy" utiliza la estadística
      diaria si existe.
    */

    const todayElement =
      document.getElementById(
        "statUsersToday"
      );

    if (todayElement) {

      todayElement.textContent =
        todayData.users;

    }

    /*
      Si el HTML utiliza statVisits como
      visitas generales, no lo sustituimos
      por las visitas de hoy.
    */

  } catch (error) {

    console.error(
      "Error cargando estadísticas diarias:",
      error
    );

  }

}

function calculateTotals(data) {

  return data.reduce(
    (total, item) => {

      total.users +=
        numberValue(item.users);

      total.visits +=
        numberValue(item.visits);

      total.clicks +=
        numberValue(item.clicks);

      total.copies +=
        numberValue(item.copies);

      total.savings +=
        numberValue(item.savings);

      return total;

    },
    {
      users: 0,
      visits: 0,
      clicks: 0,
      copies: 0,
      savings: 0
    }
  );

}

function findBestDay(data) {

  if (!data.length)
    return null;

  return data.reduce(
    (best, current) => {

      const bestActivity =
        numberValue(best.users) +
        numberValue(best.visits) +
        numberValue(best.clicks) +
        numberValue(best.copies);

      const currentActivity =
        numberValue(current.users) +
        numberValue(current.visits) +
        numberValue(current.clicks) +
        numberValue(current.copies);

      return currentActivity >
        bestActivity
        ? current
        : best;

    }
  );

}

function formatDateLabel(dateKey) {

  if (!dateKey)
    return "";

  const parts =
    dateKey.split("-");

  if (parts.length !== 3)
    return dateKey;

  return `${parts[2]}/${parts[1]}`;

}

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (!element) return;

  element.textContent =
    value;

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

/* =====================================
   AUTENTICACIÓN
===================================== */

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user)
      return;

    if (
      user.uid !== ADMIN_UID
    ) {

      return;

    }

    await initializeAdmin();

  }
);