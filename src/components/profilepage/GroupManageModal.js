import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../../context/AuthContext';
import { 
  updateGroup, 
  deleteGroup, 
  approveMemberRequest, 
  rejectMemberRequest,
  removeMember, 
  promoteToAdmin,
  getGroupMemberRequests,
  getGroup,
  getUser
} from '../../services/db';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';
import '../../style/profile/profile.css';

const GroupManageModal = ({ group, onClose, onGroupUpdated, onGroupDeleted }) => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [category, setCategory] = useState(group?.category || 'Technology');
  const [privacy, setPrivacy] = useState(group?.privacy || 'public');
  const [banner, setBanner] = useState(group?.banner || null);
  const [icon, setIcon] = useState(group?.icon || null);
  
  // Media upload state
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // Member management state
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(group);
  
  const bannerInputRef = useRef(null);
  const iconInputRef = useRef(null);

  // Load group data and members
  useEffect(() => {
    if (group?._id) {
      loadGroupData();
      loadMembers();
      loadRequests();
    }
  }, [group?._id]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const loadGroupData = async () => {
    const result = await getGroup(group._id);
    if (result.success) {
      const updatedGroup = result.data;
      setCurrentGroup(updatedGroup);
      setName(updatedGroup.name || '');
      setDescription(updatedGroup.description || '');
      setCategory(updatedGroup.category || 'Technology');
      setPrivacy(updatedGroup.privacy || 'public');
      setBanner(updatedGroup.banner || null);
      setIcon(updatedGroup.icon || null);
    }
  };

  const loadMembers = async () => {
    if (!group?._id) return;
    
    setLoadingMembers(true);
    const groupResult = await getGroup(group._id);
    
    if (groupResult.success && groupResult.data.members) {
      const membersObj = groupResult.data.members;
      const memberList = await Promise.all(
        Object.keys(membersObj).map(async (userId) => {
          const userResult = await getUser(userId);
          return {
            userId,
            username: userResult.success ? userResult.data.username : 'Unknown',
            role: membersObj[userId].role || 'member',
            joinedAt: membersObj[userId].joinedAt
          };
        })
      );
      setMembers(memberList);
    }
    
    setLoadingMembers(false);
  };

  const loadRequests = async () => {
    if (!group?._id) return;
    
    const result = await getGroupMemberRequests(group._id);
    if (result.success && result.data) {
      const requestsObj = result.data;
      const requestList = await Promise.all(
        Object.keys(requestsObj).map(async (userId) => {
          const userResult = await getUser(userId);
          return {
            userId,
            username: userResult.success ? userResult.data.username : 'Unknown',
            requestedAt: requestsObj[userId].requestedAt
          };
        })
      );
      setRequests(requestList);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
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
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setIconPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Import and use validation utilities
    const { 
      validateGroupName, 
      validateGroupDescription, 
      validateGroupCategory, 
      validateGroupPrivacy 
    } = await import('../../utils/sanitize');

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
      // Upload banner if new file selected
      let bannerUrl = banner;
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

      // Upload icon if new file selected
      let iconUrl = icon;
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

      // Update group
      const result = await updateGroup(group._id, {
        name: name.trim(),
        description: description.trim(),
        category,
        privacy,
        banner: bannerUrl,
        icon: iconUrl
      });

      if (result.success) {
        setSuccess('Group updated successfully!');
        setBannerFile(null);
        setBannerPreview(null);
        setIconFile(null);
        setIconPreview(null);
        
        setTimeout(() => {
          if (onGroupUpdated) {
            onGroupUpdated();
          }
          if (onClose) {
            onClose();
          }
        }, 1000);
      } else {
        setError(result.error || 'Failed to update group');
      }
    } catch (err) {
      setError(`Failed to update group: ${err.message}`);
    }

    setLoading(false);
  };

  const handleApproveRequest = async (userId) => {
    // requestId is typically userId in our schema
    const result = await approveMemberRequest(group._id, userId, userId);
    if (result.success) {
      loadMembers();
      loadRequests();
      setSuccess('Member request approved');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Failed to approve request');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRejectRequest = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) {
      return;
    }
    
    // requestId is typically userId in our schema
    const result = await rejectMemberRequest(group._id, userId, userId);
    if (result.success) {
      loadRequests();
      setSuccess('Member request rejected');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Failed to reject request');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    const result = await removeMember(group._id, userId);
    if (result.success) {
      loadMembers();
      setSuccess('Member removed');
    } else {
      setError('Failed to remove member');
    }
  };

  const handlePromoteToAdmin = async (userId) => {
    if (!window.confirm('Promote this member to admin?')) {
      return;
    }

    const result = await promoteToAdmin(group._id, userId);
    if (result.success) {
      loadMembers();
      setSuccess('Member promoted to admin');
    } else {
      setError('Failed to promote member');
    }
  };

  const handleDeleteGroup = async () => {
    const confirmMessage = `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone. All group posts and data will be permanently deleted.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    const result = await deleteGroup(group._id);
    setLoading(false);

    if (result.success) {
      if (onGroupDeleted) {
        onGroupDeleted();
      }
      if (onClose) {
        onClose();
      }
    } else {
      setError(result.error || 'Failed to delete group');
    }
  };

  const memberCount = members.length;
  const requestCount = requests.length;

  return (
    <div className="group-manage-modal-overlay" onClick={handleOverlayClick}>
      <div className="group-manage-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="group-manage-modal-header">
          <h2>Manage Group: {currentGroup?.name || group?.name}</h2>
          <button className="group-manage-modal-close-button" onClick={onClose} type="button">
            <FontAwesomeIcon icon="fa-solid fa-times" />
          </button>
        </div>

        <div className="group-manage-modal-body">
          {error && <div className="group-manage-error">{error}</div>}
          {success && <div className="group-manage-success">{success}</div>}

          <form onSubmit={handleSubmit} className="group-manage-form">
            {/* Basic Info Section */}
            <div className="group-manage-section">
              <h3>Basic Info</h3>
              
              <div className="form-group">
                <label>Group Name (3-60 characters)</label>
                <input
                  type="text"
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
                <label>Description (10-500 characters)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  required
                  minLength={10}
                  maxLength={500}
                  rows="4"
                />
                <div className="char-count">{description.length}/500</div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
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
                  <label>Privacy</label>
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
            </div>

            {/* Media Section */}
            <div className="group-manage-section">
              <h3>Media</h3>
              
              <div className="media-upload-row">
                <div className="media-upload-item">
                  <label>Banner Image</label>
                  {(bannerPreview || banner) && (
                    <div className="media-preview">
                      <img 
                        src={bannerPreview || banner} 
                        alt="Banner preview" 
                        className="banner-preview"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBanner(null);
                          setBannerFile(null);
                          setBannerPreview(null);
                          if (bannerInputRef.current) {
                            bannerInputRef.current.value = '';
                          }
                        }}
                        className="remove-media-btn"
                      >
                        <FontAwesomeIcon icon="fa-solid fa-times" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="upload-media-btn"
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon="fa-solid fa-image" />
                    {banner || bannerPreview ? 'Change Banner' : 'Upload Banner'}
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
                  {(iconPreview || icon) && (
                    <div className="media-preview">
                      <img 
                        src={iconPreview || icon} 
                        alt="Icon preview" 
                        className="icon-preview"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIcon(null);
                          setIconFile(null);
                          setIconPreview(null);
                          if (iconInputRef.current) {
                            iconInputRef.current.value = '';
                          }
                        }}
                        className="remove-media-btn"
                      >
                        <FontAwesomeIcon icon="fa-solid fa-times" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    className="upload-media-btn"
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon="fa-solid fa-image" />
                    {icon || iconPreview ? 'Change Icon' : 'Upload Icon'}
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

            {/* Member Management Section (for Private/Restricted) */}
            {(privacy === 'private' || privacy === 'restricted') && (
              <div className="group-manage-section">
                <h3>Member Management</h3>
                
                {loadingMembers ? (
                  <div>Loading members...</div>
                ) : (
                  <>
                    {requestCount > 0 && (
                      <div className="member-requests-section">
                        <h4>Join Requests ({requestCount})</h4>
                        {requests.map((req) => (
                          <div key={req.userId} className="member-item">
                            <div className="member-info">
                              <span>{req.username}</span>
                              {req.requestedAt && (
                                <span className="member-role" style={{ fontSize: '11px', color: '#666' }}>
                                  {new Date(req.requestedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div className="member-actions">
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(req.userId)}
                                className="approve-btn"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectRequest(req.userId)}
                                className="remove-btn"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="members-list-section">
                      <h4>Members ({memberCount})</h4>
                      {members.map((member) => (
                        <div key={member.userId} className="member-item">
                          <div className="member-info">
                            <span>{member.username}</span>
                            <span className="member-role">{member.role}</span>
                          </div>
                          <div className="member-actions">
                            {member.role !== 'admin' && member.userId !== currentUser.uid && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handlePromoteToAdmin(member.userId)}
                                  className="promote-btn"
                                >
                                  Promote
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(member.userId)}
                                  className="remove-btn"
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Danger Zone */}
            <div className="group-manage-section danger-zone">
              <h3>Danger Zone</h3>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={loading}
                className="delete-group-btn"
              >
                Delete Group
              </button>
              <p className="danger-warning">Warning: Cannot undo!</p>
            </div>

            {/* Footer Buttons */}
            <div className="group-manage-modal-footer">
              <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading || uploadingMedia} className="save-btn">
                {loading || uploadingMedia ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroupManageModal;

