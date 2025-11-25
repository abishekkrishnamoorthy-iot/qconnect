import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../../context/AuthContext';
import { createPost } from '../../services/db';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';
import '../../style/dash/askmodal.css';

// Allowed file types
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'video/mp4',
  'video/webm',
  'audio/mpeg', // mp3
  'audio/wav', // wav
  'audio/webm', // webm audio
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/zip',
  'text/plain'
];

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB
const MAX_FILES = 10;

// Helper to get allowed types as readable string
const getAllowedTypesString = () => {
  const types = {
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPG',
    'video/mp4': 'MP4',
    'video/webm': 'WebM',
    'audio/mpeg': 'MP3',
    'audio/wav': 'WAV',
    'audio/webm': 'WebM Audio',
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/zip': 'ZIP',
    'text/plain': 'TXT'
  };
  return Object.values(types).join(', ');
};

const AskModal = ({ onClose, onPostCreated, cudetails }) => {
  const { currentUser, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('question'); // 'question' or 'blog'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visibility, setVisibility] = useState('public');

  // Question state
  const [questionTitle, setQuestionTitle] = useState('');

  // Post state
  const [postTitle, setPostTitle] = useState('');
  const [postText, setPostText] = useState('');
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

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

  // Validate file
  const validateFile = (file) => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      const allowedTypesList = getAllowedTypesString();
      return { 
        valid: false, 
        error: `Unsupported file type: ${file.type}. Allowed types: ${allowedTypesList}` 
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      return { 
        valid: false, 
        error: `File too large (max 30MB): ${file.name} is ${fileSizeMB} MB` 
      };
    }

    return { valid: true };
  };

  // Get total file count
  const getTotalFileCount = () => {
    return images.length + videos.length + documents.length;
  };

  // Image upload handler
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError('No valid image files selected');
      return;
    }

    // Check total file count
    const currentTotal = getTotalFileCount();
    if (currentTotal + imageFiles.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed. You have ${currentTotal} files and trying to add ${imageFiles.length} more.`);
      return;
    }

    // Validate each file
    const validatedFiles = [];
    for (const file of imageFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      validatedFiles.push(file);
    }

    if (validatedFiles.length === 0) return;

    const newImages = [...images, ...validatedFiles];
    setImages(newImages);

    // Create previews
    const previewPromises = validatedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ url: reader.result, file });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previewPromises).then(newPreviews => {
      setImagePreviews(prev => [...prev, ...newPreviews]);
    });

    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  // Video upload handler (also handles audio files)
  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    const videoFiles = files.filter(file => 
      file.type.startsWith('video/') || file.type.startsWith('audio/')
    );
    
    if (videoFiles.length === 0) {
      setError('No valid video or audio files selected');
      return;
    }

    // Check total file count
    const currentTotal = getTotalFileCount();
    if (currentTotal + videoFiles.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed. You have ${currentTotal} files and trying to add ${videoFiles.length} more.`);
      return;
    }

    // Validate each file
    const validatedFiles = [];
    for (const file of videoFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      validatedFiles.push(file);
    }

    if (validatedFiles.length === 0) return;

    const newVideos = [...videos, ...validatedFiles];
    setVideos(newVideos);

    // Create previews
    const previewPromises = validatedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ url: reader.result, file });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previewPromises).then(newPreviews => {
      setVideoPreviews(prev => [...prev, ...newPreviews]);
    });

    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  // Document upload handler
  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    const docFiles = files.filter(file => 
      file.type === 'application/pdf' ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      file.type === 'application/zip' ||
      file.type === 'text/plain'
    );
    
    if (docFiles.length === 0) {
      setError('No valid document files selected');
      return;
    }

    // Check total file count
    const currentTotal = getTotalFileCount();
    if (currentTotal + docFiles.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed. You have ${currentTotal} files and trying to add ${docFiles.length} more.`);
      return;
    }

    // Validate each file
    const validatedFiles = [];
    for (const file of docFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      validatedFiles.push(file);
    }

    if (validatedFiles.length === 0) return;

    setDocuments(prev => [...prev, ...validatedFiles]);

    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  // Remove image
  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // Remove video
  const removeVideo = (index) => {
    setVideos(videos.filter((_, i) => i !== index));
    setVideoPreviews(videoPreviews.filter((_, i) => i !== index));
  };

  // Remove document
  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  // Handle question submission
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!questionTitle.trim()) {
      setError('Please enter a question');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to post');
      return;
    }

    setLoading(true);

    const result = await createPost({
      userId: currentUser.uid,
      username: cudetails?.username || userData?.profile?.username || userData?.username || 'Unknown',
      userProfilePic: userData?.profile?.profilePic || userData?.profilePic || '',
      title: questionTitle.trim(),
      text: '',
      groupId: null,
      type: 'question',
      visibility
    });

    if (result.success) {
      setSuccess('Question posted successfully!');
      setQuestionTitle('');
      
      setTimeout(() => {
        if (onPostCreated) {
          onPostCreated();
        }
        if (onClose) {
          onClose();
        }
      }, 1000);
    } else {
      setError(result.error || 'Failed to post question');
    }

    setLoading(false);
  };

  // Handle post submission
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!postTitle.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to post');
      return;
    }

    setLoading(true);

    // Upload summary tracking
    const uploadSummary = {
      filesTotal: images.length + videos.length + documents.length,
      filesUploaded: 0,
      filesFailed: 0,
      cloudinarySuccess: false,
      dbSaveSuccess: false,
      verificationSuccess: false
    };

    try {
      // Combine all files into single array
      const allFiles = [
        ...images.map(file => ({ file, type: 'image' })),
        ...videos.map(file => ({ 
          file, 
          type: file.type.startsWith('audio/') ? 'audio' : 'video' 
        })),
        ...documents.map(file => ({ file, type: 'document' }))
      ];

      console.log(`Starting upload of ${allFiles.length} files...`);

      // Upload files to Cloudinary and create media array
      const mediaArray = [];
      
      for (const { file, type } of allFiles) {
        try {
          console.log(`Uploading ${type}: ${file.name}...`);
          const url = await uploadToCloudinary(file);
          
          // Validate URL format
          const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dfayzbhpu';
          if (!url || !url.startsWith(`https://res.cloudinary.com/${cloudName}/`)) {
            throw new Error(`Invalid Cloudinary URL: ${url}`);
          }
          
          mediaArray.push({
            type: type,
            url: url
          });
          uploadSummary.filesUploaded++;
          console.log(`✓ Successfully uploaded ${file.name}`);
        } catch (uploadError) {
          uploadSummary.filesFailed++;
          console.error(`✗ Error uploading ${file.name}:`, uploadError);
          
          let errorMessage = 'Cloudinary upload failed';
          if (uploadError.message) {
            if (uploadError.message.includes('Invalid Cloudinary response')) {
              errorMessage = `Invalid Cloudinary response: missing secure_url for ${file.name}`;
            } else if (uploadError.message.includes('Cloudinary error')) {
              errorMessage = uploadError.message;
            } else if (uploadError.message.includes('Invalid Cloudinary URL')) {
              errorMessage = uploadError.message;
            } else {
              errorMessage = `Cloudinary upload failed: ${uploadError.message}`;
            }
          }
          
          setError(`${errorMessage}. Please try again.`);
          setLoading(false);
          
          // Print upload summary
          console.group("UPLOAD CHECK");
          console.log(`❌ UPLOAD FAILED — reason: ${errorMessage}`);
          console.log(`Files uploaded: ${uploadSummary.filesUploaded}/${uploadSummary.filesTotal}`);
          console.log(`Files failed: ${uploadSummary.filesFailed}`);
          console.groupEnd();
          
          return;
        }
      }

      uploadSummary.cloudinarySuccess = uploadSummary.filesUploaded === uploadSummary.filesTotal;

      // Log media array before saving
      console.log('Media array created:', mediaArray);
      console.log(`Total media items: ${mediaArray.length}`);

      // Create post with media array
      const result = await createPost({
        userId: currentUser.uid,
        username: cudetails?.username || userData?.profile?.username || userData?.username || 'Unknown',
        userProfilePic: userData?.profile?.profilePic || userData?.profilePic || '',
        title: postTitle.trim(),
        text: postText.trim() || '',
        groupId: null,
        type: 'blog',
        visibility,
        media: mediaArray
      });

      if (result.success) {
        uploadSummary.dbSaveSuccess = true;
        uploadSummary.verificationSuccess = result.verified || false;
        
        // Print upload summary
        console.group("UPLOAD CHECK");
        if (uploadSummary.cloudinarySuccess && uploadSummary.dbSaveSuccess && uploadSummary.verificationSuccess) {
          console.log("✔ Cloudinary URL generated");
          console.log("✔ Saved to Firebase");
          console.log("✔ Media array correct");
          console.log("✔ Unified schema correct");
          console.log(`✔ All ${uploadSummary.filesUploaded} files uploaded successfully`);
        } else {
          console.log("❌ UPLOAD FAILED — reason:");
          if (!uploadSummary.cloudinarySuccess) console.log("  ✗ Cloudinary upload failed");
          if (!uploadSummary.dbSaveSuccess) console.log("  ✗ DB save failed");
          if (!uploadSummary.verificationSuccess) console.log("  ✗ Verification failed");
        }
        console.groupEnd();

        setSuccess('Post created successfully!');
        setPostTitle('');
        setPostText('');
        setImages([]);
        setVideos([]);
        setDocuments([]);
        setImagePreviews([]);
        setVideoPreviews([]);
        
        setTimeout(() => {
          if (onPostCreated) {
            onPostCreated();
          }
          if (onClose) {
            onClose();
          }
        }, 1000);
      } else {
        const errorMsg = result.error || 'Failed to save post to Firebase';
        console.error('✗ DB save failed:', errorMsg);
        setError(`Failed to save post to Firebase: ${errorMsg}`);
        
        // Print upload summary
        console.group("UPLOAD CHECK");
        console.log(`❌ UPLOAD FAILED — reason: ${errorMsg}`);
        console.log(`Files uploaded to Cloudinary: ${uploadSummary.filesUploaded}/${uploadSummary.filesTotal}`);
        console.log("✗ Saved to Firebase: NO");
        console.groupEnd();
      }
    } catch (err) {
      console.error('✗ Error creating post:', err);
      let errorMessage = 'Failed to upload files. Please try again.';
      
      if (err.message) {
        if (err.message.includes('Cloudinary')) {
          errorMessage = `Cloudinary upload failed: ${err.message}`;
        } else if (err.message.includes('Firebase')) {
          errorMessage = `Failed to save post to Firebase: ${err.message}`;
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Print upload summary
      console.group("UPLOAD CHECK");
      console.log(`❌ UPLOAD FAILED — reason: ${errorMessage}`);
      console.log(`Files uploaded: ${uploadSummary.filesUploaded}/${uploadSummary.filesTotal}`);
      console.groupEnd();
    }

    setLoading(false);
  };

  return (
    <div className="ask-modal-overlay" onClick={handleOverlayClick}>
      <div className="ask-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ask-modal-header">
          <div className="ask-modal-tabs">
            <button
              className={`ask-modal-tab ${activeTab === 'question' ? 'active' : ''}`}
              onClick={() => setActiveTab('question')}
            >
              Create Question
            </button>
            <button
              className={`ask-modal-tab ${activeTab === 'blog' ? 'active' : ''}`}
              onClick={() => setActiveTab('blog')}
            >
              Create Blog Post
            </button>
          </div>
          <button className="ask-modal-close-button" onClick={handleClose} type="button">
            <FontAwesomeIcon icon="fa-solid fa-times" />
          </button>
        </div>

        <div className="ask-modal-body">
          {error && <div className="ask-modal-error">{error}</div>}
          {success && <div className="ask-modal-success">{success}</div>}

          {activeTab === 'question' ? (
            <form onSubmit={handleQuestionSubmit} className="ask-modal-form">
              <div className="ask-modal-profile-section">
                <div className="img">
                  <FontAwesomeIcon icon="fa-solid fa-user" size="xl" className="user" />
                </div>
                <div className="userdetials">
                  <h5>{cudetails?.username || userData?.username || 'User'}</h5>
                  <select 
                    value={visibility} 
                    onChange={(e) => setVisibility(e.target.value)}
                    className="visibility-selector"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="ask-modal-input-group">
                <input
                  type="text"
                  placeholder="Start your question with 'What', 'How', 'Why', etc."
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                  disabled={loading}
                  required
                  className="ask-question-input"
                />
              </div>

              <div className="ask-modal-footer">
                <button type="button" onClick={handleClose} className="ask-modal-cancel-btn">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="ask-modal-submit-btn">
                  {loading ? 'Posting...' : 'Post Question'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePostSubmit} className="ask-modal-form">
              <div className="ask-modal-profile-section">
                <div className="img">
                  <FontAwesomeIcon icon="fa-solid fa-user" size="xl" className="user" />
                </div>
                <div className="userdetials">
                  <h5>{cudetails?.username || userData?.username || 'User'}</h5>
                  <select 
                    value={visibility} 
                    onChange={(e) => setVisibility(e.target.value)}
                    className="visibility-selector"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="ask-modal-input-group">
                <input
                  type="text"
                  placeholder="Add a title..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  disabled={loading}
                  required
                  className="ask-post-title-input"
                />
                <textarea
                  placeholder="What do you want to share?"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  disabled={loading}
                  rows="6"
                  className="ask-post-textarea"
                />
              </div>

              <div className="media-upload-section">
                <div className="media-upload-buttons">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="media-upload-btn"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-image" />
                    <span>Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="media-upload-btn"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-video" />
                    <span>Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => documentInputRef.current?.click()}
                    className="media-upload-btn"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-file" />
                    <span>File</span>
                  </button>
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoUpload}
                  style={{ display: 'none' }}
                />
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  multiple
                  onChange={handleDocumentUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {(imagePreviews.length > 0 || videoPreviews.length > 0 || documents.length > 0) && (
                <div className="file-preview-section">
                  {imagePreviews.length > 0 && (
                    <div className="file-preview-grid">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="file-preview-item image-preview">
                          <img src={preview.url} alt={`Preview ${index}`} />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="remove-file-btn"
                          >
                            <FontAwesomeIcon icon="fa-solid fa-times" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {videoPreviews.length > 0 && (
                    <div className="file-preview-grid">
                      {videoPreviews.map((preview, index) => (
                        <div key={index} className="file-preview-item video-preview">
                          <video src={preview.url} controls />
                          <button
                            type="button"
                            onClick={() => removeVideo(index)}
                            className="remove-file-btn"
                          >
                            <FontAwesomeIcon icon="fa-solid fa-times" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {documents.length > 0 && (
                    <div className="file-preview-list">
                      {documents.map((doc, index) => (
                        <div key={index} className="file-preview-item document-preview">
                          <FontAwesomeIcon icon="fa-solid fa-file" />
                          <span>{doc.name}</span>
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="remove-file-btn"
                          >
                            <FontAwesomeIcon icon="fa-solid fa-times" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="ask-modal-footer">
                <button type="button" onClick={handleClose} className="ask-modal-cancel-btn">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="ask-modal-submit-btn">
                  {loading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AskModal;

