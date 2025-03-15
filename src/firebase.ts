import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
      apiKey: "AIzaSyCD8C_rakbHHYi905ppY-FLAiE5EG5b1pE",
      authDomain: "beastchat-dcbbe.firebaseapp.com",
      projectId: "beastchat-dcbbe",
      storageBucket: "beastchat-dcbbe.firebasestorage.app",
      messagingSenderId: "594364356279",
      appId: "1:594364356279:web:4d8247454c59005c21df32",
      measurementId: "G-XVLNLY82CS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider }; 
