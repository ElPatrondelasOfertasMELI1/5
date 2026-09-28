// ========================================
// EL PATRÓN DE LAS OFERTAS
// GRÁFICAS DE ESTADÍSTICAS
// ========================================

import {
  auth,
  db
} from "../firebase-config.js";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  documentId
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// ========================================
// CONFIGURACIÓN
// ========================================

const ADMIN_UID =
  "XrkjAonD9tWUD6X1rWWJsaQsh9J2";

const MEXICO_TIME_ZONE =
  "America/Mexico_City";


// ========================================
// ESTADO
// ========================================

let dailyData = [];

let dailyChart = null;

let monthlyChart = null;

let currentDays = 30;


// ========================================
// ELEMENTOS
// ========================================

const loginSection =
  document.getElementById(
    "loginSection"
  );

const statsSection =
  document.getElementById(
    "statsSection"
  );

const loginForm =
  document.getElementById(
    "loginForm"
  );

const loginMessage =
  document.getElementById(
    "loginMessage"
  );

const statsMessage =
  document.getElementById(
    "statsMessage"
  );

const periodSelect =
  document.getElementById(
    "periodSelect"
  );

const refreshButton =
  document.getElementById(
    "refreshButton"
  );


// ========================================
// FECHA MÉXICO
// ========================================

function getMexicoDate() {

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        MEXICO_TIME_ZONE,

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit"
    }
  ).format(
    new Date()
  );

}


// ========================================
// CONVERTIR FECHA
// ========================================

function dateFromKey(
  dateKey
) {

  const parts =
    dateKey.split("-");

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );

}


// ========================================
// FORMATO FECHA
// ========================================

function formatDate(
  dateKey
) {

  const date =
    dateFromKey(
      dateKey
    );

  return date.toLocaleDateString(
    "es-MX",
    {
      day:
        "2-digit",

      month:
        "short"
    }
  );

}


// ========================================
// FORMATO MES
// ========================================

function formatMonth(
  year,
  month
) {

  const date =
    new Date(
      year,
      month - 1,
      1
    );

  return date.toLocaleDateString(
    "es-MX",
    {
      month:
        "short",

      year:
        "numeric"
    }
  );

}


// ========================================
// RESTAR DÍAS
// ========================================

function getDateKeyDaysAgo(
  daysAgo
) {

  const now =
    new Date();

  const parts =
    getMexicoDate()
      .split("-")
      .map(Number);

  const date =
    new Date(
      parts[0],
      parts[1] - 1,
      parts[2]
    );

  date.setDate(
    date.getDate() -
    daysAgo
  );

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;

}


// ========================================
// NUMERO SEGURO
// ========================================

function numberValue(
  value
) {

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;

}


// ========================================
// LOGIN
// ========================================

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const email =
      document.getElementById(
        "email"
      ).value.trim();

    const password =
      document.getElementById(
        "password"
      ).value;

    loginMessage.textContent =
      "🔄 Iniciando sesión...";

    loginMessage.className =
      "message loading";

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    } catch (error) {

      console.error(
        "Error iniciando sesión:",
        error
      );

      loginMessage.textContent =
        "❌ Correo o contraseña incorrectos.";

      loginMessage.className =
        "message error";

    }

  }
);


// ========================================
// VERIFICAR ADMIN
// ========================================

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      showLogin();

      return;

    }

    if (
      user.uid !==
      ADMIN_UID
    ) {

      loginMessage.textContent =
        "❌ Esta cuenta no tiene acceso administrativo.";

      loginMessage.className =
        "message error";

      await signOut(
        auth
      ).catch(
        () => {}
      );

      showLogin();

      return;

    }

    showStats();

    await loadStatistics();

  }
);


// ========================================
// MOSTRAR LOGIN
// ========================================

function showLogin() {

  loginSection.classList.remove(
    "hidden"
  );

  statsSection.classList.add(
    "hidden"
  );

}


// ========================================
// MOSTRAR ESTADÍSTICAS
// ========================================

function showStats() {

  loginSection.classList.add(
    "hidden"
  );

  statsSection.classList.remove(
    "hidden"
  );

}


// ========================================
// CARGAR ESTADÍSTICAS
// ========================================

async function loadStatistics() {

  setStatsMessage(
    "🔄 Cargando estadísticas..."
  );

  refreshButton.disabled =
    true;

  try {

    const startDate =
      getDateKeyDaysAgo(
        365
      );

    const endDate =
      getMexicoDate();

    const statisticsRef =
      collection(
        db,
        "statistics"
      );

    const statisticsQuery =
      query(
        statisticsRef,

        where(
          documentId(),
          ">=",
          `daily_${startDate}`
        ),

        where(
          documentId(),
          "<=",
          `daily_${endDate}`
        ),

        orderBy(
          documentId()
        )
      );

    const snapshot =
      await getDocs(
        statisticsQuery
      );

    dailyData =
      snapshot.docs
        .map(
          documentSnapshot => {

            const data =
              documentSnapshot.data();

            const id =
              documentSnapshot.id;

            const date =
              id.replace(
                "daily_",
                ""
              );

            return {

              date,

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
                )

            };

          }
        )
        .filter(
          item =>
            /^\d{4}-\d{2}-\d{2}$/
              .test(
                item.date
              )
        )
        .sort(
          (a, b) =>
            a.date.localeCompare(
              b.date
            )
        );


    renderSummary();

    renderDailyChart();

    renderMonthlyChart();

    renderDailyTable();

    setStatsMessage(
      `✅ Actualizado: ${new Date().toLocaleTimeString(
        "es-MX"
      )}`
    );

  } catch (error) {

    console.error(
      "Error cargando estadísticas:",
      error
    );

    setStatsMessage(
      "❌ No se pudieron cargar las estadísticas. Verifica tu sesión de administrador.",
      true
    );

  } finally {

    refreshButton.disabled =
      false;

  }

}


// ========================================
// RESUMEN
// ========================================

function renderSummary() {

  const today =
    getMexicoDate();

  const usersToday =
    getUsersForDate(
      today
    );

  const last7 =
    getLastDaysTotal(
      7
    );

  const last30 =
    getLastDaysTotal(
      30
    );

  const thisMonth =
    getCurrentMonthTotal();


  document.getElementById(
    "usersToday"
  ).textContent =
    formatNumber(
      usersToday
    );

  document.getElementById(
    "users7Days"
  ).textContent =
    formatNumber(
      last7
    );

  document.getElementById(
    "users30Days"
  ).textContent =
    formatNumber(
      last30
    );

  document.getElementById(
    "usersThisMonth"
  ).textContent =
    formatNumber(
      thisMonth
    );

}


// ========================================
// USUARIOS DE FECHA
// ========================================

function getUsersForDate(
  date
) {

  const item =
    dailyData.find(
      record =>
        record.date ===
        date
    );

  return numberValue(
    item?.users
  );

}


// ========================================
// TOTAL ÚLTIMOS DÍAS
// ========================================

function getLastDaysTotal(
  days
) {

  const startDate =
    getDateKeyDaysAgo(
      days - 1
    );

  const endDate =
    getMexicoDate();

  return dailyData
    .filter(
      item =>
        item.date >=
          startDate &&
        item.date <=
          endDate
    )
    .reduce(
      (
        total,
        item
      ) =>
        total +
        numberValue(
          item.users
        ),
      0
    );

}


// ========================================
// TOTAL MES ACTUAL
// ========================================

function getCurrentMonthTotal() {

  const today =
    getMexicoDate();

  const prefix =
    today.substring(
      0,
      7
    );

  return dailyData
    .filter(
      item =>
        item.date.startsWith(
          prefix
        )
    )
    .reduce(
      (
        total,
        item
      ) =>
        total +
        numberValue(
          item.users
        ),
      0
    );

}


// ========================================
// GRÁFICA DIARIA
// ========================================

function renderDailyChart() {

  const selected =
    Number(
      currentDays
    );

  const startDate =
    getDateKeyDaysAgo(
      selected - 1
    );

  const endDate =
    getMexicoDate();

  const records =
    dailyData.filter(
      item =>
        item.date >=
          startDate &&
        item.date <=
          endDate
    );


  const labels =
    records.map(
      item =>
        formatDate(
          item.date
        )
    );

  const users =
    records.map(
      item =>
        numberValue(
          item.users
        )
    );


  const canvas =
    document.getElementById(
      "dailyChart"
    );

  if (
    dailyChart
  ) {

    dailyChart.destroy();

  }


  dailyChart =
    new Chart(
      canvas,
      {
        type:
          "line",

        data:
          {
            labels,

            datasets:
              [
                {
                  label:
                    "Usuarios",

                  data:
                    users,

                  tension:
                    0.35,

                  fill:
                    true,

                  borderWidth:
                    3,

                  pointRadius:
                    4,

                  pointHoverRadius:
                    6
                }
              ]
          },

        options:
          {

            responsive:
              true,

            maintainAspectRatio:
              false,

            interaction:
              {
                intersect:
                  false,

                mode:
                  "index"
              },

            plugins:
              {

                legend:
                  {
                    display:
                      false
                  },

                tooltip:
                  {
                    callbacks:
                      {

                        label:
                          context =>
                            ` Usuarios: ${formatNumber(
                              context.parsed.y
                            )}`

                      }
                  }

              },

            scales:
              {

                y:
                  {
                    beginAtZero:
                      true,

                    ticks:
                      {
                        precision:
                          0
                      }
                  }

              }

          }

      }
    );


  document.getElementById(
    "dailyDescription"
  ).textContent =
    `Últimos ${selected} días`;

}


// ========================================
// GRÁFICA MENSUAL
// ========================================

function renderMonthlyChart() {

  const months =
    {};

  dailyData.forEach(
    item => {

      const prefix =
        item.date.substring(
          0,
          7
        );

      if (!months[prefix]) {

        months[prefix] =
          0;

      }

      months[prefix] +=
        numberValue(
          item.users
        );

    }
  );


  const sortedMonths =
    Object.keys(
      months
    )
      .sort();


  const lastMonths =
    sortedMonths.slice(
      -12
    );


  const labels =
    lastMonths.map(
      key => {

        const [
          year,
          month
        ] =
          key
            .split("-")
            .map(Number);

        return formatMonth(
          year,
          month
        );

      }
    );


  const values =
    lastMonths.map(
      key =>
        months[key]
    );


  const canvas =
    document.getElementById(
      "monthlyChart"
    );


  if (
    monthlyChart
  ) {

    monthlyChart.destroy();

  }


  monthlyChart =
    new Chart(
      canvas,
      {

        type:
          "bar",

        data:
          {

            labels,

            datasets:
              [
                {
                  label:
                    "Usuarios",

                  data:
                    values,

                  borderWidth:
                    1

                }
              ]

          },

        options:
          {

            responsive:
              true,

            maintainAspectRatio:
              false,

            plugins:
              {

                legend:
                  {
                    display:
                      false
                  },

                tooltip:
                  {

                  callbacks:
                    {

                      label:
                        context =>
                          ` Usuarios: ${formatNumber(
                            context.parsed.y
                          )}`

                    }

                  }

              },

            scales:
              {

                y:
                  {

                    beginAtZero:
                      true,

                    ticks:
                      {

                        precision:
                          0

                      }

                  }

              }

          }

      }
    );

}


// ========================================
// TABLA
// ========================================

function renderDailyTable() {

  const tbody =
    document.getElementById(
      "dailyTable"
    );

  const selected =
    Number(
      currentDays
    );

  const startDate =
    getDateKeyDaysAgo(
      selected - 1
    );

  const endDate =
    getMexicoDate();

  const records =
    dailyData
      .filter(
        item =>
          item.date >=
            startDate &&
          item.date <=
            endDate
      )
      .sort(
        (a, b) =>
          b.date.localeCompare(
            a.date
          )
      );


  if (!records.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="3">
          No hay datos registrados.
        </td>
      </tr>
    `;

    return;

  }


  tbody.innerHTML =
    records
      .map(
        item => `

          <tr>

            <td>
              ${formatFullDate(
                item.date
              )}
            </td>

            <td>
              <strong>
                ${formatNumber(
                  item.users
                )}
              </strong>
            </td>

            <td>
              ${formatNumber(
                item.visits
              )}
            </td>

          </tr>

        `
      )
      .join("");

}


// ========================================
// FORMATO FECHA COMPLETA
// ========================================

function formatFullDate(
  dateKey
) {

  const date =
    dateFromKey(
      dateKey
    );

  return date.toLocaleDateString(
    "es-MX",
    {
      weekday:
        "short",

      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric"
    }
  );

}


// ========================================
// FORMATO NÚMEROS
// ========================================

function formatNumber(
  value
) {

  return numberValue(
    value
  ).toLocaleString(
    "es-MX"
  );

}


// ========================================
// MENSAJE
// ========================================

function setStatsMessage(
  message,
  error = false
) {

  if (!statsMessage) return;

  statsMessage.textContent =
    message;

  statsMessage.className =
    error
      ? "stats-message error"
      : "stats-message";

}


// ========================================
// CAMBIO DE PERÍODO
// ========================================

periodSelect.addEventListener(
  "change",
  () => {

    currentDays =
      Number(
        periodSelect.value
      );

    renderDailyChart();

    renderDailyTable();

  }
);


// ========================================
// ACTUALIZAR
// ========================================

refreshButton.addEventListener(
  "click",
  async () => {

    await loadStatistics();

  }
);
