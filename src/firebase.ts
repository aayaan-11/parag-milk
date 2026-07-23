import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Web app's Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyBXzehkWrOvZ-F54rl-d192VdxHLyTDkng",
  authDomain: "parag-milk-3f4f9.firebaseapp.com",
  projectId: "parag-milk-3f4f9",
  storageBucket: "parag-milk-3f4f9.firebasestorage.app",
  messagingSenderId: "341509832167",
  appId: "1:341509832167:web:891b74f90837d467bc5142"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with robust multi-tab persistent cache support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
