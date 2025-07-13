import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; 

const firebaseConfigDev = {
  apiKey: import.meta.env.VITE_DEV_API_KEY,
  authDomain: import.meta.env.VITE_DEV_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_DEV_PROJECT_ID,
  storageBucket: import.meta.env.VITE_DEV_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_DEV_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_DEV_APP_ID,
  measurementId: import.meta.env.VITE_DEV_MEASUREMENT_ID,
};

const firebaseConfigProd = {
  apiKey: import.meta.env.VITE_PROD_API_KEY,
  authDomain: import.meta.env.VITE_PROD_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_PROD_DATABASE_URL,
  projectId: import.meta.env.VITE_PROD_PROJECT_ID,
  storageBucket: import.meta.env.VITE_PROD_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_PROD_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_PROD_APP_ID,
  measurementId: import.meta.env.VITE_PROD_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfigDev);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);  