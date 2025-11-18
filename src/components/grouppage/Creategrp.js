import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../../context/AuthContext';
import { createGroup } from '../../services/db';

const Creategrp = ({ onGroupCreated, onClose }) => {
  const { currentUser, userData } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [privacy, setPrivacy] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (name.length < 3) {
      setError('Group name must be at least 3 characters');
      return;
    }

    setLoading(true);

    const result = await createGroup({
      name: name.trim(),
      description: description.trim(),
      category,
      privacy,
      creatorId: currentUser.uid,
    });

    if (result.success) {
      setSuccess('Group created successfully!');
      setName('');
      setDescription('');
      setCategory('general');
      setPrivacy('public');
      
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

    setLoading(false);
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
                placeholder="Group Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <textarea
                placeholder="Group Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                required
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category: </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                >
                  <option value="general">General</option>
                  <option value="technology">Technology</option>
                  <option value="science">Science</option>
                  <option value="education">Education</option>
                  <option value="programming">Programming</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Privacy: </label>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  disabled={loading}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="create-group-button">
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Creategrp;