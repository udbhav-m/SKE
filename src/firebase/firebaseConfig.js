import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfigDev = {
  apiKey: import.meta.env.VITE_DEV_API_KEY,
  authDomain: import.meta.env.VITE_DEV_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_DEV_PROJECT_ID,
  storageBucket: import.meta.env.VITE_DEV_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_DEV_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_DEV_APP_ID,
  measurementId: import.meta.env.VITE_DEV_MEASUREMENT_ID,
};

const firebaseConfigSKE = {
  apiKey: import.meta.env.VITE_SKE_TEST_API_KEY,
  authDomain: import.meta.env.VITE_SKE_TEST_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_SKE_TEST_PROJECT_ID,
  storageBucket: import.meta.env.VITE_SKE_TEST_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_SKE_TEST_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_SKE_TEST_APP_ID,
  measurementId: import.meta.env.VITE_SKE_TEST_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfigDev);
export const db = getFirestore(app);
