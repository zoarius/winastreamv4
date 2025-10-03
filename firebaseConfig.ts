import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// IMPORTANT : Votre configuration Firebase complète
const firebaseConfig = {
  apiKey: "AIzaSyCnb_4uaKHTRFV7E4sL1RjXu0QSUDsQ4rY",
  authDomain: "winastream.firebaseapp.com",
  databaseURL: "https://winastream-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "winastream",
  storageBucket: "winastream.firebasestorage.app",
  messagingSenderId: "850776036698",
  appId: "1:850776036698:web:eaedc9eca0b04d97674f63",
  measurementId: "G-FSXS6SCPB8"
};

// Initialisation de l'application Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Exportation de l'instance Firestore pour l'utiliser dans toute l'application
const db = getFirestore(app);

export { db };
