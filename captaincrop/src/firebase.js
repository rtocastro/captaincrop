// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6grAyPfikGZxX9-w7LaT-nfwGwJdv_9w",
  authDomain: "captaincrop-4207d.firebaseapp.com",
  projectId: "captaincrop-4207d",
  storageBucket: "captaincrop-4207d.firebasestorage.app",
  messagingSenderId: "377269059521",
  appId: "1:377269059521:web:c34009b383869305053940",
  measurementId: "G-94KXCRFZMM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);