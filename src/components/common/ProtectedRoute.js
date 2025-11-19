import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { currentUser, userData, loading, authReady, profileLoaded } = useAuth();

  // Show loading spinner until auth and profile are loaded
  if (loading || !authReady || (currentUser && !profileLoaded)) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if first login is completed (check both profile.firstLoginCompleted and setupComplete for backward compatibility)
  const firstLoginCompleted = userData?.profile?.firstLoginCompleted || userData?.setupComplete === true;

  // If user data is loaded and setup is not complete, redirect to setup
  if (userData && !firstLoginCompleted) {
    return <Navigate to="/setup" replace />;
  }

  // Show protected content if authenticated and setup is complete
  return children;
};

export default ProtectedRoute;

