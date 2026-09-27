// ========================================
// EL PATRÓN DE LAS OFERTAS
// ADMIN.JS - FIREBASE
// ========================================

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

// ========================================
// CONFIGURACIÓN
// ========================================

const ADMIN_UID =
  "XrkjAonD9tWUD6X1rWWJsaQsh9J2";

const MERCADO_LIBRE_AFILIADO =
  "https://meli.la/1mj3itE";

const MERCADO_LIBRE_AFILIADO_PRINCIPAL =
  "https://meli.la/1mj3itE";

const MERCADO_LIBRE_AFILIADO_ALTERNATIVO =
  "https://meli.la/2ths6Hi";

// ========================================
// ESTADO
// ========================================

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

// ========================================
// UTILIDADES
// ========================================

function showMessage(
  message,
  type = "success"
) {

  const element =
    document.getElementById(
      "adminMessage"
    );

  if (!element) return;

  element.textContent =
    message;

  element.className =
    `admin-message ${type}`;

  clearTimeout(
    showMessage.timer
  );

  showMessage.timer =
    setTimeout(
      () => {

        element.className =
          "admin-message";

      },
      4500
    );
}

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function money(
  value
) {

  return Number(
    value || 0
  ).toLocaleString(
    "es-MX",
    {
      style:
        "currency",
      currency:
        "MXN"
    }
  );
}

// ========================================
// FECHA MÉXICO
// ========================================

function getMexicoDateKey() {

  try {

    const formatter =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "America/Mexico_City",
          year:
            "numeric",
          month:
            "2-digit",
          day:
            "2-digit"
        }
      );

    return formatter.format(
      new Date()
    );

  } catch (error) {

    const now =
      new Date();

    return [
      now.getFullYear(),
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      ),
      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      )
    ].join("-");
  }
}

// ========================================
// FECHA FORMATEADA
// ========================================

function formatDate(
  dateKey
) {

  if (!dateKey) {
    return "";
  }

  const parts =
    String(
      dateKey
    ).split("-");

  if (
    parts.length !== 3
  ) {
    return dateKey;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// ========================================
// OBTENER FECHAS DIARIAS
// ========================================

function getPreviousDate(
  dateKey,
  daysAgo
) {

  const [
    year,
    month,
    day
  ] =
    dateKey
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  date.setUTCDate(
    date.getUTCDate() -
      daysAgo
  );

  return [
    date.getUTCFullYear(),
    String(
      date.getUTCMonth() + 1
    ).padStart(
      2,
      "0"
    ),
    String(
      date.getUTCDate()
    ).padStart(
      2,
      "0"
    )
  ].join("-");
}

// ========================================
// IMÁGENES
// ========================================

function imageToBase64(
  file
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      if (!file) {

        resolve("");

        return;
      }

      const reader =
        new FileReader();

      reader.onload =
        () => {

          resolve(
            reader.result
          );
        };

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );
    }
  );
}

// ========================================
// PREVISUALIZACIÓN IMÁGENES
// ========================================

function setupImagePreviews() {

  const offerInput =
    document.getElementById(
      "offerImage"
    );

  const offerPreview =
    document.getElementById(
      "offerImagePreview"
    );

  if (
    offerInput &&
    offerPreview
  ) {

    offerInput.addEventListener(
      "change",
      async () => {

        const file =
          offerInput.files?.[0];

        if (!file) return;

        try {

          offerImageBase64 =
            await imageToBase64(
              file
            );

          offerPreview.innerHTML = `

            <img
              src="${offerImageBase64}"
              alt="Vista previa"
            >

          `;

        } catch (error) {

          console.error(
            error
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

  if (
    mpInput &&
    mpPreview
  ) {

    mpInput.addEventListener(
      "change",
      async () => {

        const file =
          mpInput.files?.[0];

        if (!file) return;

        try {

          mercadoImageBase64 =
            await imageToBase64(
              file
            );

          mpPreview.innerHTML = `

            <img
              src="${mercadoImageBase64}"
              alt="Vista previa"
            >

          `;

        } catch (error) {

          console.error(
            error
          );
        }
      }
    );
  }
}

// ========================================
// TABS
// ========================================

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
    tab => {

      tab.addEventListener(
        "click",
        () => {

          const target =
            tab.dataset.tab;

          tabs.forEach(
            item => {

              item.classList.toggle(
                "active",
                item === tab
              );
            }
          );

          panels.forEach(
            panel => {

              panel.classList.toggle(
                "active",
                panel.id ===
                  `${target}Tab`
              );
            }
          );
        }
      );
    }
  );
}

// ========================================
// CATEGORÍAS
// ========================================

async function loadCategories() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "categories"
      )
    );

  categories =
    snapshot.docs
      .map(
        item => ({
          id:
            item.id,
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

  const current =
    select.value;

  select.innerHTML = `

    <option value="">
      Selecciona una categoría
    </option>

    ${
      categories
        .map(
          category => `

            <option
              value="${escapeHTML(
                category.name || ""
              )}"
            >
              ${escapeHTML(
                category.name || ""
              )}
            </option>

          `
        )
        .join("")
    }

  `;

  if (current) {
    select.value =
      current;
  }
}

function renderCategories() {

  const container =
    document.getElementById(
      "categoriesList"
    );

  if (!container) return;

  if (!categories.length) {

    container.innerHTML = `

      <div class="admin-empty">
        No hay categorías.
      </div>

    `;

    return;
  }

  container.innerHTML =
    categories
      .map(
        category => `

          <div
            class="admin-list-item"
          >

            <div
              class="admin-list-item-info"
            >

              <strong>
                ${escapeHTML(
                  category.emoji ||
                  "📂"
                )}
                ${escapeHTML(
                  category.name ||
                  ""
                )}
              </strong>

            </div>

            <div
              class="admin-actions"
            >

              <button
                type="button"
                class="edit-button"
                data-edit-category="${escapeHTML(
                  category.id
                )}"
              >
                ✏️ Editar
              </button>

              <button
                type="button"
                class="delete-button"
                data-delete-category="${escapeHTML(
                  category.id
                )}"
              >
                🗑️ Eliminar
              </button>

            </div>

          </div>

        `
      )
      .join("");

  container
    .querySelectorAll(
      "[data-edit-category]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            editCategory(
              button.dataset
                .editCategory
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
      button => {

        button.addEventListener(
          "click",
          () => {

            deleteCategory(
              button.dataset
                .deleteCategory
            );
          }
        );
      }
    );
}

async function saveCategory() {

  const nameInput =
    document.getElementById(
      "categoryName"
    );

  const emojiInput =
    document.getElementById(
      "categoryEmoji"
    );

  const name =
    nameInput?.value.trim() ||
    "";

  const emoji =
    emojiInput?.value.trim() ||
    "📂";

  if (!name) {

    showMessage(
      "❌ Escribe el nombre de la categoría.",
      "error"
    );

    nameInput?.focus();

    return;
  }

  try {

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
        active:
          true,
        updatedAt:
          new Date().toISOString()
      },
      {
        merge:
          true
      }
    );

    editingCategoryId =
      null;

    if (nameInput) {
      nameInput.value =
        "";
    }

    if (emojiInput) {
      emojiInput.value =
        "";
    }

    await loadCategories();

    showMessage(
      "✅ Categoría guardada."
    );

  } catch (error) {

    console.error(
      error
    );

    showMessage(
      "❌ No se pudo guardar la categoría.",
      "error"
    );
  }
}

function editCategory(
  id
) {

  const category =
    categories.find(
      item =>
        item.id === id
    );

  if (!category) return;

  editingCategoryId =
    id;

  const nameInput =
    document.getElementById(
      "categoryName"
    );

  const emojiInput =
    document.getElementById(
      "categoryEmoji"
    );

  if (nameInput) {
    nameInput.value =
      category.name ||
      "";
  }

  if (emojiInput) {
    emojiInput.value =
      category.emoji ||
      "";
  }

  document
    .getElementById(
      "categoryName"
    )
    ?.focus();
}

async function deleteCategory(
  id
) {

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

    await loadCategories();

    showMessage(
      "🗑️ Categoría eliminada."
    );

  } catch (error) {

    console.error(
      error
    );

    showMessage(
      "❌ No se pudo eliminar la categoría.",
      "error"
    );
  }
}

// ========================================
// BANCOS / TIENDAS
// ========================================

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
        id:
          item.id,
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

  const current =
    select.value;

  select.innerHTML = `

    <option value="">
      Sin banco / tienda
    </option>

    ${
      banks
        .map(
          bank => `

            <option
              value="${escapeHTML(
                bank.id
              )}"
            >
              ${escapeHTML(
                bank.name ||
                ""
              )}
            </option>

          `
        )
        .join("")
    }

  `;

  if (current) {
    select.value =
      current;
  }
}

function renderBanksAdmin() {

  const container =
    document.getElementById(
      "banksList"
    );

  if (!container) return;

  if (!banks.length) {

    container.innerHTML = `

      <div class="admin-empty">
        🏦 No hay bancos o tiendas registrados.
      </div>

    `;

    return;
  }

  container.innerHTML =
    banks
      .map(
        bank => `

          <div
            class="admin-list-item"
          >

            <div
              class="admin-list-item-info"
            >

              ${
                bank.logo
                  ? `

                    <img
                      src="${escapeHTML(
                        bank.logo
                      )}"
                      alt="${escapeHTML(
                        bank.name ||
                        ""
                      )}"
                      style="
                        width:44px;
                        height:44px;
                        object-fit:contain;
                        border-radius:8px;
                        background:#fff;
                        border:1px solid #ddd;
                        padding:4px;
                        margin-right:10px;
                      "
                    >

                  `
                  : `
                    <span
                      style="
                        font-size:28px;
                        margin-right:10px;
                      "
                    >
                      🏦
                    </span>
                  `
              }

              <strong>
                ${escapeHTML(
                  bank.name ||
                  ""
                )}
              </strong>

            </div>

            <div
              class="admin-actions"
            >

              <button
                type="button"
                class="delete-button"
                data-delete-bank="${escapeHTML(
                  bank.id
                )}"
              >
                🗑️ Eliminar
              </button>

            </div>

          </div>

        `
      )
      .join("");

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
              button.dataset
                .deleteBank
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
      nameInput?.value.trim() ||
      "";

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
        name:
          name,

        logo:
          bankLogoBase64,

        updatedAt:
          new Date().toISOString()
      }
    );

    bankLogoBase64 =
      "";

    if (nameInput) {
      nameInput.value =
        "";
    }

    if (logoInput) {
      logoInput.value =
        "";
    }

    if (preview) {
      preview.innerHTML =
        "";
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

async function deleteBank(
  id
) {

  if (
    !confirm(
      "¿Eliminar este banco y su logo?"
    )
  ) {
    return;
  }

  try {

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

  if (
    !input ||
    !preview
  ) {
    return;
  }

  input.addEventListener(
    "change",
    async () => {

      const file =
        input.files?.[0];

      if (!file) return;

      try {

        bankLogoBase64 =
          await imageToBase64(
            file
          );

        preview.innerHTML = `

          <img
            src="${bankLogoBase64}"
            alt="Logo"
            style="
              width:100%;
              max-width:120px;
              height:100px;
              object-fit:contain;
            "
          >

        `;

      } catch (error) {

        console.error(
          error
        );
      }
    }
  );
}

// ========================================
// OFERTAS
// ========================================

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
      item => ({
        id:
          item.id,
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

    container.innerHTML = `

      <div class="admin-empty">
        🛒 No hay ofertas registradas.
      </div>

    `;

    return;
  }

  container.innerHTML =
    offers
      .map(
        offer => `

          <div
            class="admin-list-item"
          >

            <div
              class="admin-list-item-info"
            >

              ${
                offer.image
                  ? `

                    <img
                      src="${escapeHTML(
                        offer.image
                      )}"
                      alt=""
                      style="
                        width:58px;
                        height:58px;
                        object-fit:contain;
                        border-radius:10px;
                        background:#fff;
                        margin-right:10px;
                      "
                    >

                  `
                  : ""
              }

              <div>

                <strong>
                  ${escapeHTML(
                    offer.name ||
                    "Oferta"
                  )}
                </strong>

                <small>
                  ${money(
                    offer.price
                  )}
                </small>

              </div>

            </div>

            <div
              class="admin-actions"
            >

              <button
                type="button"
                class="edit-button"
                data-edit-offer="${escapeHTML(
                  offer.id
                )}"
              >
                ✏️ Editar
              </button>

              <button
                type="button"
                class="delete-button"
                data-delete-offer="${escapeHTML(
                  offer.id
                )}"
              >
                🗑️ Eliminar
              </button>

            </div>

          </div>

        `
      )
      .join("");

  container
    .querySelectorAll(
      "[data-edit-offer]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            editOffer(
              button.dataset
                .editOffer
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
      button => {

        button.addEventListener(
          "click",
          () => {

            deleteOffer(
              button.dataset
                .deleteOffer
            );
          }
        );
      }
    );
}

async function saveOffer() {

  const name =
    document.getElementById(
      "offerName"
    )?.value.trim() ||
    "";

  const category =
    document.getElementById(
      "offerCategory"
    )?.value.trim() ||
    "";

  const oldPrice =
    Number(
      document.getElementById(
        "offerOldPrice"
      )?.value || 0
    );

  const price =
    Number(
      document.getElementById(
        "offerPrice"
      )?.value || 0
    );

  const link =
    document.getElementById(
      "offerLink"
    )?.value.trim() ||
    "";

  if (!name) {

    showMessage(
      "❌ Escribe el nombre de la oferta.",
      "error"
    );

    return;
  }

  if (!price) {

    showMessage(
      "❌ Escribe el precio de la oferta.",
      "error"
    );

    return;
  }

  try {

    const id =
      editingOfferId ||
      crypto.randomUUID();

    const existing =
      offers.find(
        item =>
          item.id ===
          id
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
        active:
          true,
        clicks:
          existing?.clicks ||
          0,
        updatedAt:
          new Date().toISOString()
      },
      {
        merge:
          true
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
      ?.reset();

    const preview =
      document.getElementById(
        "offerImagePreview"
      );

    if (preview) {
      preview.innerHTML =
        "";
    }

    await loadOffers();

    showMessage(
      "✅ Oferta guardada correctamente."
    );

  } catch (error) {

    console.error(
      error
    );

    showMessage(
      "❌ No se pudo guardar la oferta.",
      "error"
    );
  }
}

function editOffer(
  id
) {

  const offer =
    offers.find(
      item =>
        item.id === id
    );

  if (!offer) return;

  editingOfferId =
    id;

  document.getElementById(
    "offerName"
  ).value =
    offer.name ||
    "";

  document.getElementById(
    "offerCategory"
  ).value =
    offer.category ||
    "";

  document.getElementById(
    "offerOldPrice"
  ).value =
    offer.oldPrice ||
    "";

  document.getElementById(
    "offerPrice"
  ).value =
    offer.price ||
    "";

  document.getElementById(
    "offerLink"
  ).value =
    offer.link ||
    "";

  offerImageBase64 =
    offer.image ||
    "";

  const preview =
    document.getElementById(
      "offerImagePreview"
    );

  if (
    preview &&
    offer.image
  ) {

    preview.innerHTML = `

      <img
        src="${escapeHTML(
          offer.image
        )}"
        alt="Oferta"
      >

    `;
  }

  document
    .getElementById(
      "offerName"
    )
    ?.focus();
}

async function deleteOffer(
  id
) {

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

    await loadOffers();

    showMessage(
      "🗑️ Oferta eliminada."
    );

  } catch (error) {

    console.error(
      error
    );

    showMessage(
      "❌ No se pudo eliminar la oferta.",
      "error"
    );
  }
}

// ========================================
// CUPONES
// ========================================

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
      item => ({
        id:
          item.id,
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

    container.innerHTML = `

      <div class="admin-empty">
        🎟️ No hay cupones registrados.
      </div>

    `;

    return;
  }

  container.innerHTML =
    coupons
      .map(
        coupon => {

          const bank =
            banks.find(
              item =>
                String(
                  item.id
                ) ===
                String(
                  coupon.bankId ||
                  ""
                )
            );

          return `

            <div
              class="admin-list-item"
            >

              <div
                class="admin-list-item-info"
              >

                <div>

                  <strong>
                    ${escapeHTML(
                      coupon.name ||
                      coupon.code ||
                      "Cupón"
                    )}
                  </strong>

                  <small>

                    ${
                      coupon.discount
                        ? escapeHTML(
                            coupon.discount
                          )
                        : ""
                    }

                    ${
                      bank?.name
                        ? ` · ${escapeHTML(
                            bank.name
                          )}`
                        : ""
                    }

                  </small>

                </div>

              </div>

              <div
                class="admin-actions"
              >

                <button
                  type="button"
                  class="edit-button"
                  data-edit-coupon="${escapeHTML(
                    coupon.id
                  )}"
                >
                  ✏️ Editar
                </button>

                <button
                  type="button"
                  class="delete-button"
                  data-delete-coupon="${escapeHTML(
                    coupon.id
                  )}"
                >
                  🗑️ Eliminar
                </button>

              </div>

            </div>

          `;
        }
      )
      .join("");

  container
    .querySelectorAll(
      "[data-edit-coupon]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            editCoupon(
              button.dataset
                .editCoupon
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
      button => {

        button.addEventListener(
          "click",
          () => {

            deleteCoupon(
              button.dataset
                .deleteCoupon
            );
          }
        );
      }
    );
}

async function saveCoupon() {

  const name =
    document.getElementById(
      "couponName"
    )?.value.trim() ||
    "";

  const code =
    document.getElementById(
      "couponCode"
    )?.value.trim() ||
    "";

  const section =
    document.getElementById(
      "couponSection"
    )?.value ||
    "relampago";

  const status =
    document.getElementById(
      "couponStatus"
    )?.value ||
    "active";

  const discount =
    document.getElementById(
      "couponDiscount"
    )?.value.trim() ||
    "";

  const minimumPurchase =
    Number(
      document.getElementById(
        "couponMin"
      )?.value || 0
    );

  const maximumDiscount =
    Number(
      document.getElementById(
        "couponMax"
      )?.value || 0
    );

  const bankId =
    document.getElementById(
      "couponBank"
    )?.value ||
    "";

  const affiliateType =
    document.getElementById(
      "couponAffiliateType"
    )?.value ||
    "principal";

  const linkInput =
    document.getElementById(
      "couponLink"
    );

  let link =
    linkInput?.value.trim() ||
    "";

  if (
    !link &&
    affiliateType ===
      "principal"
  ) {

    link =
      MERCADO_LIBRE_AFILIADO_PRINCIPAL;
  }

  if (
    !link &&
    affiliateType ===
      "alternativo"
  ) {

    link =
      MERCADO_LIBRE_AFILIADO_ALTERNATIVO;
  }

  if (!name) {

    showMessage(
      "❌ Escribe el nombre del cupón.",
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

  try {

    const id =
      editingCouponId ||
      crypto.randomUUID();

    const existing =
      coupons.find(
        item =>
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
        code:
          code.toUpperCase(),
        section,
        status,
        discount,
        minimumPurchase,
        maximumDiscount,
        bankId,
        affiliateType,
        link,
        copies:
          existing?.copies ||
          0,
        updatedAt:
          new Date().toISOString()
      },
      {
        merge:
          true
      }
    );

    editingCouponId =
      null;

    document
      .getElementById(
        "couponForm"
      )
      ?.reset();

    const statusInput =
      document.getElementById(
        "couponStatus"
      );

    if (statusInput) {

      statusInput.value =
        "active";
    }

    document
      .querySelectorAll(
        ".coupon-status-buttons button"
      )
      .forEach(
        button => {

          button.classList.toggle(
            "active",
            button.dataset.status ===
              "active"
          );
        }
      );

    await loadCoupons();

    showMessage(
      "✅ Cupón guardado correctamente."
    );

  } catch (error) {

    console.error(
      error
    );

    showMessage(
      "❌ No se pudo guardar el cupón.",
      "error"
    );
  }
}

function editCoupon(
  id
) {

  const coupon =
    coupons.find(
      item =>
        item.id === id
    );

  if (!coupon) return;

  editingCouponId =
    id;

  const setValue =
    (
      elementId,
      value
    ) => {

      const element =
        document.getElementById(
          elementId
        );

      if (element) {

        element.value =
          value ?? "";
      }
    };

  setValue(
    "couponName",
    coupon.name
  );

  setValue(
    "couponCode",
    coupon.code
  );

  setValue(
    "couponSection",
    coupon.section ||
      "relampago"
  );

  setValue(
    "couponStatus",
    coupon.status ||
      "active"
  );

  setValue(
    "couponDiscount",
    coupon.discount
  );

  setValue(
    "couponMin",
    coupon.minimumPurchase
  );

  setValue(
    "couponMax",
    coupon.maximumDiscount
  );

  setValue(
    "couponBank",
    coupon.bankId ||
      ""
  );

  setValue(
    "couponAffiliateType",
    coupon.affiliateType ||
      "principal"
  );

  setValue(
    "couponLink",
    coupon.link ||
      ""
  );

  document
    .querySelectorAll(
      ".coupon-status-buttons button"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.status ===
            (
              coupon.status ||
              "active"
            )
        );
      }
    );

  document
    .getElementById(
      "couponName"
    )
    ?.focus();
}

async function deleteCoupon(
  id
) {

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

    await loadCoupons();

    showMessage(
      "🗑️ Cupón eliminado."
    );

  } catch (error) {

    console.error(
      error
    );

    showMessage(
      "❌ No se pudo eliminar el cupón.",
      "error"
    );
  }
}

// ========================================
// MERCADO PAGO
// ========================================

async function loadMercadoPago() {

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
      return;
    }

    const data =
      snapshot.data();

    const setValue =
      (
        id,
        value
      ) => {

        const element =
          document.getElementById(
            id
          );

        if (element) {

          element.value =
            value ?? "";
        }
      };

    setValue(
      "mpTitle",
      data.title
    );

    setValue(
      "mpText",
      data.text
    );

    setValue(
      "mpLink",
      data.link
    );

    if (data.image) {

      mercadoImageBase64 =
        data.image;

      const preview =
        document.getElementById(
          "mpImagePreview"
        );

      if (preview) {

        preview.innerHTML = `

          <img
            src="${escapeHTML(
              data.image
            )}"
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

async function saveMercadoPago() {

  const title =
    document.getElementById(
      "mpTitle"
    )?.value.trim() ||
    "";

  const text =
    document.getElementById(
      "mpText"
    )?.value.trim() ||
    "";

  const link =
    document.getElementById(
      "mpLink"
    )?.value.trim() ||
    "";

  if (!title) {

    showMessage(
      "❌ Escribe el título.",
      "error"
    );

    return;
  }

  try {

    const existing =
      await getDoc(
        doc(
          db,
          "promotions",
          "mercadopago"
        )
      );

    const oldData =
      existing.exists()
        ? existing.data()
        : {};

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
          oldData.image ||
          "",
        updatedAt:
          new Date().toISOString()
      },
      {
        merge:
          true
      }
    );

    showMessage(
      "✅ Promoción de Mercado Pago guardada."
    );

  } catch (error) {

    console.error(
      error
    );

    showMessage(
      "❌ No se pudo guardar Mercado Pago.",
      "error"
    );
  }
}

// ========================================
// CONFIGURACIÓN GENERAL
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

    const mercado =
      document.getElementById(
        "generalMercadoLibre"
      );

    if (whatsapp) {

      whatsapp.value =
        data.whatsapp ||
        "";
    }

    if (mercado) {

      mercado.value =
        data.generalMercadoLibre ||
        "";
    }

  } catch (error) {

    console.error(
      error
    );
  }
}

async function saveSettings() {

  const whatsapp =
    document.getElementById(
      "whatsapp"
    )?.value.trim() ||
    "";

  const generalMercadoLibre =
    document.getElementById(
      "generalMercadoLibre"
    )?.value.trim() ||
    "";

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
          new Date().toISOString()
      },
      {
        merge:
          true
      }
    );

    showMessage(
      "✅ Configuración guardada."
    );

  } catch (error) {

    console.error(
      error
    );

    showMessage(
      "❌ No se pudo guardar la configuración.",
      "error"
    );
  }
}

// ========================================
// MÉTRICAS
// ========================================

async function getDailyStats(
  dateKey
) {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "statistics",
          `daily_${dateKey}`
        )
      );

    if (
      !snapshot.exists()
    ) {

      return {
        date:
          dateKey,
        visits:
          0,
        uniqueVisitors:
          0,
        clicks:
          0,
        copies:
          0,
        promotions:
          0
      };
    }

    const data =
      snapshot.data();

    return {

      date:
        dateKey,

      visits:
        Number(
          data.visits || 0
        ),

      uniqueVisitors:
        Number(
          data.uniqueVisitors ||
          0
        ),

      clicks:
        Number(
          data.clicks || 0
        ),

      copies:
        Number(
          data.copies || 0
        ),

      promotions:
        Number(
          data.promotions || 0
        )
    };

  } catch (error) {

    console.error(
      "Error leyendo estadísticas diarias:",
      error
    );

    return {
      date:
        dateKey,
      visits:
        0,
      uniqueVisitors:
        0,
      clicks:
        0,
      copies:
        0,
      promotions:
        0
    };
  }
}

// ========================================
// MÉTRICAS GENERALES
// ========================================

async function loadGeneralStats() {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "statistics",
          "general"
        )
      );

    if (
      !snapshot.exists()
    ) {
      return {};
    }

    return snapshot.data();

  } catch (error) {

    console.error(
      "Error leyendo estadísticas generales:",
      error
    );

    return {};
  }
}

// ========================================
// MÉTRICAS PRINCIPALES
// ========================================

async function loadStats() {

  try {

    const general =
      await loadGeneralStats();

    const todayKey =
      getMexicoDateKey();

    const today =
      await getDailyStats(
        todayKey
      );

    // ------------------------------------
    // ESTADÍSTICAS DE HOY
    // ------------------------------------

    const statVisits =
      document.getElementById(
        "statVisits"
      );

    const statUnique =
      document.getElementById(
        "statUnique"
      );

    const statClicks =
      document.getElementById(
        "statClicks"
      );

    const statCopies =
      document.getElementById(
        "statCopies"
      );

    const statPromotions =
      document.getElementById(
        "statPromotions"
      );

    const statSavings =
      document.getElementById(
        "statSavings"
      );

    if (statVisits) {

      statVisits.textContent =
        today.visits
          .toLocaleString(
            "es-MX"
          );
    }

    if (statUnique) {

      statUnique.textContent =
        today.uniqueVisitors
          .toLocaleString(
            "es-MX"
          );
    }

    if (statClicks) {

      statClicks.textContent =
        today.clicks
          .toLocaleString(
            "es-MX"
          );
    }

    if (statCopies) {

      statCopies.textContent =
        today.copies
          .toLocaleString(
            "es-MX"
          );
    }

    if (statPromotions) {

      statPromotions.textContent =
        today.promotions
          .toLocaleString(
            "es-MX"
          );
    }

    if (statSavings) {

      const savings =
        Number(
          general.savings ||
          0
        );

      statSavings.textContent =
        money(
          savings
        );
    }

    // ------------------------------------
    // RESUMEN DE LOS ÚLTIMOS 7 DÍAS
    // ------------------------------------

    const last7 =
      [];

    for (
      let i = 0;
      i < 7;
      i++
    ) {

      const dateKey =
        getPreviousDate(
          todayKey,
          i
        );

      const stats =
        i === 0
          ? today
          : await getDailyStats(
              dateKey
            );

      last7.push(
        stats
      );
    }

    renderMetricsSummary(
      last7
    );

  } catch (error) {

    console.error(
      "Error cargando estadísticas:",
      error
    );
  }
}

// ========================================
// RESUMEN MÉTRICAS
// ========================================

function renderMetricsSummary(
  days
) {

  const container =
    document.getElementById(
      "metricsSummary"
    );

  if (!container) return;

  const totals =
    days.reduce(
      (
        total,
        day
      ) => {

        total.visits +=
          Number(
            day.visits ||
            0
          );

        total.uniqueVisitors +=
          Number(
            day.uniqueVisitors ||
            0
          );

        total.clicks +=
          Number(
            day.clicks ||
            0
          );

        total.copies +=
          Number(
            day.copies ||
            0
          );

        total.promotions +=
          Number(
            day.promotions ||
            0
          );

        return total;

      },
      {
        visits:
          0,

        uniqueVisitors:
          0,

        clicks:
          0,

        copies:
          0,

        promotions:
          0
      }
    );

  const mostVisits =
    [...days].sort(
      (
        a,
        b
      ) =>
        b.visits -
        a.visits
    )[0];

  const mostUsers =
    [...days].sort(
      (
        a,
        b
      ) =>
        b.uniqueVisitors -
        a.uniqueVisitors
    )[0];

  container.innerHTML = `

    <div class="metrics-summary-grid">

      <div class="metric-summary-card">

        <span>
          📅 Últimos 7 días
        </span>

        <strong>
          ${totals.visits.toLocaleString(
            "es-MX"
          )}
        </strong>

        <small>
          visitas
        </small>

      </div>

      <div class="metric-summary-card">

        <span>
          👥 Usuarios
        </span>

        <strong>
          ${totals.uniqueVisitors.toLocaleString(
            "es-MX"
          )}
        </strong>

        <small>
          visitantes únicos
        </small>

      </div>

      <div class="metric-summary-card">

        <span>
          🖱️ Clics
        </span>

        <strong>
          ${totals.clicks.toLocaleString(
            "es-MX"
          )}
        </strong>

        <small>
          clics
        </small>

      </div>

      <div class="metric-summary-card">

        <span>
          🎟️ Cupones
        </span>

        <strong>
          ${totals.copies.toLocaleString(
            "es-MX"
          )}
        </strong>

        <small>
          copias
        </small>

      </div>

      <div class="metric-summary-card">

        <span>
          💳 Promociones
        </span>

        <strong>
          ${totals.promotions.toLocaleString(
            "es-MX"
          )}
        </strong>

        <small>
          clics
        </small>

      </div>

    </div>

    <div class="metrics-highlights">

      <div>

        <strong>
          📈 Más visitas
        </strong>

        <span>
          ${
            mostVisits
              ? formatDate(
                  mostVisits.date
                )
              : "-"
          }

          ·

          ${
            mostVisits
              ? mostVisits.visits
              : 0
          }
        </span>

      </div>

      <div>

        <strong>
          👥 Más usuarios
        </strong>

        <span>
          ${
            mostUsers
              ? formatDate(
                  mostUsers.date
                )
              : "-"
          }

          ·

          ${
            mostUsers
              ? mostUsers.uniqueVisitors
              : 0
          }
        </span>

      </div>

    </div>

  `;
}

// ========================================
// FORMULARIOS
// ========================================

function setupForms() {

  // ------------------------------------
  // OFERTAS
  // ------------------------------------

  const offerForm =
    document.getElementById(
      "offerForm"
    );

  if (offerForm) {

    offerForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        saveOffer();
      }
    );
  }

  // ------------------------------------
  // CUPONES
  // ------------------------------------

  const couponForm =
    document.getElementById(
      "couponForm"
    );

  if (couponForm) {

    couponForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        saveCoupon();
      }
    );
  }

  // ------------------------------------
  // CATEGORÍAS
  // ------------------------------------

  const categoryForm =
    document.getElementById(
      "categoryForm"
    );

  if (categoryForm) {

    categoryForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        saveCategory();
      }
    );
  }

  // ------------------------------------
  // MERCADO PAGO
  // ------------------------------------

  const mercadoForm =
    document.getElementById(
      "mercadoForm"
    );

  if (mercadoForm) {

    mercadoForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        saveMercadoPago();
      }
    );
  }

  // ------------------------------------
  // CONFIGURACIÓN
  // ------------------------------------

  const settingsForm =
    document.getElementById(
      "settingsForm"
    );

  if (settingsForm) {

    settingsForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        saveSettings();
      }
    );
  }

  // ------------------------------------
  // BANCO
  // ------------------------------------

  const saveBankButton =
    document.getElementById(
      "saveBankButton"
    );

  if (
    saveBankButton
  ) {

    saveBankButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        saveBank();
      }
    );
  }

  // ------------------------------------
  // ESTADO CUPÓN
  // ------------------------------------

  const statusButtons =
    document.querySelectorAll(
      ".coupon-status-buttons button"
    );

  const statusInput =
    document.getElementById(
      "couponStatus"
    );

  statusButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const status =
            button.dataset.status;

          if (
            statusInput
          ) {

            statusInput.value =
              status;
          }

          statusButtons.forEach(
            item => {

              item.classList.toggle(
                "active",
                item === button
              );
            }
          );
        }
      );
    }
  );

  // ------------------------------------
  // LOGOUT
  // ------------------------------------

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );

  if (
    logoutButton
  ) {

    logoutButton.addEventListener(
      "click",
      async () => {

        try {

          await signOut(
            auth
          );

        } catch (error) {

          console.error(
            error
          );

          showMessage(
            "❌ No se pudo cerrar sesión.",
            "error"
          );
        }
      }
    );
  }

  // ------------------------------------
  // TIPO DE AFILIADO
  // ------------------------------------

  const affiliateType =
    document.getElementById(
      "couponAffiliateType"
    );

  const couponLink =
    document.getElementById(
      "couponLink"
    );

  if (
    affiliateType &&
    couponLink
  ) {

    affiliateType.addEventListener(
      "change",
      () => {

        if (
          affiliateType.value ===
          "principal"
        ) {

          couponLink.value =
            MERCADO_LIBRE_AFILIADO_PRINCIPAL;
        }

        if (
          affiliateType.value ===
          "alternativo"
        ) {

          couponLink.value =
            MERCADO_LIBRE_AFILIADO_ALTERNATIVO;
        }
      }
    );
  }
}

// ========================================
// INICIALIZAR ADMIN
// ========================================

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

// ========================================
// AUTENTICACIÓN
// ========================================

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {
      return;
    }

    if (
      user.uid !==
      ADMIN_UID
    ) {

      console.warn(
        "Usuario no autorizado."
      );

      return;
    }

    const emailElement =
      document.getElementById(
        "adminUserEmail"
      );

    if (
      emailElement
    ) {

      emailElement.textContent =
        user.email ||
        "";
    }

    await initializeAdmin();
  }
);