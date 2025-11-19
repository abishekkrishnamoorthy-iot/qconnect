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

