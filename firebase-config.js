// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCDRmy9I_3yWC1ojcpQo-rEbA1sZ6uW8v8",
  authDomain: "el-patron-de-las-ofertas-1c069.firebaseapp.com",
  projectId: "el-patron-de-las-ofertas-1c069",
  storageBucket: "el-patron-de-las-ofertas-1c069.firebasestorage.app",
  messagingSenderId: "220432878169",
  appId: "1:220432878169:web:56df6517f7b4d3cb5abf48"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Authentication
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app);

// App principal
export { app };