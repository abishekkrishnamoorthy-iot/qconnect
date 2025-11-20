import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../../context/AuthContext';
import { createGroup } from '../../services/db';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';
import '../../style/group/createGroupModal.css';

const Creategrp = ({ onGroupCreated, onClose }) => {
  const { currentUser, userData, fetchUserData } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [privacy, setPrivacy] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [localUserData, setLocalUserData] = useState(null);
  
  // Banner and icon state
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  const bannerInputRef = useRef(null);
  const iconInputRef = useRef(null);

  // Fetch user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        setUserDataLoading(true);
        try {
          // Use fetchUserData from context if available, otherwise use userData
          let fetchedData = userData;
          if (fetchUserData && (!userData || !userData.profile)) {
            fetchedData = await fetchUserData(currentUser.uid);
          }
          setLocalUserData(fetchedData);
        } catch (err) {
          console.error('Error loading user data:', err);
          setLocalUserData(userData);
        } finally {
          setUserDataLoading(false);
        }
      } else {
        setUserDataLoading(false);
      }
    };

    loadUserData();
  }, [currentUser, fetchUserData, userData]);

  // Compute display values with proper fallbacks
  const displayUsername = useMemo(() => {
    if (userDataLoading) return '';
    const data = localUserData || userData;
    return data?.profile?.username || data?.username || currentUser?.displayName || 'Unknown User';
  }, [localUserData, userData, currentUser, userDataLoading]);

  const displayAvatar = useMemo(() => {
    if (userDataLoading) return null;
    const data = localUserData || userData;
    return data?.profile?.profilePic || data?.profilePic || currentUser?.photoURL || null;
  }, [localUserData, userData, currentUser, userDataLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check rate limit for group creation
    const { checkGroupCreateRateLimit } = await import('../../utils/rateLimit');
    const rateLimitCheck = checkGroupCreateRateLimit(currentUser.uid);
    if (!rateLimitCheck.allowed) {
      setError(`Please wait ${rateLimitCheck.waitTime} seconds before creating another group`);
      return;
    }

    // Import validation utilities
    const { validateGroupName, validateGroupDescription, validateGroupCategory, validateGroupPrivacy } = await import('../../utils/sanitize');

    // Validate all fields
    const nameValidation = validateGroupName(name);
    if (!nameValidation.valid) {
      setError(nameValidation.error);
      return;
    }

    const descValidation = validateGroupDescription(description);
    if (!descValidation.valid) {
      setError(descValidation.error);
      return;
    }

    const categoryValidation = validateGroupCategory(category);
    if (!categoryValidation.valid) {
      setError(categoryValidation.error);
      return;
    }

    const privacyValidation = validateGroupPrivacy(privacy);
    if (!privacyValidation.valid) {
      setError(privacyValidation.error);
      return;
    }

    setLoading(true);
    setUploadingMedia(true);

    try {
      // Upload banner if file selected
      let bannerUrl = null;
      if (bannerFile) {
        try {
          bannerUrl = await uploadToCloudinary(bannerFile);
        } catch (uploadError) {
          setError(`Failed to upload banner: ${uploadError.message}`);
          setLoading(false);
          setUploadingMedia(false);
          return;
        }
      }

      // Upload icon if file selected
      let iconUrl = null;
      if (iconFile) {
        try {
          iconUrl = await uploadToCloudinary(iconFile);
        } catch (uploadError) {
          setError(`Failed to upload icon: ${uploadError.message}`);
          setLoading(false);
          setUploadingMedia(false);
          return;
        }
      }

      setUploadingMedia(false);

      const result = await createGroup({
        name: name.trim(),
        description: description.trim(),
        category,
        privacy,
        creatorId: currentUser.uid,
        banner: bannerUrl,
        icon: iconUrl
      });

      if (result.success) {
        setSuccess('Group created successfully!');
        setName('');
        setDescription('');
        setCategory('Technology');
        setPrivacy('public');
        setBannerFile(null);
        setBannerPreview(null);
        setIconFile(null);
        setIconPreview(null);
        
        // Close modal and refresh after a short delay to show success message
        setTimeout(() => {
          if (onGroupCreated) {
            onGroupCreated();
          }
          if (onClose) {
            onClose();
          }
        }, 1000);
      } else {
        // Do not show firebase errors to the user
        setError('Failed to create group. Please try again.');
      }
    } catch (err) {
      setError(`Failed to create group: ${err.message}`);
    }

    setLoading(false);
    setUploadingMedia(false);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setError('Banner image must be less than 30MB');
      return;
    }

    setBannerFile(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleIconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setError('Icon image must be less than 30MB');
      return;
    }

    setIconFile(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setIconPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  const handleRemoveIcon = () => {
    setIconFile(null);
    setIconPreview(null);
    if (iconInputRef.current) {
      iconInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create a New Group</h2>
          <button className="modal-close-button" onClick={handleClose} type="button">
            <FontAwesomeIcon icon="fa-solid fa-times" />
          </button>
        </div>
        
        <div className="create-group-box">
          <div className="userprofile">
            <div className="img">
              {displayAvatar ? (
                <img 
                  src={displayAvatar} 
                  alt={displayUsername} 
                  className="user-avatar-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const iconElement = e.target.parentElement.querySelector('.user');
                    if (iconElement) {
                      iconElement.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <FontAwesomeIcon 
                icon="fa-solid fa-user" 
                size="xl" 
                className="user"
                style={{ display: displayAvatar ? 'none' : 'flex' }}
              />
            </div>
            <div className="userdetials">
              <h5>{userDataLoading ? 'Loading...' : displayUsername}</h5>
              <h6>Create a new group</h6>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="create-group-form">
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

            <div className="form-group">
              <input
                type="text"
                placeholder="Group Name (3-60 characters)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
                minLength={3}
                maxLength={60}
                pattern="[a-zA-Z0-9\s\-_]+"
                title="Only letters, numbers, spaces, hyphens, and underscores allowed"
              />
            </div>

            <div className="form-group">
              <textarea
                placeholder="Group Description (10-500 characters)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                required
                minLength={10}
                maxLength={500}
                rows="3"
              />
              <div className="char-count">
                {description.length}/500
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category: </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                >
                  <option value="Technology">Technology</option>
                  <option value="Education">Education</option>
                  <option value="NEET">NEET</option>
                  <option value="JEE">JEE</option>
                  <option value="Coding">Coding</option>
                  <option value="Health">Health</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="College Life">College Life</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="form-group">
                <label>Privacy: </label>
                <div className="privacy-radio-group">
                  <label className={`privacy-radio ${privacy === 'public' ? 'checked' : ''}`}>
                    <input
                      type="radio"
                      value="public"
                      checked={privacy === 'public'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      disabled={loading}
                    />
                    <span>Public</span>
                  </label>
                  <label className={`privacy-radio ${privacy === 'private' ? 'checked' : ''}`}>
                    <input
                      type="radio"
                      value="private"
                      checked={privacy === 'private'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      disabled={loading}
                    />
                    <span>Private</span>
                  </label>
                  <label className={`privacy-radio ${privacy === 'restricted' ? 'checked' : ''}`}>
                    <input
                      type="radio"
                      value="restricted"
                      checked={privacy === 'restricted'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      disabled={loading}
                    />
                    <span>Restricted</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Media Upload Section */}
            <div className="form-group">
              <label>Media</label>
              
              <div className="media-upload-container">
                <div className="media-upload-item">
                  <label>Banner Image</label>
                  {(bannerPreview || bannerFile) && (
                    <div className="media-preview-container">
                      <img 
                        src={bannerPreview} 
                        alt="Banner preview" 
                        className="banner-preview"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveBanner}
                        className="remove-media-btn"
                      >
                        <FontAwesomeIcon icon="fa-solid fa-times" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={loading || uploadingMedia}
                    className="upload-media-btn"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-image" />
                    {bannerPreview ? 'Change Banner' : 'Upload Banner'}
                  </button>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="media-upload-item">
                  <label>Group Icon</label>
                  {(iconPreview || iconFile) && (
                    <div className="icon-preview-container">
                      <img 
                        src={iconPreview} 
                        alt="Icon preview" 
                        className="icon-preview"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveIcon}
                        className="remove-media-btn"
                      >
                        <FontAwesomeIcon icon="fa-solid fa-times" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    disabled={loading || uploadingMedia}
                    className="upload-media-btn"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-image" />
                    {iconPreview ? 'Change Icon' : 'Upload Icon'}
                  </button>
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading || uploadingMedia} className="create-group-button">
              {loading || uploadingMedia ? (uploadingMedia ? 'Uploading...' : 'Creating...') : 'Create Group'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Creategrp;