// Import Firebase core + required services
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration from Jun Wei
const firebaseConfig = {
<<<<<<< Updated upstream
  apiKey: "AIzaSyDh0v1iR1zHq1U0P-BEQXHiYEsys0o3nMI",
  authDomain: "meal-planner-b7e64.firebaseapp.com",
  databaseURL: "https://meal-planner-b7e64-default-rtdb.firebaseio.com",
  projectId: "meal-planner-b7e64",
  storageBucket: "meal-planner-b7e64.firebasestorage.app",
  messagingSenderId: "81058674749",
  appId: "1:81058674749:web:8a0df7eda06da992081254",
  measurementId: "G-TH15G7VKN0"
=======
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
>>>>>>> Stashed changes
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export the services used in your project
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { app, auth, db, analytics };
