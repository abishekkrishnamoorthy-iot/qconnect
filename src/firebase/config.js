import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// Clear corrupted Firebase localStorage data if present
const clearCorruptedFirebaseData = () => {
  if (typeof window === 'undefined' || !localStorage) return;
  
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('firebase:') || 
        key.includes('firebase') || 
        key.includes('qconnect-88535') ||
        key.startsWith('firebase_')
      )) {
        // Try to parse the value - if it fails, it's corrupted
        try {
          const value = localStorage.getItem(key);
          if (value) {
            JSON.parse(value);
          }
        } catch (parseError) {
          // This key has corrupted JSON data, remove it
          keysToRemove.push(key);
        }
      }
    }
    
    if (keysToRemove.length > 0) {
      console.warn(`Clearing ${keysToRemove.length} corrupted Firebase localStorage keys...`);
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('Cleared corrupted Firebase localStorage data');
    }
  } catch (error) {
    console.error('Error checking Firebase localStorage:', error);
  }
};

// Clear corrupted data before initializing Firebase
clearCorruptedFirebaseData();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAMlp2h9oXgknTBOxizLhAJeGEIAtDZt-k",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "qconnect-88535.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://qconnect-88535-default-rtdb.firebaseio.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "qconnect-88535",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "qconnect-88535.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1005448923998",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1005448923998:web:11b17af6b2b9cea155ddcf",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-1CGDL13XHV"
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

