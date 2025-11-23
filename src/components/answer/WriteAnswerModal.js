import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../../context/AuthContext';
import { createAnswer } from '../../services/db';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';
import '../../style/dash/ans.css';

const WriteAnswerModal = ({ open, onClose, post, onAnswerCreated }) => {
  const { currentUser, userData } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!currentUser) {
      setError('Please log in to answer.');
      return;
    }
    if (!content.trim() && media.length === 0) {
      setError('Write something or attach an image.');
      return;
    }

    setSaving(true);
    setError('');

    const result = await createAnswer({
      postId: post._id || post.postId,
      userId: currentUser.uid,
      username: userData?.profile?.username || userData?.username || currentUser.displayName || 'Qconnect user',
      answer: content.trim(),
      media,
    });

    setSaving(false);
    if (result.success) {
      setContent('');
      setMedia([]);
      if (onAnswerCreated) {
        onAnswerCreated();
      }
      onClose();
    } else {
      setError(result.error || 'Failed to post answer');
    }
  };

  const handleAddImage = () => {
    if (uploadingImage) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError('');
    try {
      const url = await uploadToCloudinary(file);
      setMedia((prev) => [...prev, { url, type: 'image' }]);
    } catch (err) {
      console.error('Image upload failed:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  return ReactDOM.createPortal(
    <div className="answer-modal-overlay">
      <div className="answer-modal">
        <header>
          <h2>{post?.title || 'Write your answer'}</h2>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon="fa-solid fa-xmark" />
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Share your knowledge..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={saving}
          />

          {media.length > 0 && (
            <div className="answer-modal-images">
              {media.map((item, index) => (
                <div key={index} className="answer-modal-image">
                  <img src={item.url} alt={`Answer media ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() =>
                      setMedia((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <div className="answer-error">{error}</div>}

          <div className="answer-modal-footer">
            <button
              type="button"
              className="ghost"
              onClick={handleAddImage}
              disabled={uploadingImage || saving}
            >
              {uploadingImage ? 'Uploading...' : 'Add Image'}
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Posting...' : 'Post Answer'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default WriteAnswerModal;

