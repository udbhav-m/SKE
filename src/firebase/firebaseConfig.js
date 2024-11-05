// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyCeVPbnwB6cP-65-cn_LrViX2Xvywz9M44",
//   authDomain: "abeventsdev.firebaseapp.com",
//   projectId: "abeventsdev",
//   storageBucket: "abeventsdev.appspot.com",
//   messagingSenderId: "377555664615",
//   appId: "1:377555664615:web:9c01bbe092b5b6f59cac42",
//   measurementId: "G-MJWRQ137QZ",
// };

const firebaseConfig = {
  apiKey: "AIzaSyDMtSrKBKSf6kz-PZoZc18V5GWW-wDaArQ",
  authDomain: "ske-test-5194c.firebaseapp.com",
  projectId: "ske-test-5194c",
  storageBucket: "ske-test-5194c.appspot.com",
  messagingSenderId: "126593584186",
  appId: "1:126593584186:web:e747ded97a86fade7ab903",
  measurementId: "G-SGDY5R7732"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
