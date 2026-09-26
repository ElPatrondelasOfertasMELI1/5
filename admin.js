// ========================================
// EL PATRÓN DE LAS OFERTAS
// ADMIN.JS - FIREBASE
// ========================================

import { auth, db } from "./firebase-config.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// ========================================
// CONFIGURACIÓN
// ========================================

const ADMIN_UID = "XrkjAonD9tWUD6X1rWWJsaQsh9J2";


// ========================================
// ELEMENTOS
// ========================================

const offersList =
  document.getElementById("offersList");

const couponsList =
  document.getElementById("couponsList");

const categoriesList =
  document.getElementById("categoriesList");

const offerForm =
  document.getElementById("offerForm");

const couponForm =
  document.getElementById("couponForm");

const categoryForm =
  document.getElementById("categoryForm");

const mercadoForm =
  document.getElementById("mercadoForm");

const settingsForm =
  document.getElementById("settingsForm");

const adminMessage =
  document.getElementById("adminMessage");


// ========================================
// MENSAJES
// ========================================

function showMessage(message, type = "success") {

  if (!adminMessage) return;

  adminMessage.textContent = message;

  adminMessage.className =
    `admin-message ${type}`;

  adminMessage.style.display = "block";

  setTimeout(() => {

    adminMessage.style.display = "none";

  }, 3500);
}


// ========================================
// COMPROBAR ADMIN
// ========================================

async function checkAdmin() {

  const user = auth.currentUser;

  if (!user) {
    return false;
  }

  if (user.uid !== ADMIN_UID) {

    showMessage(
      "❌ Esta cuenta no tiene permisos de administrador.",
      "error"
    );

    return false;
  }

  try {

    const adminRef =
      doc(db, "admins", user.uid);

    const adminSnap =
      await getDoc(adminRef);

    if (!adminSnap.exists()) {

      showMessage(
        "❌ Tu usuario no está registrado como administrador.",
        "error"
      );

      return false;
    }

    const data = adminSnap.data();

    if (data.role !== "admin") {

      showMessage(
        "❌ Tu cuenta no tiene rol de administrador.",
        "error"
      );

      return false;
    }

    return true;

  } catch (error) {

    console.error(error);

    showMessage(
      "❌ No se pudo verificar el administrador.",
      "error"
    );

    return false;
  }
}


// ========================================
// FORMATO DE PRECIO
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
// CARGAR ESTADÍSTICAS
// ========================================

async function loadStats() {

  try {

    const statsRef =
      doc(db, "statistics", "general");

    const statsSnap =
      await getDoc(statsRef);

    const stats =
      statsSnap.exists()
        ? statsSnap.data()
        : {};

    const visits =
      document.getElementById("statVisits");

    const unique =
      document.getElementById("statUnique");

    const clicks =
      document.getElementById("statClicks");

    const copies =
      document.getElementById("statCopies");

    const promotions =
      document.getElementById("statPromotions");

    const savings =
      document.getElementById("statSavings");


    if (visits)
      visits.textContent =
        stats.visits || 0;

    if (unique)
      unique.textContent =
        stats.uniqueVisitors || 0;

    if (clicks)
      clicks.textContent =
        stats.clicks || 0;

    if (copies)
      copies.textContent =
        stats.copies || 0;

    if (promotions)
      promotions.textContent =
        stats.promotions || 0;

    if (savings)
      savings.textContent =
        money(stats.savings || 0);

  } catch (error) {

    console.error(
      "Error cargando estadísticas:",
      error
    );

  }

}


// ========================================
// OFERTAS
// ========================================

async function loadOffers() {

  if (!offersList) return;

  offersList.innerHTML =
    "<p>⏳ Cargando ofertas...</p>";

  try {

    const snapshot =
      await getDocs(
        collection(db, "offers")
      );

    offersList.innerHTML = "";

    if (snapshot.empty) {

      offersList.innerHTML =
        "<p>📭 No hay ofertas todavía.</p>";

      return;
    }

    snapshot.forEach((item) => {

      const offer =
        item.data();

      const id =
        item.id;

      const oldPrice =
        Number(offer.oldPrice || 0);

      const price =
        Number(offer.price || 0);

      let discount = 0;

      if (oldPrice > 0 && price > 0) {

        discount =
          Math.round(
            ((oldPrice - price) /
              oldPrice) * 100
          );

      }

      const card =
        document.createElement("div");

      card.className =
        "admin-item";

      card.innerHTML = `

        <div class="admin-item-info">

          ${
            offer.image
              ? `<img
                   src="${escapeHTML(offer.image)}"
                   alt=""
                   class="admin-item-image"
                 >`
              : ""
          }

          <div>

            <h3>
              ${escapeHTML(offer.name || "Sin nombre")}
            </h3>

            <p>
              ${money(oldPrice)}
              →
              <strong>${money(price)}</strong>
            </p>

            <small>
              ${discount}% OFF ·
              ${offer.clicks || 0} clics
            </small>

          </div>

        </div>

        <div class="admin-item-actions">

          <button
            class="btn-danger"
            data-delete-offer="${id}"
          >
            🗑️ Eliminar
          </button>

        </div>

      `;

      offersList.appendChild(card);

    });

    document
      .querySelectorAll("[data-delete-offer]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () =>
            deleteOffer(
              button.dataset.deleteOffer
            )
        );

      });

  } catch (error) {

    console.error(error);

    offersList.innerHTML =
      "<p>❌ Error cargando ofertas.</p>";
  }

}


// ========================================
// ELIMINAR OFERTA
// ========================================

async function deleteOffer(id) {

  if (!confirm(
    "¿Eliminar esta oferta?"
  )) {
    return;
  }

  try {

    await deleteDoc(
      doc(db, "offers", id)
    );

    showMessage(
      "✅ Oferta eliminada."
    );

    await loadOffers();

  } catch (error) {

    console.error(error);

    showMessage(
      "❌ No se pudo eliminar.",
      "error"
    );

  }

}


// ========================================
// AGREGAR OFERTA
// ========================================

if (offerForm) {

  offerForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (!(await checkAdmin())) {
        return;
      }

      const name =
        document.getElementById(
          "offerName"
        ).value.trim();

      const image =
        document.getElementById(
          "offerImage"
        ).value.trim();

      const oldPrice =
        Number(
          document.getElementById(
            "offerOldPrice"
          ).value
        );

      const price =
        Number(
          document.getElementById(
            "offerPrice"
          ).value
        );

      const link =
        document.getElementById(
          "offerLink"
        ).value.trim();


      try {

        await addDoc(
          collection(db, "offers"),
          {

            name,
            image,
            oldPrice,
            price,
            link,

            clicks: 0,

            active: true,

            createdAt:
              serverTimestamp()

          }
        );


        offerForm.reset();

        showMessage(
          "🔥 Oferta agregada correctamente."
        );

        await loadOffers();

      } catch (error) {

        console.error(error);

        showMessage(
          "❌ No se pudo guardar la oferta.",
          "error"
        );

      }

    }
  );

}


// ========================================
// CUPONES
// ========================================

async function loadCoupons() {

  if (!couponsList) return;

  couponsList.innerHTML =
    "<p>⏳ Cargando cupones...</p>";

  try {

    const snapshot =
      await getDocs(
        collection(db, "coupons")
      );

    couponsList.innerHTML = "";

    if (snapshot.empty) {

      couponsList.innerHTML =
        "<p>📭 No hay cupones todavía.</p>";

      return;
    }


    snapshot.forEach((item) => {

      const coupon =
        item.data();

      const id =
        item.id;

      const card =
        document.createElement("div");

      card.className =
        "admin-item";

      card.innerHTML = `

        <div class="admin-item-info">

          <div>

            <h3>
              🎟️ ${escapeHTML(
                coupon.code || ""
              )}
            </h3>

            <p>
              ${escapeHTML(
                coupon.discount || ""
              )}
            </p>

            <small>

              Compra mínima:
              ${money(
                coupon.minimumPurchase || 0
              )}

              · Máximo:
              ${money(
                coupon.maximumDiscount || 0
              )}

              · Copias:
              ${coupon.copies || 0}

            </small>

          </div>

        </div>

        <div class="admin-item-actions">

          <button
            class="btn-danger"
            data-delete-coupon="${id}"
          >
            🗑️ Eliminar
          </button>

        </div>

      `;

      couponsList.appendChild(card);

    });


    document
      .querySelectorAll("[data-delete-coupon]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () =>
            deleteCoupon(
              button.dataset.deleteCoupon
            )
        );

      });

  } catch (error) {

    console.error(error);

    couponsList.innerHTML =
      "<p>❌ Error cargando cupones.</p>";

  }

}


// ========================================
// ELIMINAR CUPÓN
// ========================================

async function deleteCoupon(id) {

  if (!confirm(
    "¿Eliminar este cupón?"
  )) {
    return;
  }

  try {

    await deleteDoc(
      doc(db, "coupons", id)
    );

    showMessage(
      "✅ Cupón eliminado."
    );

    await loadCoupons();

  } catch (error) {

    console.error(error);

    showMessage(
      "❌ No se pudo eliminar.",
      "error"
    );

  }

}


// ========================================
// AGREGAR CUPÓN
// ========================================

if (couponForm) {

  couponForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (!(await checkAdmin())) {
        return;
      }

      const code =
        document.getElementById(
          "couponCode"
        ).value
          .trim()
          .toUpperCase();

      const section =
        document.getElementById(
          "couponSection"
        ).value;

      const discount =
        document.getElementById(
          "couponDiscount"
        ).value.trim();

      const minimumPurchase =
        Number(
          document.getElementById(
            "couponMin"
          ).value || 0
        );

      const maximumDiscount =
        Number(
          document.getElementById(
            "couponMax"
          ).value || 0
        );

      const link =
        document.getElementById(
          "couponLink"
        ).value.trim();


      try {

        await addDoc(
          collection(db, "coupons"),
          {

            code,

            section,

            discount,

            minimumPurchase,

            maximumDiscount,

            link,

            copies: 0,

            active: true,

            createdAt:
              serverTimestamp()

          }
        );


        couponForm.reset();

        showMessage(
          "🎟️ Cupón agregado correctamente."
        );

        await loadCoupons();

      } catch (error) {

        console.error(error);

        showMessage(
          "❌ No se pudo guardar el cupón.",
          "error"
        );

      }

    }
  );

}


// ========================================
// CATEGORÍAS
// ========================================

async function loadCategories() {

  if (!categoriesList) return;

  categoriesList.innerHTML =
    "<p>⏳ Cargando categorías...</p>";

  try {

    const snapshot =
      await getDocs(
        collection(db, "categories")
      );

    categoriesList.innerHTML = "";

    if (snapshot.empty) {

      categoriesList.innerHTML =
        "<p>📭 No hay categorías.</p>";

      return;
    }


    snapshot.forEach((item) => {

      const category =
        item.data();

      const id =
        item.id;

      const card =
        document.createElement("div");

      card.className =
        "admin-item";

      card.innerHTML = `

        <div>

          <h3>
            ${escapeHTML(
              category.emoji || "📂"
            )}
            ${escapeHTML(
              category.name || ""
            )}
          </h3>

        </div>

        <button
          class="btn-danger"
          data-delete-category="${id}"
        >
          🗑️ Eliminar
        </button>

      `;

      categoriesList.appendChild(card);

    });


    document
      .querySelectorAll("[data-delete-category]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () =>
            deleteCategory(
              button.dataset.deleteCategory
            )
        );

      });

  } catch (error) {

    console.error(error);

    categoriesList.innerHTML =
      "<p>❌ Error cargando categorías.</p>";

  }

}


// ========================================
// ELIMINAR CATEGORÍA
// ========================================

async function deleteCategory(id) {

  if (!confirm(
    "¿Eliminar esta categoría?"
  )) {
    return;
  }

  try {

    await deleteDoc(
      doc(db, "categories", id)
    );

    showMessage(
      "✅ Categoría eliminada."
    );

    await loadCategories();

  } catch (error) {

    console.error(error);

    showMessage(
      "❌ No se pudo eliminar.",
      "error"
    );

  }

}


// ========================================
// AGREGAR CATEGORÍA
// ========================================

if (categoryForm) {

  categoryForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (!(await checkAdmin())) {
        return;
      }

      const name =
        document.getElementById(
          "categoryName"
        ).value.trim();

      const emoji =
        document.getElementById(
          "categoryEmoji"
        ).value.trim();


      try {

        await addDoc(
          collection(db, "categories"),
          {

            name,

            emoji,

            active: true,

            createdAt:
              serverTimestamp()

          }
        );


        categoryForm.reset();

        showMessage(
          "📂 Categoría agregada."
        );

        await loadCategories();

      } catch (error) {

        console.error(error);

        showMessage(
          "❌ No se pudo guardar la categoría.",
          "error"
        );

      }

    }
  );

}


// ========================================
// MERCADO PAGO
// ========================================

async function loadMercadoPago() {

  try {

    const reference =
      doc(
        db,
        "promotions",
        "mercadopago"
      );

    const snapshot =
      await getDoc(reference);

    if (!snapshot.exists()) {
      return;
    }

    const data =
      snapshot.data();

    document.getElementById(
      "mpTitle"
    ).value =
      data.title || "";

    document.getElementById(
      "mpText"
    ).value =
      data.text || "";

    document.getElementById(
      "mpImage"
    ).value =
      data.image || "";

    document.getElementById(
      "mpLink"
    ).value =
      data.link || "";

  } catch (error) {

    console.error(error);

  }

}


if (mercadoForm) {

  mercadoForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (!(await checkAdmin())) {
        return;
      }

      try {

        await setDoc(
          doc(
            db,
            "promotions",
            "mercadopago"
          ),
          {

            title:
              document.getElementById(
                "mpTitle"
              ).value.trim(),

            text:
              document.getElementById(
                "mpText"
              ).value.trim(),

            image:
              document.getElementById(
                "mpImage"
              ).value.trim(),

            link:
              document.getElementById(
                "mpLink"
              ).value.trim(),

            active: true,

            updatedAt:
              serverTimestamp()

          },
          {
            merge: true
          }
        );


        showMessage(
          "💳 Promoción guardada."
        );

      } catch (error) {

        console.error(error);

        showMessage(
          "❌ No se pudo guardar la promoción.",
          "error"
        );

      }

    }
  );

}


// ========================================
// CONFIGURACIÓN
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

    if (!snapshot.exists()) {
      return;
    }

    const data =
      snapshot.data();

    document.getElementById(
      "whatsapp"
    ).value =
      data.whatsapp || "";

    document.getElementById(
      "generalMercadoLibre"
    ).value =
      data.generalMercadoLibre || "";

  } catch (error) {

    console.error(error);

  }

}


if (settingsForm) {

  settingsForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (!(await checkAdmin())) {
        return;
      }

      try {

        await setDoc(
          doc(
            db,
            "settings",
            "general"
          ),
          {

            whatsapp:
              document.getElementById(
                "whatsapp"
              ).value.trim(),

            generalMercadoLibre:
              document.getElementById(
                "generalMercadoLibre"
              ).value.trim(),

            updatedAt:
              serverTimestamp()

          },
          {
            merge: true
          }
        );


        showMessage(
          "⚙️ Configuración guardada."
        );

      } catch (error) {

        console.error(error);

        showMessage(
          "❌ No se pudo guardar.",
          "error"
        );

      }

    }
  );

}


// ========================================
// PESTAÑAS
// ========================================

document
  .querySelectorAll(".admin-tab")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".admin-tab")
          .forEach((item) => {

            item.classList.remove(
              "active"
            );

          });

        document
          .querySelectorAll(".admin-panel")
          .forEach((panel) => {

            panel.classList.remove(
              "active"
            );

          });


        button.classList.add("active");

        const target =
          document.getElementById(
            button.dataset.tab
          );

        if (target) {
          target.classList.add("active");
        }

      }
    );

  });


// ========================================
// SEGURIDAD HTML
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
// INICIALIZAR PANEL
// ========================================

async function initializeAdmin() {

  const valid =
    await checkAdmin();

  if (!valid) {
    return;
  }

  await Promise.all([

    loadStats(),

    loadOffers(),

    loadCoupons(),

    loadCategories(),

    loadMercadoPago(),

    loadSettings()

  ]);

}


// Esperar a que Firebase tenga
// disponible el usuario autenticado.

const unsubscribe =
  auth.onAuthStateChanged
    ? auth.onAuthStateChanged(
        async (user) => {

          if (user) {

            await initializeAdmin();

          }

        }
      )
    : null;