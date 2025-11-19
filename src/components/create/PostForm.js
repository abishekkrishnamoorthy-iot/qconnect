import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { createPost, getUserGroups } from '../../services/db'
import { uploadToCloudinary } from '../../utils/cloudinaryUpload'
import '../../style/components/create-form.css'

const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'text/plain'
]

const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30 MB
const MAX_FILES = 10

const PostForm = forwardRef(({ onSuccess, onError, cudetails, initialState, onStateChange }, ref) => {
  const { currentUser, userData } = useAuth()
  const [title, setTitle] = useState(initialState?.title || '')
  const [body, setBody] = useState(initialState?.body || '')
  const [media, setMedia] = useState(initialState?.media || [])
  const [mediaPreviews, setMediaPreviews] = useState(initialState?.mediaPreviews || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [visibility, setVisibility] = useState(initialState?.visibility || 'public')
  const [postedTo, setPostedTo] = useState(initialState?.postedTo || 'everyone')
  const [selectedGroupId, setSelectedGroupId] = useState(initialState?.selectedGroupId || '')
  const [userGroups, setUserGroups] = useState([])
  const [groupSearchQuery, setGroupSearchQuery] = useState('')
  const [loadingGroups, setLoadingGroups] = useState(false)
  
  const mediaInputRef = useRef(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      const firstInput = document.querySelector('.post-form input[type="text"]')
      if (firstInput) firstInput.focus()
    }
  }))

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        title,
        body,
        media,
        mediaPreviews,
        visibility,
        postedTo,
        selectedGroupId
      })
    }
  }, [title, body, media, mediaPreviews, visibility, postedTo, selectedGroupId, onStateChange])

  // Load user groups when component mounts
  useEffect(() => {
    if (currentUser) {
      loadUserGroups()
    }
  }, [currentUser])

  const loadUserGroups = async () => {
    if (!currentUser) return
    setLoadingGroups(true)
    try {
      const result = await getUserGroups(currentUser.uid)
      if (result.success) {
        setUserGroups(result.data || [])
      }
    } catch (error) {
      console.error('Error loading user groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }

  const filteredGroups = userGroups.filter(group =>
    group.name?.toLowerCase().includes(groupSearchQuery.toLowerCase())
  )

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: `Unsupported file type: ${file.type}` }
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File too large (max 30MB): ${file.name}` }
    }
    return { valid: true }
  }

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    if (media.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`)
      return
    }

    const validatedFiles = []
    for (const file of files) {
      const validation = validateFile(file)
      if (!validation.valid) {
        setError(validation.error)
        return
      }
      validatedFiles.push(file)
    }

    const newMedia = [...media, ...validatedFiles]
    setMedia(newMedia)

    const previewPromises = validatedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve({ url: reader.result, file, name: file.name, size: file.size })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(previewPromises).then(newPreviews => {
      setMediaPreviews(prev => [...prev, ...newPreviews])
    })

    if (e.target) {
      e.target.value = ''
    }
  }

  const removeMedia = (index) => {
    setMedia(media.filter((_, i) => i !== index))
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!body.trim() && media.length === 0) {
      setError('Please enter post content or upload media')
      return
    }

    if (!currentUser) {
      setError('You must be logged in to post')
      return
    }

    setLoading(true)

    try {
      // Upload media files to Cloudinary
      const mediaArray = []
      for (let i = 0; i < media.length; i++) {
        try {
          const file = media[i]
          const secureUrl = await uploadToCloudinary(file)
          
          const fileType = file.type.startsWith('image/') ? 'image' :
                          file.type.startsWith('video/') ? 'video' :
                          file.type.startsWith('audio/') ? 'audio' : 'document'

          mediaArray.push({
            url: secureUrl,
            type: fileType,
            name: file.name,
            size: file.size
          })
        } catch (uploadError) {
          setError(`Failed to upload ${media[i].name}: ${uploadError.message}`)
          setLoading(false)
          return
        }
      }

      // Determine postedTo value
      const finalPostedTo = postedTo === 'group' && selectedGroupId ? selectedGroupId : 'everyone'

      // Create post
      const result = await createPost({
        userId: currentUser.uid,
        username: cudetails?.username || userData?.profile?.username || userData?.username || 'Unknown',
        userProfilePic: userData?.profile?.profilePic || userData?.profilePic || '',
        title: title.trim() || null,
        text: body.trim() || '',
        type: 'post',
        visibility,
        media: mediaArray,
        postedTo: finalPostedTo
      })

      if (result.success) {
        // Reset form state after successful submission
        setTitle('')
        setBody('')
        setMedia([])
        setMediaPreviews([])
        setError('')
        setPostedTo('everyone')
        setSelectedGroupId('')
        setGroupSearchQuery('')
        
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(result.error || 'Failed to create post')
        if (onError) {
          onError(result.error)
        }
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to create post'
      setError(errorMsg)
      if (onError) {
        onError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="post-form create-form">
      {error && <div className="create-form-error">{error}</div>}

      <div className="create-form-group">
        <label htmlFor="post-title">Title (optional)</label>
        <input
          id="post-title"
          type="text"
          placeholder="Enter post title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="create-form-group">
        <label htmlFor="post-body">Content *</label>
        <textarea
          id="post-body"
          placeholder="What's on your mind?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={loading}
          rows="6"
          required={media.length === 0}
        />
        <small className="create-form-hint">
          {media.length === 0 ? 'Required if no media uploaded' : 'Optional if media is uploaded'}
        </small>
      </div>

      <div className="create-form-group">
        <label>Media (optional)</label>
        <input
          ref={mediaInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleMediaUpload}
          disabled={loading || media.length >= MAX_FILES}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="create-form-upload-btn"
          onClick={() => mediaInputRef.current?.click()}
          disabled={loading || media.length >= MAX_FILES}
        >
          <FontAwesomeIcon icon="fa-solid fa-upload" /> Upload Media
        </button>
        {media.length > 0 && (
          <div className="create-form-media-preview">
            {mediaPreviews.map((preview, index) => (
              <div key={index} className="create-form-media-item">
                {preview.file.type.startsWith('image/') ? (
                  <img src={preview.url} alt={preview.name} />
                ) : preview.file.type.startsWith('video/') ? (
                  <video src={preview.url} controls />
                ) : preview.file.type.startsWith('audio/') ? (
                  <audio src={preview.url} controls />
                ) : (
                  <div className="create-form-media-placeholder">
                    <FontAwesomeIcon icon="fa-solid fa-file" />
                    <span>{preview.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  className="create-form-media-remove"
                  onClick={() => removeMedia(index)}
                  disabled={loading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="create-form-group">
        <label htmlFor="post-visibility">Visibility</label>
        <select
          id="post-visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          disabled={loading}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div className="create-form-group">
        <label>Post To</label>
        <div className="post-targeting-options">
          <label className="radio-option">
            <input
              type="radio"
              name="postedTo"
              value="everyone"
              checked={postedTo === 'everyone'}
              onChange={(e) => {
                setPostedTo(e.target.value)
                setSelectedGroupId('')
              }}
              disabled={loading}
            />
            <span>Everyone</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="postedTo"
              value="group"
              checked={postedTo === 'group'}
              onChange={(e) => setPostedTo(e.target.value)}
              disabled={loading}
            />
            <span>Group</span>
          </label>
        </div>

        {postedTo === 'group' && (
          <div className="group-selector">
            {loadingGroups ? (
              <p>Loading groups...</p>
            ) : userGroups.length === 0 ? (
              <p className="no-groups-message">You haven't joined any groups yet.</p>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  className="group-search-input"
                  disabled={loading}
                />
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  disabled={loading}
                  className="group-select"
                >
                  <option value="">Select a group</option>
                  {filteredGroups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {filteredGroups.length === 0 && groupSearchQuery && (
                  <p className="no-groups-message">No groups found matching "{groupSearchQuery}"</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="create-form-actions">
        <button
          type="submit"
          className="create-form-submit-btn"
          disabled={loading || (!body.trim() && media.length === 0)}
        >
          {loading ? 'Posting...' : 'Create Post'}
        </button>
      </div>
    </form>
  )
})

PostForm.displayName = 'PostForm'

export default PostForm

