import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Wait for auth token to be ready
          await firebaseUser.getIdToken(true);
          
          // Check if user is admin
          const adminDoc = await getDoc(doc(db, 'userAdmin', firebaseUser.uid));
          
          if (adminDoc.exists() && adminDoc.data().role === 'admin' && adminDoc.data().isActive) {
            setUser(firebaseUser);
            setAdminData(adminDoc.data());
          } else {
            setUser(null);
            setAdminData(null);
            await firebaseSignOut(auth);
          }
        } catch (error) {
          console.error('Auth context error:', error);
          setUser(null);
          setAdminData(null);
        }
      } else {
        setUser(null);
        setAdminData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setAdminData(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    adminData,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};