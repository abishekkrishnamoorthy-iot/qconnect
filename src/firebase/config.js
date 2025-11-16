import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMlp2h9oXgknTBOxizLhAJeGEIAtDZt-k",
  authDomain: "qconnect-88535.firebaseapp.com",
  databaseURL: "https://qconnect-88535-default-rtdb.firebaseio.com",
  projectId: "qconnect-88535",
  storageBucket: "qconnect-88535.firebasestorage.app",
  messagingSenderId: "1005448923998",
  appId: "1:1005448923998:web:11b17af6b2b9cea155ddcf",
  measurementId: "G-1CGDL13XHV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;

