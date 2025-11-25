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

// Firebase configuration - All values must be set in .env file
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate that all required environment variables are set
const envVarMap = {
  apiKey: 'REACT_APP_FIREBASE_API_KEY',
  authDomain: 'REACT_APP_FIREBASE_AUTH_DOMAIN',
  databaseURL: 'REACT_APP_FIREBASE_DATABASE_URL',
  projectId: 'REACT_APP_FIREBASE_PROJECT_ID',
  storageBucket: 'REACT_APP_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'REACT_APP_FIREBASE_APP_ID',
  measurementId: 'REACT_APP_FIREBASE_MEASUREMENT_ID'
};

const missingVars = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => envVarMap[key]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(', ')}\n` +
    `Please create a .env file in the root directory with these variables. See .env.example for reference.`
  );
}

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

