import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUsername: (username: string) => Promise<boolean>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  updateProfilePicture: (photoURL: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      // If user doesn't exist in Firestore, create a new document
      if (!userDoc.exists()) {
        // Generate a unique username based on email
        const baseUsername = user.email?.split('@')[0] || 'user';
        const timestamp = Date.now().toString().slice(-4);
        const username = `${baseUsername}_${timestamp}`;
        
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          username: username,
          createdAt: new Date(),
        });
        
        // Update the user profile with the username
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            displayName: username
          });
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      // Query Firestore to check if username exists
      const usersRef = doc(db, 'usernames', username);
      const docSnap = await getDoc(usersRef);
      return !docSnap.exists();
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  const updateUsername = async (username: string): Promise<boolean> => {
    try {
      if (!currentUser) return false;
      
      // Check if username is available
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) return false;
      
      // Update username in user document
      await setDoc(doc(db, 'users', currentUser.uid), {
        username
      }, { merge: true });
      
      // Reserve the username
      await setDoc(doc(db, 'usernames', username), {
        uid: currentUser.uid
      });
      
      // Update profile
      await updateProfile(currentUser, {
        displayName: username
      });
      
      return true;
    } catch (error) {
      console.error('Error updating username:', error);
      return false;
    }
  };

  const updateProfilePicture = async (photoURL: string): Promise<boolean> => {
    try {
      if (!currentUser) return false;
      
      // Update photoURL in user document
      await setDoc(doc(db, 'users', currentUser.uid), {
        photoURL
      }, { merge: true });
      
      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        photoURL
      });
      
      return true;
    } catch (error) {
      console.error('Error updating profile picture:', error);
      return false;
    }
  };

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    logout,
    updateUsername,
    checkUsernameAvailability,
    updateProfilePicture
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 