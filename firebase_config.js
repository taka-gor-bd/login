// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
