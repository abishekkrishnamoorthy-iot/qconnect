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
import { 
  createPendingUser, 
  movePendingUserToVerified,
  verifyPendingUserOTP as verifyOTP,
  updatePendingUserOTP
} from '../services/db';
import { 
  sendVerificationEmail, 
  generateOTP, 
  generateExpiryTime, 
  getExpiryTimestamp 
} from '../utils/emailService';

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

  // Sign up function - Creates pending user and sends verification email
  const signup = async (email, password, username) => {
    try {
      // Generate OTP and expiry
      const otpCode = generateOTP();
      const expiryTimestamp = getExpiryTimestamp(10); // 10 minutes
      const expiryTime = generateExpiryTime(10);
      const sanitizedUsername = username?.trim() || '';

      // Create pending user in database
      const pendingUserResult = await createPendingUser(
        email,
        password,
        sanitizedUsername,
        otpCode,
        expiryTimestamp
      );

      if (!pendingUserResult.success) {
        return { success: false, error: pendingUserResult.error || 'Failed to create pending user' };
      }

      // Send verification email via EmailJS
      const emailResult = await sendVerificationEmail(
        email,
        otpCode,
        expiryTime,
        sanitizedUsername || 'there'
      );

      if (!emailResult.success) {
        // If email fails, we still return success with tempUserId
        // User can resend email from verification page
        console.warn('Email sending failed, but pending user created:', emailResult.error);
      }

      // Return tempUserId instead of user - user will be created after verification
      return { 
        success: true, 
        tempUserId: pendingUserResult.tempUserId,
        email,
        emailSent: emailResult.success
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  // Verify OTP and move pending user to verified users
  const verifyEmail = async (tempUserId, otp) => {
    try {
      // Verify OTP
      const verifyResult = await verifyOTP(tempUserId, otp);
      
      if (!verifyResult.success || !verifyResult.valid) {
        return { 
          success: false, 
          error: verifyResult.error || 'Invalid verification code',
          remainingAttempts: verifyResult.remainingAttempts,
          locked: verifyResult.locked,
          expired: verifyResult.expired
        };
      }

      // Move pending user to verified users (creates Firebase Auth account)
      const moveResult = await movePendingUserToVerified(tempUserId);
      
      if (!moveResult.success) {
        return { success: false, error: moveResult.error || 'Failed to verify account' };
      }

      // Update context state
      setCurrentUser(moveResult.user);
      setAuthReady(true);
      
      // Fetch fresh user data to ensure emailVerified status is updated
      const freshUserData = await fetchUserData(moveResult.user.uid);
      if (freshUserData) {
        setUserData(freshUserData);
        setProfileLoaded(true);
      } else if (moveResult.userData) {
        // Fallback to returned userData if fetch fails
        setUserData(moveResult.userData);
        setProfileLoaded(true);
      }

      return { 
        success: true, 
        user: moveResult.user, 
        userData: freshUserData || moveResult.userData
      };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: error.message };
    }
  };

  // Resend verification email
  const resendVerificationEmail = async (tempUserId) => {
    try {
      // Import here to avoid circular dependency
      const { getPendingUser } = await import('../services/db');
      
      const pendingUserResult = await getPendingUser(tempUserId);
      
      if (!pendingUserResult.success) {
        return { success: false, error: 'Pending user not found' };
      }

      const pendingUser = pendingUserResult.data;
      
      // Generate new OTP and expiry
      const newOtpCode = generateOTP();
      const newExpiryTimestamp = getExpiryTimestamp(10); // 10 minutes
      const newExpiryTime = generateExpiryTime(10);

      // Update pending user with new OTP
      const updateResult = await updatePendingUserOTP(
        tempUserId,
        newOtpCode,
        newExpiryTimestamp
      );

      if (!updateResult.success) {
        return { success: false, error: updateResult.error || 'Failed to update OTP' };
      }

      // Send new verification email
      const emailResult = await sendVerificationEmail(
        pendingUser.email,
        newOtpCode,
        newExpiryTime,
        pendingUser.username || 'there'
      );

      if (!emailResult.success) {
        return { success: false, error: emailResult.error || 'Failed to send email' };
      }

      return { success: true };
    } catch (error) {
      console.error('Resend verification email error:', error);
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
    verifyEmail,
    resendVerificationEmail,
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

