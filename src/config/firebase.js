import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBE9jeijT4PuPEgtW6kLetcFB-DBZAMT04",
  authDomain: "pengelolaan-sampah-d1ad4.firebaseapp.com",
  databaseURL: "https://pengelolaan-sampah-d1ad4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pengelolaan-sampah-d1ad4",
  storageBucket: "pengelolaan-sampah-d1ad4.firebasestorage.app",
  messagingSenderId: "950952151218",
  appId: "1:950952151218:android:0dcb65563cf702e37d21ab"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
