import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyC7BQ-bJhL1l3unGkD7Sp6fS_3IjM2FHyM",
  authDomain: "biyahele.firebaseapp.com",
  projectId: "biyahele",
  storageBucket: "biyahele.appspot.com",
  messagingSenderId: "408752331833",
  appId: "1:408752331833:web:62069f1708d6cb360c01e8",
  measurementId: "G-XRRZDH7XYR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services your app will use
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
