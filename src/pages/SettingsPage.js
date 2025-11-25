import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Header from '../components/common/Header';
import '../style/profile/settings.css';
import { useAuth } from '../context/AuthContext';
import { mergeUserProfile, getInterestPool, addInterestToPool, requestAccountDeletion } from '../services/userSettings';
import { checkUsernameAvailability, updateUsernameIndex } from '../services/db';
import { auth } from '../firebase/config';
import { reload, sendEmailVerification, updateProfile as updateAuthProfile } from 'firebase/auth';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

const DEFAULT_INTERESTS = [
  'Technology',
  'Engineering',
  'Design',
  'Education',
  'Career',
  'Business',
  'AI/ML',
  'Health',
  'Finance',
  'Productivity',
  'Leadership',
  'Programming',
];

const SettingsPage = () => {
  const { currentUser, userData, fetchUserData, signOut: signOutUser } = useAuth();
  const [interestOptions, setInterestOptions] = useState(DEFAULT_INTERESTS);
  const [customInterest, setCustomInterest] = useState('');
  const [form, setForm] = useState({
    username: '',
    bio: '',
    description: '',
    interests: [],
  });
  const originalUsernameRef = useRef('');
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState('');
  const [deletionFeedback, setDeletionFeedback] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [profilePicMessage, setProfilePicMessage] = useState('');
  const [profilePicError, setProfilePicError] = useState('');
  const profilePicInputRef = useRef(null);

  const profileData = userData?.profile || {};
  const interestsLimit = 12;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const pool = await getInterestPool();
      if (pool.success && isMounted && pool.data.length) {
        const merged = Array.from(new Set([...DEFAULT_INTERESTS, ...pool.data]));
        setInterestOptions(merged);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!userData) return;
    const username = profileData.username || userData.username || currentUser?.displayName || '';
    originalUsernameRef.current = username;
    setForm({
      username,
      bio: profileData.bio || '',
      description: profileData.description || '',
      interests: Array.isArray(profileData.interests) ? profileData.interests : [],
    });
    setProfilePicUrl(profileData.profilePic || '');
    setUsernameStatus('clean');
    setUsernameMessage('');
  }, [userData, profileData, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const trimmed = form.username.trim();
    if (!trimmed) {
      setUsernameStatus('invalid');
      setUsernameMessage('Username is required');
      return;
    }

    if (trimmed === originalUsernameRef.current) {
      setUsernameStatus('clean');
      setUsernameMessage('');
      return;
    }

    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!regex.test(trimmed)) {
      setUsernameStatus('invalid');
      setUsernameMessage('Use 3-20 letters, numbers, underscores');
      return;
    }

    setUsernameStatus('checking');
    setUsernameMessage('Checking availability…');

    const handle = setTimeout(async () => {
      const result = await checkUsernameAvailability(trimmed, currentUser.uid);
      if (result.success && result.available) {
        setUsernameStatus('available');
        setUsernameMessage('Username available');
      } else if (result.success) {
        setUsernameStatus('taken');
        setUsernameMessage('Username already taken');
      } else {
        setUsernameStatus('invalid');
        setUsernameMessage(result.error || 'Unable to check username');
      }
    }, 400);

    return () => clearTimeout(handle);
  }, [form.username, currentUser]);

  const emailProviders = useMemo(
    () => currentUser?.providerData?.map((provider) => provider.providerId) || [],
    [currentUser]
  );

  const isPasswordUser = emailProviders.includes('password');
  // Check both Firebase Auth emailVerified and database auth.emailVerified
  // Database emailVerified is set when user verifies via OTP
  // Priority: database auth.emailVerified (from OTP) > Firebase Auth emailVerified
  const isEmailVerified = userData?.auth?.emailVerified ?? currentUser?.emailVerified ?? false;
  const showVerificationBanner = isPasswordUser && !isEmailVerified;
  const accountStatus = userData?.account?.status || 'active';
  const deletionRequestedAt = userData?.account?.deletionRequestedAt;

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInterestToggle = (interest) => {
    setForm((prev) => {
      const exists = prev.interests.includes(interest);
      if (exists) {
        return { ...prev, interests: prev.interests.filter((item) => item !== interest) };
      }
      if (prev.interests.length >= interestsLimit) {
        setProfileFeedback(`You can select up to ${interestsLimit} interests.`);
        return prev;
      }
      return { ...prev, interests: [...prev.interests, interest] };
    });
  };

  const handleCustomInterestSubmit = async (event) => {
    event.preventDefault();
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    if (form.interests.includes(trimmed)) {
      setCustomInterest('');
      return;
    }
    if (form.interests.length >= interestsLimit) {
      setProfileFeedback(`You can select up to ${interestsLimit} interests.`);
      return;
    }

    handleInterestToggle(trimmed);
    setCustomInterest('');
    setInterestOptions((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    await addInterestToPool(trimmed);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    const trimmedUsername = form.username.trim();

    if (!trimmedUsername) {
      setProfileFeedback('Username is required.');
      return;
    }

    if (
      trimmedUsername !== originalUsernameRef.current &&
      usernameStatus !== 'available'
    ) {
      setProfileFeedback('Please choose an available username.');
      return;
    }

    setSavingProfile(true);
    setProfileFeedback('');

    try {
      if (trimmedUsername !== originalUsernameRef.current) {
        const indexResult = await updateUsernameIndex(
          originalUsernameRef.current || '',
          trimmedUsername,
          currentUser.uid
        );
        if (!indexResult.success) {
          throw new Error(indexResult.error || 'Username is already taken');
        }
      }

      const profilePayload = {
        username: trimmedUsername,
        displayName: trimmedUsername,
        bio: form.bio.trim(),
        description: form.description.trim(),
        interests: form.interests,
        lastEditedFrom: 'settings',
      };

      const result = await mergeUserProfile(currentUser.uid, profilePayload);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      if (trimmedUsername !== (currentUser.displayName || '')) {
        await updateAuthProfile(auth.currentUser, { displayName: trimmedUsername });
        await reload(auth.currentUser);
      }

      await fetchUserData(currentUser.uid);
      originalUsernameRef.current = trimmedUsername;
      setUsernameStatus('clean');
      setProfileFeedback('Profile saved successfully.');
      setTimeout(() => setProfileFeedback(''), 4000);
    } catch (error) {
      setProfileFeedback(error.message || 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const resetProfilePicFeedback = () => {
    setProfilePicError('');
    setProfilePicMessage('');
  };

  const handleProfilePicUpload = async (event) => {
    if (!currentUser) return;
    const file = event.target.files?.[0];
    if (!file) return;

    resetProfilePicFeedback();

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setProfilePicError('Please select a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setProfilePicError('Image must be smaller than 10MB.');
      event.target.value = '';
      return;
    }

    setProfilePicUploading(true);

    try {
      const uploadedUrl = await uploadToCloudinary(file);
      await mergeUserProfile(currentUser.uid, {
        profilePic: uploadedUrl,
        lastEditedFrom: 'settings'
      });

      if (auth.currentUser) {
        await updateAuthProfile(auth.currentUser, { photoURL: uploadedUrl });
      }

      await fetchUserData(currentUser.uid);
      setProfilePicUrl(uploadedUrl);
      setProfilePicMessage('Profile photo updated.');
    } catch (error) {
      console.error('Profile photo upload failed:', error);
      setProfilePicError('Failed to update profile photo. Please try again.');
    } finally {
      setProfilePicUploading(false);
      if (profilePicInputRef.current) {
        profilePicInputRef.current.value = '';
      }
    }
  };

  const handleProfilePicRemove = async () => {
    if (!currentUser || !profilePicUrl) return;
    resetProfilePicFeedback();
    setProfilePicUploading(true);

    try {
      await mergeUserProfile(currentUser.uid, {
        profilePic: '',
        lastEditedFrom: 'settings'
      });

      if (auth.currentUser) {
        await updateAuthProfile(auth.currentUser, { photoURL: null });
      }

      await fetchUserData(currentUser.uid);
      setProfilePicUrl('');
      setProfilePicMessage('Profile photo removed.');
    } catch (error) {
      console.error('Profile photo removal failed:', error);
      setProfilePicError('Failed to remove photo. Please try again.');
    } finally {
      setProfilePicUploading(false);
    }
  };

  const handleSendVerification = async () => {
    if (!currentUser) return;
    setVerificationFeedback('Sending verification email…');
    try {
      await sendEmailVerification(currentUser);
      setVerificationFeedback('Verification email sent. Please check your inbox.');
      setTimeout(async () => {
        if (auth.currentUser) {
          await reload(auth.currentUser);
        }
        setVerificationFeedback('');
      }, 6000);
    } catch (error) {
      setVerificationFeedback(error.message || 'Failed to send verification email.');
    }
  };

  const handleRequestDeletion = async () => {
    if (!currentUser) return;
    const confirmed = window.confirm(
      'This will schedule your account for deletion. Continue?'
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    setDeletionFeedback('');

    try {
      const result = await requestAccountDeletion(currentUser.uid, {
        email: currentUser.email,
        reason: 'user_requested',
      });
      if (!result.success) {
        throw new Error(result.error || 'Failed to request deletion');
      }
      await fetchUserData(currentUser.uid);
      setDeletionFeedback(
        'Deletion requested. You will be signed out while we process the request.'
      );
      await signOutUser();
    } catch (error) {
      setDeletionFeedback(error.message || 'Failed to request deletion.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="settings-page">
      <div className="settings-header-wrapper">
        <Header />
      </div>
      <div className="settings-scroll-area">
        <div className="settings-body">
          <div className="settings-layout">
          <aside className="settings-profile-card">
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="profile-avatar">
                  {profilePicUrl ? (
                    <img src={profilePicUrl} alt="Profile" />
                  ) : (
                    <FontAwesomeIcon icon="fa-solid fa-user" size="2x" />
                  )}
                </div>
                <div>
                  <p className="profile-card-username">{form.username || 'Anonymous'}</p>
                  <p className="profile-card-email">{currentUser.email}</p>
                </div>
              </div>

              <div className="profile-card-meta">
                <div>
                  <p className="meta-label">Followers</p>
                  <p className="meta-value">{userData?.followerCount || 0}</p>
                </div>
                <div>
                  <p className="meta-label">Following</p>
                  <p className="meta-value">{userData?.followingCount || 0}</p>
                </div>
                <div>
                  <p className="meta-label">Interests</p>
                  <p className="meta-value">{form.interests.length}</p>
                </div>
              </div>

              <button
                className="profile-card-save"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </aside>

          <section className="settings-panels-column">
            <section className="settings-panel">
              <header>
                <h2>Profile</h2>
                <p>Update how others see you across Qconnect.</p>
              </header>

              <div className="form-control profile-photo-field">
                <label>Profile photo</label>
                <div className="profile-photo-content">
                  <div className="profile-photo-preview">
                    {profilePicUrl ? (
                      <img src={profilePicUrl} alt="Profile preview" />
                    ) : (
                      <FontAwesomeIcon icon="fa-solid fa-user" size="lg" />
                    )}
                  </div>
                  <div className="profile-photo-actions">
                    <div className="profile-photo-buttons">
                      <button
                        type="button"
                        className="profile-photo-btn primary"
                        onClick={() => profilePicInputRef.current?.click()}
                        disabled={profilePicUploading}
                      >
                        {profilePicUploading ? 'Uploading…' : 'Change photo'}
                      </button>
                      <button
                        type="button"
                        className="profile-photo-btn ghost"
                        onClick={handleProfilePicRemove}
                        disabled={profilePicUploading || !profilePicUrl}
                      >
                        Remove
                      </button>
                    </div>
                    <p className="field-hint">JPG, PNG, WebP up to 10MB.</p>
                    {profilePicError && (
                      <div className="settings-feedback error">{profilePicError}</div>
                    )}
                    {profilePicMessage && !profilePicError && (
                      <div className="settings-feedback compact">{profilePicMessage}</div>
                    )}
                  </div>
                </div>
                <input
                  ref={profilePicInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleProfilePicUpload}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="form-control">
                <label htmlFor="username">Username</label>
                <div className={`input-with-status ${usernameStatus}`}>
                  <input
                    id="username"
                    type="text"
                    value={form.username}
                    onChange={(e) => handleFieldChange('username', e.target.value)}
                    maxLength={20}
                    autoComplete="off"
                  />
                  <span className="status-icon">
                    {usernameStatus === 'checking' && <FontAwesomeIcon icon="fa-solid fa-spinner" spin />}
                    {usernameStatus === 'available' && <FontAwesomeIcon icon="fa-solid fa-circle-check" />}
                    {usernameStatus === 'taken' && <FontAwesomeIcon icon="fa-solid fa-circle-xmark" />}
                  </span>
                </div>
                {usernameMessage && <p className="field-hint">{usernameMessage}</p>}
              </div>

              <div className="form-control">
                <label htmlFor="bio">Bio</label>
                <input
                  id="bio"
                  type="text"
                  maxLength={80}
                  value={form.bio}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  placeholder="Short headline (80 characters)"
                />
                <span className="char-count">{form.bio.length}/80</span>
              </div>

              <div className="form-control">
                <label htmlFor="description">About</label>
                <textarea
                  id="description"
                  rows={4}
                  maxLength={280}
                  value={form.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Tell the community more about you (max 280 characters)"
                />
                <span className="char-count">{form.description.length}/280</span>
              </div>

              <div className="form-control">
                <label>Interests</label>
                <p className="field-hint">
                  Choose topics you care about (up to {interestsLimit}).
                </p>
                <div className="interest-grid">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest}
                      className={`interest-chip ${
                        form.interests.includes(interest) ? 'selected' : ''
                      }`}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                    >
                      {interest}
                      {form.interests.includes(interest) && (
                        <FontAwesomeIcon icon="fa-solid fa-check" />
                      )}
                    </button>
                  ))}
                </div>
                <form className="interest-add" onSubmit={handleCustomInterestSubmit}>
                  <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    placeholder="Add custom interest"
                    maxLength={24}
                  />
                  <button type="submit">Add</button>
                </form>
              </div>
            </section>

            <section className="settings-panel">
            <header>
              <h2>Account</h2>
              <p>Manage verification and status.</p>
            </header>

            <div className="account-row">
              <div>
                <p className="account-label">Email</p>
                <p className="account-value">{currentUser.email}</p>
              </div>
              <div className={`badge ${isEmailVerified ? 'success' : 'warning'}`}>
                {isEmailVerified ? 'Verified' : 'Not verified'}
              </div>
            </div>

            {showVerificationBanner && (
              <div className="verification-banner">
                <p>Your email isn’t verified yet.</p>
                <button onClick={handleSendVerification}>Send verification email</button>
              </div>
            )}
            {verificationFeedback && (
              <div className="settings-feedback">{verificationFeedback}</div>
            )}

            <div className="account-row">
              <div>
                <p className="account-label">Account status</p>
                <p className="account-value">
                  {accountStatus === 'pending_deletion'
                    ? 'Pending deletion'
                    : 'Active'}
                </p>
                {deletionRequestedAt && (
                  <span className="field-hint">
                    Requested on {new Date(deletionRequestedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            </section>

            <section className="settings-panel danger">
              <header>
                <h2>Danger zone</h2>
                <p>Delete your account and associated content.</p>
              </header>

              {deletionFeedback && (
                <div className="settings-feedback">{deletionFeedback}</div>
              )}

              <button
                className="danger-btn"
                onClick={handleRequestDeletion}
                disabled={accountStatus === 'pending_deletion' || deleteLoading}
              >
                {accountStatus === 'pending_deletion'
                  ? 'Deletion requested'
                  : deleteLoading
                    ? 'Requesting…'
                    : 'Delete my account'}
              </button>
            </section>
          </section>
        </div>
      </div>
    </div>
  </div>
  );
};

export default SettingsPage;

