// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0nwj-qooOderNiLvmILB-gIPouy2HG4c",
  authDomain: "takagorbd.firebaseapp.com",
  databaseURL: "https://takagorbd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "takagorbd",
  storageBucket: "takagorbd.firebasestorage.app",
  messagingSenderId: "531548262665",
  appId: "1:531548262665:web:85fb34ea635dae7ddc43d8",
  measurementId: "G-TZB0NHKYGY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

// Constants
export const REFERRER_BONUS = 50;
export const REFERRAL_BONUS = 20;
export const WELCOME_BONUS = 50;
export const TOKEN_PRICE_BDT = 5;

export { app, analytics, auth, database };
