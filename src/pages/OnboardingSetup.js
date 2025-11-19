import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, checkUsernameAvailability, updateUsernameIndex } from '../services/db';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import '../style/onboarding/onboarding.css';

const OnboardingSetup = () => {
  const { currentUser, userData, fetchUserData } = useAuth();
  const navigate = useNavigate();
  
  // Profile Section
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [username, setUsername] = useState(userData?.profile?.username || userData?.username || '');
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking', 'available', 'taken', 'invalid'
  const [usernameError, setUsernameError] = useState('');
  const profilePicInputRef = useRef(null);
  
  // Basic Info Section
  const [firstName, setFirstName] = useState('');
  const [description, setDescription] = useState('');
  
  // Interests Section
  const [selectedInterests, setSelectedInterests] = useState([]);
  const availableInterests = [
    'Technology', 'Coding', 'NEET', 'JEE', 'Web Dev', 'Engineering',
    'Health', 'Fitness', 'Education', 'Career', 'Motivation', 'Entertainment'
  ];
  
  // Form State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingPic, setUploadingPic] = useState(false);
  
  // Disable body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
  // Debounce username check (300ms)
  useEffect(() => {
    if (!username || username.trim().length === 0) {
      setUsernameStatus(null);
      setUsernameError('');
      return;
    }
    
    // Validate format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setUsernameStatus('invalid');
      setUsernameError('Username must be 3-20 characters (letters, numbers, underscore only)');
      return;
    }
    
    setUsernameStatus('checking');
    setUsernameError('');
    
    const timeoutId = setTimeout(async () => {
      if (!currentUser) return;
      
      // Get current username from profile or userData for exclusion
      const currentUsername = userData?.profile?.username || userData?.username || '';
      
      const result = await checkUsernameAvailability(username.trim(), currentUser.uid);
      if (result.success) {
        // If username is same as current, treat as available
        if (username.trim() === currentUsername) {
          setUsernameStatus('available');
          setUsernameError('');
        } else if (result.available) {
          setUsernameStatus('available');
          setUsernameError('');
        } else {
          setUsernameStatus('taken');
          setUsernameError('Username is already taken');
        }
      } else {
        setUsernameStatus('invalid');
        setUsernameError('Error checking username availability');
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [username, currentUser, userData]);
  
  // Load existing user data if available
  useEffect(() => {
    if (userData) {
      const profile = userData.profile || userData;
      if (profile.firstName) setFirstName(profile.firstName);
      if (profile.description) setDescription(profile.description);
      if (profile.interests && Array.isArray(profile.interests)) {
        setSelectedInterests(profile.interests);
      }
      if (profile.profilePic || profile.avatar) {
        setProfilePic(profile.profilePic || profile.avatar);
      }
      if (profile.username) {
        setUsername(profile.username);
      }
    }
  }, [userData]);
  
  const handleProfilePicUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type (jpg, png, webp)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }
    
    setProfilePicFile(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveProfilePic = () => {
    setProfilePic(null);
    setProfilePicPreview(null);
    setProfilePicFile(null);
    if (profilePicInputRef.current) {
      profilePicInputRef.current.value = '';
    }
  };
  
  const handleInterestToggle = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };
  
  const isFormValid = () => {
    if (!username || username.trim().length === 0) return false;
    if (usernameStatus !== 'available') return false;
    if (!firstName || firstName.trim().length === 0) return false;
    if (firstName.length > 40) return false;
    if (description && description.length > 160) return false;
    if (uploadingPic) return false;
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isFormValid()) {
      setError('Please fill in all required fields correctly');
      return;
    }
    
    if (!currentUser) {
      setError('You must be logged in to complete setup');
      return;
    }
    
    setLoading(true);
    setUploadingPic(true);
    
    let profilePicUrl = profilePic;
    const oldUsername = userData?.profile?.username || userData?.username || '';
    
    try {
      // Upload profile picture if new file selected
      if (profilePicFile) {
        try {
          profilePicUrl = await uploadToCloudinary(profilePicFile);
        } catch (uploadError) {
          // Allow skip if upload fails
          console.error('Profile pic upload failed:', uploadError);
          setError('Failed to upload profile picture. You can skip it and continue.');
          setUploadingPic(false);
          setLoading(false);
          return;
        }
      }
      
      setUploadingPic(false);
      
      // Build profile object
      const profile = {
        username: username.trim(),
        firstName: firstName.trim(),
        description: description.trim() || '',
        interests: selectedInterests,
        profilePic: profilePicUrl || '',
        firstLoginCompleted: true,
        updatedAt: new Date().toISOString()
      };
      
      // Update username index (always check/update to ensure it exists)
      // If oldUsername is empty, this will create the index
      // If oldUsername is different, this will update the index
      // If oldUsername is same, this will skip (no-op)
      const indexResult = await updateUsernameIndex(oldUsername || '', username.trim(), currentUser.uid);
      if (!indexResult.success) {
        setError(indexResult.error || 'Username is already taken');
        setLoading(false);
        return;
      }
      
      // Save profile to Firebase
      const result = await updateUserProfile(currentUser.uid, profile);
      
      if (result.success) {
        // Update Firebase Auth displayName if username changed
        if (username.trim() !== oldUsername) {
          await updateProfile(auth.currentUser, {
            displayName: username.trim()
          });
        }
        
        // Refresh user data to update context
        await fetchUserData(currentUser.uid);
        
        // Wait a moment for AuthContext state to update
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Use window.location for hard redirect to ensure context is refreshed
        // This prevents redirect issues where OnboardingRoute still sees old profile data
        window.location.href = '/home';
      } else {
        setError(result.error || 'Failed to save your information. Please try again.');
      }
    } catch (err) {
      setError(`Failed to complete setup: ${err.message}`);
    } finally {
      setLoading(false);
      setUploadingPic(false);
    }
  };
  
  if (!currentUser) {
    return null; // OnboardingRoute will handle redirect
  }
  
  return (
    <div className="onboarding-modal-overlay">
      <div className="onboarding-modal-card">
        <div className="onboarding-modal-header">
          <h1>Welcome to Qconnect!</h1>
          <p>Let's set up your profile</p>
        </div>
        
        {error && <div className="onboarding-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="onboarding-modal-form">
          {/* Username */}
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <div className="username-input-wrapper">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
                minLength={3}
                maxLength={20}
                placeholder="Choose a username"
                className={usernameStatus === 'invalid' || usernameStatus === 'taken' ? 'input-error' : ''}
                autoFocus
              />
              {usernameStatus === 'checking' && (
                <span className="username-status checking">
                  <FontAwesomeIcon icon="fa-solid fa-spinner" spin />
                </span>
              )}
              {usernameStatus === 'available' && (
                <span className="username-status available">
                  <FontAwesomeIcon icon="fa-solid fa-check-circle" />
                </span>
              )}
              {usernameStatus === 'taken' && (
                <span className="username-status taken">
                  <FontAwesomeIcon icon="fa-solid fa-times-circle" />
                </span>
              )}
            </div>
            {usernameError && <div className="field-error">{usernameError}</div>}
            <div className="field-hint">letters, numbers, underscore — 3–20 chars</div>
          </div>
          
          {/* Profile Photo */}
          <div className="form-group">
            <label>Profile Photo</label>
            <div className="profile-pic-section">
              <div className="profile-pic-container">
                {(profilePicPreview || profilePic) ? (
                  <>
                    <img 
                      src={profilePicPreview || profilePic} 
                      alt="Profile preview" 
                      className="profile-pic-preview"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveProfilePic}
                      className="remove-profile-pic-btn"
                      title="Remove picture"
                    >
                      <FontAwesomeIcon icon="fa-solid fa-times" />
                    </button>
                  </>
                ) : (
                  <div className="profile-pic-placeholder">
                    <FontAwesomeIcon icon="fa-solid fa-user" size="2x" />
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => profilePicInputRef.current?.click()}
                className="upload-profile-pic-btn"
                disabled={loading}
              >
                <FontAwesomeIcon icon="fa-solid fa-image" />
                {profilePicPreview || profilePic ? 'Change Photo' : 'Upload Photo'}
              </button>
              
              <input
                ref={profilePicInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleProfilePicUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
          
          {/* First Name */}
          <div className="form-group">
            <label htmlFor="firstName">First Name *</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
              required
              minLength={1}
              maxLength={40}
              placeholder="Enter your first name"
            />
          </div>
          
          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              maxLength={160}
              rows="3"
              placeholder="Tell people what you do…"
            />
            <div className="char-count">{description.length}/160</div>
          </div>
          
          {/* Interests */}
          <div className="form-group">
            <label>Interests</label>
            <p className="section-hint">Select at least 1 interest (recommended)</p>
            <div className="interests-container">
              {availableInterests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`interest-chip ${selectedInterests.includes(interest) ? 'selected' : ''}`}
                  disabled={loading}
                >
                  {interest}
                  {selectedInterests.includes(interest) && (
                    <FontAwesomeIcon icon="fa-solid fa-check" />
                  )}
                </button>
              ))}
            </div>
            {selectedInterests.length > 0 && (
              <div className="interests-count">
                {selectedInterests.length} {selectedInterests.length === 1 ? 'interest' : 'interests'} selected
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="onboarding-modal-footer">
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className="submit-btn"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon="fa-solid fa-spinner" spin />
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingSetup;
