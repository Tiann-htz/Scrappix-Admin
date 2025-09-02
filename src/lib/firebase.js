// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBLBf_uQfwFZY5TSUO2QzRXcdygg6lJwGQ",
  authDomain: "scrappix-2e221.firebaseapp.com",
  databaseURL: "https://scrappix-2e221-default-rtdb.firebaseio.com",
  projectId: "scrappix-2e221",
  storageBucket: "scrappix-2e221.firebasestorage.app",
  messagingSenderId: "953243008024",
  appId: "1:953243008024:web:2babaad35212d85f68976d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;