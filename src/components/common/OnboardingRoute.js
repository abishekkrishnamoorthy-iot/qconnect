import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OnboardingSetup from '../../pages/OnboardingSetup';
import LoadingSpinner from './LoadingSpinner';

const OnboardingRoute = () => {
  const { currentUser, userData, loading, authReady, profileLoaded } = useAuth();

  // Show loading spinner until auth and profile are loaded
  if (loading || !authReady || (currentUser && !profileLoaded)) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If user data not loaded yet, wait
  if (!userData) {
    return <LoadingSpinner />;
  }

  // Check if first login is completed (check both profile.firstLoginCompleted and setupComplete for backward compatibility)
  const firstLoginCompleted = userData?.profile?.firstLoginCompleted || userData?.setupComplete === true;

  // If setup is complete, redirect to home
  if (firstLoginCompleted) {
    return <Navigate to="/home" replace />;
  }

  // Show onboarding if setup is not complete
  return <OnboardingSetup />;
};

export default OnboardingRoute;

