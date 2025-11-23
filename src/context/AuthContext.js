import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { ref, set, get, update } from 'firebase/database';
import { database } from '../firebase/config';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Sign up function
  const signup = async (email, password, username) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const timestamp = new Date().toISOString();
      const sanitizedUsername = username?.trim() || '';

      // Update Firebase Auth profile with username
      await updateProfile(user, {
        displayName: sanitizedUsername
      });

      // Create user entry in Realtime Database (basic fields)
      const userRef = ref(database, `users/${user.uid}`);
      await set(userRef, {
        uid: user.uid,
        email,
        username: sanitizedUsername,
        displayName: sanitizedUsername,
        followerCount: 0,
        followingCount: 0,
        createdAt: timestamp,
        authProvider: 'password',
        auth: {
          providers: ['password'],
          emailVerified: false,
          lastVerificationCheck: timestamp
        },
        preferences: {
          theme: 'system',
          language: 'en',
          region: 'global'
        },
        account: {
          status: 'active',
          deletionRequestedAt: null
        }
      });

      // Create username index for fast lookup
      const usernameIndexRef = ref(database, `usernames/${sanitizedUsername}`);
      await set(usernameIndexRef, user.uid);

      // Create empty profile with firstLoginCompleted: false
      const profileRef = ref(database, `users/${user.uid}/profile`);
      await set(profileRef, {
        username: sanitizedUsername,
        displayName: sanitizedUsername,
        firstName: '',
        bio: '',
        description: '',
        interests: [],
        profilePic: '',
        bannerPic: '',
        firstLoginCompleted: false,
        updatedAt: timestamp
      });

      // Fetch user data to return it and update context state
      // We need to fetch manually since onAuthStateChanged might not have fired yet
      // Reuse existing userRef and profileRef since they point to the same paths
      const profileSnapshot = await get(profileRef);
      const userSnapshot = await get(userRef);
      
      let fetchedUserData = null;
      if (userSnapshot.exists()) {
        fetchedUserData = userSnapshot.val();
        if (profileSnapshot.exists()) {
          fetchedUserData.profile = profileSnapshot.val();
        }
      }
      
      // Manually update context state to ensure it's available immediately
      // This ensures OnboardingRoute has the data it needs
      // Note: onAuthStateChanged will also fire and update state, but we do this
      // to ensure state is available immediately after signup
      setCurrentUser(user);
      setAuthReady(true);
      if (fetchedUserData) {
        setUserData(fetchedUserData);
        setProfileLoaded(true);
      } else {
        // If userData fetch failed, still set profileLoaded to prevent infinite loading
        setProfileLoaded(true);
      }
      // Note: Don't set loading to false here - onAuthStateChanged will handle it

      return { success: true, user, userData: fetchedUserData };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  // Login function - we'll need to find user by email or username
  const login = async (emailOrUsername, password) => {
    try {
      // Try to login with email first
      let email = emailOrUsername;
      
      // If it's not an email format, try to find user by username
      if (!emailOrUsername.includes('@')) {
        // Search for user by username in database
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
          const users = snapshot.val();
          const foundUser = Object.values(users).find(
            user => user.username === emailOrUsername
          );
          
          if (foundUser) {
            email = foundUser.email;
          } else {
            return { success: false, error: 'User not found' };
          }
        } else {
          return { success: false, error: 'User not found' };
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign in with Google function
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in database
      const userRef = ref(database, `users/${user.uid}`);
      const userSnapshot = await get(userRef);

      if (!userSnapshot.exists()) {
        // First-time Google user - create user entry
        const firstName = user.displayName ? user.displayName.split(' ')[0] : '';
        const timestamp = new Date().toISOString();
        
        // Create user entry in Realtime Database
        await set(userRef, {
          uid: user.uid,
          email: user.email,
          username: '',
          displayName: user.displayName || '',
          followerCount: 0,
          followingCount: 0,
          createdAt: timestamp,
          authProvider: 'google',
          auth: {
            providers: ['google'],
            emailVerified: true,
            lastVerificationCheck: timestamp
          },
          preferences: {
            theme: 'system',
            language: 'en',
            region: 'global'
          },
          account: {
            status: 'active',
            deletionRequestedAt: null
          }
        });

        // Create profile with auto-filled data from Google
        const profileRef = ref(database, `users/${user.uid}/profile`);
        await set(profileRef, {
          username: '', // Empty initially, must be set in onboarding
          displayName: user.displayName || '',
          firstName: firstName,
          bio: '',
          description: '',
          interests: [],
          profilePic: user.photoURL || '',
          bannerPic: '',
          firstLoginCompleted: false,
          updatedAt: timestamp
        });
      } else {
        // Returning user - update profile picture if changed
        const userData = userSnapshot.val();
        const profileRef = ref(database, `users/${user.uid}/profile`);
        const profileSnapshot = await get(profileRef);
        
        if (profileSnapshot.exists()) {
          const profile = profileSnapshot.val();
          // Update profile picture if Google account has a new one
          if (user.photoURL && user.photoURL !== profile.profilePic) {
            await set(profileRef, {
              ...profile,
              profilePic: user.photoURL,
              updatedAt: new Date().toISOString()
            });
          }
        }

        // Update authProvider if not set
        if (!userData.authProvider) {
          await update(userRef, {
            authProvider: 'google'
          });
        }

        // Ensure auth metadata tracks Google linkage & verification
        const existingProviders = new Set(userData.auth?.providers || []);
        if (!existingProviders.has('google') || userData.auth?.emailVerified !== true) {
          existingProviders.add('google');
          await update(userRef, {
            auth: {
              ...(userData.auth || {}),
              providers: Array.from(existingProviders),
              emailVerified: true,
              lastVerificationCheck: new Date().toISOString()
            }
          });
        }
      }

      // Fetch user data to return it
      const fetchedUserData = await fetchUserData(user.uid);

      return { success: true, user, userData: fetchedUserData };
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed popup - not really an error
        return { success: false, error: null };
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        return { 
          success: false, 
          error: 'An account with this email already exists. Please sign in with your password.' 
        };
      } else if (error.code === 'auth/popup-blocked') {
        return { 
          success: false, 
          error: 'Popup was blocked. Please allow popups for this site and try again.' 
        };
      } else if (error.code === 'auth/network-request-failed') {
        return { 
          success: false, 
          error: 'Network error. Please check your connection and try again.' 
        };
      } else {
        return { 
          success: false, 
          error: error.message || 'Authentication failed. Please try again.' 
        };
      }
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserData(null);
      return { success: true };
    } catch (error) {
      console.error('Signout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Fetch user data from database
  const fetchUserData = async (uid) => {
    try {
      // Check users/<uid>/profile first
      const profileRef = ref(database, `users/${uid}/profile`);
      const profileSnapshot = await get(profileRef);
      
      // Check users/<uid> for root user data
      const userRef = ref(database, `users/${uid}`);
      const userSnapshot = await get(userRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        
        // Merge profile data if exists
        if (profileSnapshot.exists()) {
          userData.profile = profileSnapshot.val();
        }
        
        // If this user matches currentUser, update state
        if (currentUser && currentUser.uid === uid) {
          setUserData(userData);
          setProfileLoaded(true);
        }
        
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthReady(true);
      setCurrentUser(user);
      
      if (user) {
        // Fetch user data from database
        const data = await fetchUserData(user.uid);
        setUserData(data);
        setProfileLoaded(true);
      } else {
        setUserData(null);
        setProfileLoaded(true);
      }
      
      // Only set loading to false after both auth is ready AND profile is loaded
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    signup,
    login,
    signInWithGoogle,
    signOut,
    fetchUserData,
    loading,
    authReady,
    profileLoaded
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

