import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAtejTnh_Alkj7_TWWM790ewBCitBQT1KE",
  authDomain: "meal-planner-b7e64.firebaseapp.com",
  databaseURL: "https://meal-planner-b7e64-default-rtdb.firebaseio.com",
  projectId: "meal-planner-b7e64",
  storageBucket: "meal-planner-b7e64.firebasestorage.app",
  messagingSenderId: "81058674749",
  appId: "1:81058674749:web:4aebce63c29d6a43081254",
  measurementId: "G-4R355V3PX9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { app, auth, db, analytics };
