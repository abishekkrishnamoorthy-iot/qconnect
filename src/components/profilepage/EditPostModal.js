import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updatePost } from '../../services/db'
import '../../style/profile/editPostModal.css'

const EditPostModal = ({ isOpen, onClose, post, postType, onSave, cudetails }) => {
  const { currentUser, userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState(null)

  useEffect(() => {
    if (isOpen && post) {
      // Pre-fill form data based on post type
      if (postType === 'question') {
        setFormData({
          questionText: post.title || '',
          details: post.text || post.details || '',
          topic: post.topic || '',
          media: post.media || [],
          mediaPreviews: post.media ? post.media.map(m => ({
            url: m.url,
            name: m.name || 'Media',
            file: null
          })) : [],
          visibility: post.visibility || 'public',
          postedTo: post.postedTo || 'everyone',
          selectedGroupId: post.groupId || ''
        })
      } else if (postType === 'quiz') {
        // For quiz, we'll handle it differently since QuizCreationModal doesn't support initialState
        setFormData({
          title: post.title || '',
          description: post.description || '',
          banner: post.banner || '',
          questions: post.questions || []
        })
      }
    }
  }, [isOpen, post, postType])

  const handleQuestionSubmit = async () => {
    if (!post || !currentUser || !formData) return

    setLoading(true)
    setError('')

    try {
      const updates = {
        title: formData.questionText.trim(),
        text: formData.details.trim() || '',
        topic: formData.topic.trim() || null
      }

      // Handle media updates if needed
      // Note: Media updates would require re-uploading, which is complex
      // For now, we'll just update text fields

      const result = await updatePost(post._id || post.postId, updates)

      if (result.success) {
        if (onSave) {
          onSave()
        }
        onClose()
      } else {
        setError(result.error || 'Failed to update post')
      }
    } catch (err) {
      setError(err.message || 'Failed to update post')
    } finally {
      setLoading(false)
    }
  }

  const handleQuizSubmit = async (quizData) => {
    if (!post || !currentUser) return

    setLoading(true)
    setError('')

    try {
      const updates = {
        title: quizData.title.trim(),
        description: quizData.description.trim() || '',
        banner: quizData.banner || null,
        questions: quizData.questions || []
      }

      const result = await updatePost(post._id || post.postId, updates)

      if (result.success) {
        if (onSave) {
          onSave()
        }
        onClose()
      } else {
        setError(result.error || 'Failed to update quiz')
      }
    } catch (err) {
      setError(err.message || 'Failed to update quiz')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !post) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="edit-post-overlay" onClick={handleOverlayClick}>
      <div className="edit-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-post-header">
          <h2>Edit {postType === 'question' ? 'Question' : 'Quiz'}</h2>
          <button className="edit-post-close" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="edit-post-error">{error}</div>}

        <div className="edit-post-body">
          {postType === 'question' && formData ? (
            <EditQuestionForm
              initialData={formData}
              onSave={handleQuestionSubmit}
              onClose={onClose}
              loading={loading}
              error={error}
              cudetails={cudetails}
              onStateChange={setFormData}
            />
          ) : postType === 'quiz' ? (
            <EditQuizForm
              post={post}
              onSave={handleQuizSubmit}
              onClose={onClose}
              loading={loading}
              cudetails={cudetails}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

// Simplified question edit form component
const EditQuestionForm = ({ initialData, onSave, onClose, loading, error, cudetails, onStateChange }) => {
  const [questionText, setQuestionText] = useState(initialData?.questionText || '')
  const [details, setDetails] = useState(initialData?.details || '')
  const [topic, setTopic] = useState(initialData?.topic || '')

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        questionText,
        details,
        topic,
        media: initialData?.media || [],
        mediaPreviews: initialData?.mediaPreviews || [],
        visibility: initialData?.visibility || 'public',
        postedTo: initialData?.postedTo || 'everyone',
        selectedGroupId: initialData?.selectedGroupId || ''
      })
    }
  }, [questionText, details, topic, onStateChange])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (onSave) {
      await onSave()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="edit-question-form">
      <div className="form-group">
        <label htmlFor="question-text">Question *</label>
        <input
          id="question-text"
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="What is your question?"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="question-details">Details (optional)</label>
        <textarea
          id="question-details"
          placeholder="Provide additional context or details..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          disabled={loading}
          rows="4"
        />
      </div>

      <div className="form-group">
        <label htmlFor="question-topic">Topic/Tag (optional)</label>
        <input
          id="question-topic"
          type="text"
          placeholder="e.g., JavaScript, Science, History"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading}
        />
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="edit-post-footer">
        <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="save-btn" disabled={loading || !questionText.trim()}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

// Simplified quiz edit form component
const EditQuizForm = ({ post, onSave, onClose, loading, cudetails }) => {
  const [title, setTitle] = useState(post?.title || '')
  const [description, setDescription] = useState(post?.description || '')
  const [banner, setBanner] = useState(post?.banner || '')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (onSave) {
      await onSave({
        title,
        description,
        banner,
        questions: post.questions || []
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="edit-quiz-form">
      <div className="form-group">
        <label htmlFor="quiz-title">Title *</label>
        <input
          id="quiz-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter quiz title"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="quiz-description">Description</label>
        <textarea
          id="quiz-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter quiz description"
          rows="4"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="quiz-banner">Banner URL</label>
        <input
          id="quiz-banner"
          type="url"
          value={banner}
          onChange={(e) => setBanner(e.target.value)}
          placeholder="Enter banner image URL"
          disabled={loading}
        />
        {banner && (
          <div className="banner-preview">
            <img src={banner} alt="Banner preview" />
          </div>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="edit-post-footer">
        <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="save-btn" disabled={loading || !title.trim()}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

export default EditPostModal

