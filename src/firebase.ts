import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBvSJYFSlHqBTNK6iG3Ae2U1D0e8_XAICc",
    authDomain: "bishtchat-4c044.firebaseapp.com",
    projectId: "bishtchat-4c044",
    storageBucket: "bishtchat-4c044.firebasestorage.app",
    messagingSenderId: "770040326024",
    appId: "1:770040326024:web:a6a1ac631d8a0c3d837c3d",
    measurementId: "G-DGE9REGQD9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider }; 