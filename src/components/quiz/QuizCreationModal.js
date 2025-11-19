import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { createPost, getUserGroups } from '../../services/db'
import { uploadToCloudinary } from '../../utils/cloudinaryUpload'
import { generateQuiz } from '../../utils/generateQuiz'
import '../../style/quiz/quiz.css'

const QuizCreationModal = ({ onClose, onQuizCreated, cudetails, embedded = false }) => {
  const { currentUser, userData } = useAuth()
  const [activeTab, setActiveTab] = useState('ai') // 'ai' or 'manual'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Common fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState('')
  const [postedTo, setPostedTo] = useState('everyone')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [userGroups, setUserGroups] = useState([])
  const [groupSearchQuery, setGroupSearchQuery] = useState('')
  const [loadingGroups, setLoadingGroups] = useState(false)

  // AI Mode fields
  const [topic, setTopic] = useState('')
  const [topicDetails, setTopicDetails] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [numQuestions, setNumQuestions] = useState(3)
  const [generatedQuestions, setGeneratedQuestions] = useState(null)

  // Manual Mode fields
  const [manualNumQuestions, setManualNumQuestions] = useState(1)
  const [manualQuestions, setManualQuestions] = useState([
    {
      q: '',
      options: ['', '', '', ''],
      correct: 0
    }
  ])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const bannerInputRef = useRef(null)

  useEffect(() => {
    if (!embedded) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [embedded])

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

  useEffect(() => {
    // Initialize manual questions array when numQuestions changes
    if (activeTab === 'manual') {
      const newQuestions = []
      for (let i = 0; i < manualNumQuestions; i++) {
        if (manualQuestions[i]) {
          newQuestions.push(manualQuestions[i])
        } else {
          newQuestions.push({
            q: '',
            options: ['', '', '', ''],
            correct: 0
          })
        }
      }
      setManualQuestions(newQuestions)
      if (currentQuestionIndex >= manualNumQuestions) {
        setCurrentQuestionIndex(Math.max(0, manualNumQuestions - 1))
      }
    }
  }, [manualNumQuestions, activeTab])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleBannerChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setBannerFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setBannerPreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        setError('Please select an image file')
      }
    }
  }

  const handleRemoveBanner = () => {
    setBannerFile(null)
    setBannerPreview('')
    if (bannerInputRef.current) {
      bannerInputRef.current.value = ''
    }
  }

  const handleManualQuestionChange = (field, value) => {
    const newQuestions = [...manualQuestions]
    newQuestions[currentQuestionIndex][field] = value
    setManualQuestions(newQuestions)
  }

  const handleManualOptionChange = (optionIndex, value) => {
    const newQuestions = [...manualQuestions]
    newQuestions[currentQuestionIndex].options[optionIndex] = value
    setManualQuestions(newQuestions)
  }

  const handleManualCorrectChange = (correctIndex) => {
    const newQuestions = [...manualQuestions]
    newQuestions[currentQuestionIndex].correct = correctIndex
    setManualQuestions(newQuestions)
  }

  const handleGenerateQuiz = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!topic.trim()) {
      setError('Topic is required')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setGeneratedQuestions(null) // Clear previous questions

    try {
      const result = await generateQuiz(topic, difficulty, numQuestions, topicDetails)
      if (result.success) {
        setGeneratedQuestions(result.questions)
        setSuccess('Quiz generated successfully! Review and save.')
      } else {
        setError(result.error || 'AI couldn\'t generate a quiz. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Failed to generate quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQuiz = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    let questions = []
    if (activeTab === 'ai') {
      if (!generatedQuestions || generatedQuestions.length === 0) {
        setError('Please generate quiz questions first')
        return
      }
      questions = generatedQuestions
    } else {
      // Manual mode
      if (manualQuestions.some(q => !q.q.trim() || q.options.some(opt => !opt.trim()))) {
        setError('Please fill in all questions and options')
        return
      }
      questions = manualQuestions
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let bannerUrl = ''
      if (bannerFile) {
        try {
          bannerUrl = await uploadToCloudinary(bannerFile)
        } catch (uploadError) {
          setError(`Failed to upload banner: ${uploadError.message}`)
          setLoading(false)
          return
        }
      }

      // Determine postedTo value
      const finalPostedTo = postedTo === 'group' && selectedGroupId ? selectedGroupId : 'everyone'

      const quizPost = {
        userId: currentUser.uid,
        username: cudetails?.username || userData?.profile?.username || userData?.username || 'Unknown',
        userProfilePic: userData?.profile?.profilePic || userData?.profilePic || '',
        title: title.trim(),
        description: description.trim() || '',
        type: 'quiz',
        createdBy: currentUser.uid,
        createdByName: cudetails?.username || userData?.profile?.username || userData?.username || 'Unknown',
        banner: bannerUrl || null,
        questions: questions,
        createdAt: Date.now(),
        results: {},
        postedTo: finalPostedTo,
        // Include topic and difficulty for AI-generated quizzes
        ...(activeTab === 'ai' && {
          topic: topic.trim(),
          difficulty: difficulty
        })
      }

      const result = await createPost(quizPost)

      if (result.success) {
        setSuccess('Quiz created successfully!')
        setTimeout(() => {
          if (onQuizCreated) onQuizCreated()
          onClose()
        }, 1000)
      } else {
        setError(result.error || 'Failed to create quiz')
      }
    } catch (err) {
      setError(err.message || 'Failed to create quiz')
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div className={`quiz-modal-content quiz-creation-content ${embedded ? 'embedded' : ''}`} onClick={(e) => e.stopPropagation()}>
      {!embedded && (
        <div className="quiz-modal-header">
          <h2>Create Quiz</h2>
          <button className="quiz-modal-close" onClick={onClose}>×</button>
        </div>
      )}

      <div className="quiz-creation-tabs">
          <button
            className={`quiz-tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            AI Mode
          </button>
          <button
            className={`quiz-tab ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            Manual Mode
          </button>
        </div>

        <div className="quiz-creation-form">
          {error && <div className="quiz-error">{error}</div>}
          {success && <div className="quiz-success">{success}</div>}

          {/* Common Fields */}
          <div className="quiz-form-group">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
              required
            />
          </div>

          <div className="quiz-form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quiz description (optional)"
              rows="3"
            />
          </div>

          <div className="quiz-form-group">
            <label>Banner Image (optional)</label>
            {bannerPreview ? (
              <div className="quiz-banner-preview">
                <img src={bannerPreview} alt="Banner preview" />
                <button type="button" onClick={handleRemoveBanner}>Remove</button>
              </div>
            ) : (
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
              />
            )}
          </div>

          <div className="quiz-form-group">
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

          {/* AI Mode */}
          {activeTab === 'ai' && (
            <>
              <div className="quiz-form-group">
                <label>Topic *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., JavaScript, History, Science"
                  required
                />
              </div>

              <div className="quiz-form-group">
                <label>Detailed Topic Description (Optional)</label>
                <textarea
                  value={topicDetails}
                  onChange={(e) => setTopicDetails(e.target.value)}
                  placeholder="Provide additional context, specific areas to focus on, or detailed information about the topic..."
                  rows="3"
                />
              </div>

              <div className="quiz-form-group">
                <label>Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="quiz-form-group">
                <label>Number of Questions (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                />
              </div>

              <button
                className="quiz-generate-btn"
                onClick={handleGenerateQuiz}
                disabled={loading || !title.trim() || !topic.trim()}
              >
                {loading ? 'Generating...' : 'Generate Quiz'}
              </button>

              {generatedQuestions && generatedQuestions.length > 0 && (
                <div className="quiz-preview">
                  <h3>Generated Questions Preview:</h3>
                  {generatedQuestions.map((q, idx) => (
                    <div key={idx} className="quiz-preview-item">
                      <p><strong>Q{idx + 1}:</strong> {q.q}</p>
                      <ul>
                        {q.options.map((opt, optIdx) => (
                          <li key={optIdx} className={optIdx === q.correct ? 'correct' : ''}>
                            {opt} {optIdx === q.correct && '(Correct)'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="quiz-save-btn"
                onClick={handleSaveQuiz}
                disabled={loading || !generatedQuestions || generatedQuestions.length === 0}
              >
                {loading ? 'Saving...' : 'Save Quiz'}
              </button>
            </>
          )}

          {/* Manual Mode */}
          {activeTab === 'manual' && (
            <>
              <div className="quiz-form-group">
                <label>Number of Questions (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={manualNumQuestions}
                  onChange={(e) => setManualNumQuestions(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="quiz-manual-navigation">
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </button>
                <span>Question {currentQuestionIndex + 1} of {manualNumQuestions}</span>
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex(Math.min(manualNumQuestions - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === manualNumQuestions - 1}
                >
                  Next
                </button>
              </div>

              <div className="quiz-manual-question">
                <div className="quiz-form-group">
                  <label>Question {currentQuestionIndex + 1} *</label>
                  <input
                    type="text"
                    value={manualQuestions[currentQuestionIndex]?.q || ''}
                    onChange={(e) => handleManualQuestionChange('q', e.target.value)}
                    placeholder="Enter question text"
                    required
                  />
                </div>

                <div className="quiz-form-group">
                  <label>Options *</label>
                  {[0, 1, 2, 3].map((optIdx) => (
                    <div key={optIdx} className="quiz-option-input">
                      <input
                        type="radio"
                        name={`correct-${currentQuestionIndex}`}
                        checked={manualQuestions[currentQuestionIndex]?.correct === optIdx}
                        onChange={() => handleManualCorrectChange(optIdx)}
                      />
                      <input
                        type="text"
                        value={manualQuestions[currentQuestionIndex]?.options[optIdx] || ''}
                        onChange={(e) => handleManualOptionChange(optIdx, e.target.value)}
                        placeholder={`Option ${optIdx + 1}`}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="quiz-save-btn"
                onClick={handleSaveQuiz}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Quiz'}
              </button>
            </>
          )}
      </div>
    </div>
  )

  if (embedded) {
    return modalContent
  }

  return (
    <div className="quiz-modal-overlay" onClick={handleOverlayClick}>
      {modalContent}
    </div>
  )
}

export default QuizCreationModal

