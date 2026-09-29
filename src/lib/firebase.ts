import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Official SK Pizza Point Firebase Project Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCCYR2QyIICr9wbS-P5X1m9860TSmmnHco",
  authDomain: "sk-pizza-point.firebaseapp.com",
  databaseURL: "https://sk-pizza-point-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sk-pizza-point",
  storageBucket: "sk-pizza-point.firebasestorage.app",
  messagingSenderId: "336176195310",
  appId: "1:336176195310:web:07deae497aa7772e7535ff",
  measurementId: "G-2PCKS90TDV"
};

export const AUTHORIZED_ADMIN_UID = "vxIlz4pYZgM646mXmp2BQuXtYz32";

// Initialize Firebase exactly once. If Firebase was already initialized by
// another module, reuse that app rather than creating a second instance.
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Services from the same app instance.
export const auth: Auth = getAuth(app);
export const rtdb: Database = getDatabase(app);
export const storage: FirebaseStorage = getStorage(app);

export const isUserAdmin = (uid: string | null | undefined, email?: string | null): boolean => {
  if (!uid && !email) return false;
  if (uid && uid.trim() === AUTHORIZED_ADMIN_UID.trim()) return true;
  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    if (
      cleanEmail === 'zyvoraofficial3@gmail.com' ||
      cleanEmail === 'skpizzapoint@gmail.com' ||
      cleanEmail.startsWith('admin@skpizza')
    ) {
      return true;
    }
  }
  return false;
};
