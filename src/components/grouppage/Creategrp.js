import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../../context/AuthContext';
import { createGroup } from '../../services/db';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';

const Creategrp = ({ onGroupCreated, onClose }) => {
  const { currentUser, userData } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [privacy, setPrivacy] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Banner and icon state
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  const bannerInputRef = useRef(null);
  const iconInputRef = useRef(null);

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
              <FontAwesomeIcon icon="fa-solid fa-user" size="xl" className="user" />
            </div>
            <div className="userdetials">
              <h5>{userData?.username || 'User'}</h5>
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
              <div style={{ fontSize: '12px', color: '#666', textAlign: 'right', marginTop: '4px' }}>
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
                  <label className="privacy-radio">
                    <input
                      type="radio"
                      value="public"
                      checked={privacy === 'public'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      disabled={loading}
                    />
                    <span>Public</span>
                  </label>
                  <label className="privacy-radio">
                    <input
                      type="radio"
                      value="private"
                      checked={privacy === 'private'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      disabled={loading}
                    />
                    <span>Private</span>
                  </label>
                  <label className="privacy-radio">
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
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label style={{ marginBottom: '12px', display: 'block' }}>Media</label>
              
              <div className="form-row" style={{ gap: '20px', marginTop: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>Banner Image</label>
                  {(bannerPreview || bannerFile) && (
                    <div style={{ position: 'relative', marginBottom: '8px', borderRadius: '8px', overflow: 'hidden' }}>
                      <img 
                        src={bannerPreview} 
                        alt="Banner preview" 
                        style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveBanner}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FontAwesomeIcon icon="fa-solid fa-times" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={loading || uploadingMedia}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px dashed #ddd',
                      borderRadius: '8px',
                      background: 'transparent',
                      cursor: loading || uploadingMedia ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
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

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>Group Icon</label>
                  {(iconPreview || iconFile) && (
                    <div style={{ position: 'relative', marginBottom: '8px', width: '100px', height: '100px', margin: '0 auto' }}>
                      <img 
                        src={iconPreview} 
                        alt="Icon preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', border: '3px solid #ddd' }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveIcon}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FontAwesomeIcon icon="fa-solid fa-times" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    disabled={loading || uploadingMedia}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px dashed #ddd',
                      borderRadius: '8px',
                      background: 'transparent',
                      cursor: loading || uploadingMedia ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
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