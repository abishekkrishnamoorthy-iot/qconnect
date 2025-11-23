import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import QuestionForm from '../create/QuestionForm'
import PostForm from '../create/PostForm'
import QuizForm from '../create/QuizForm'
import '../../style/components/create-modal.css'

const CreateModal = ({ isOpen, onClose, onPostCreated, cudetails, tabsOverride, initialTabOverride }) => {
  const location = useLocation()
  const modalRef = useRef(null)
  const firstInputRef = useRef(null)
  const cardRef = useRef(null)

  // Determine current panel based on route
  const getCurrentPanel = () => {
    if (tabsOverride?.length) {
      return 'override'
    }
    const path = location.pathname
    if (path === '/home/quiz') {
      return 'quiz'
    } else if (path === '/home/all') {
      return 'all'
    } else if (path === '/home' || path === '/home/qpost') {
      return 'qanda'
    }
    return 'qanda' // Default to Q&A
  }

  const currentPanel = getCurrentPanel()

  // Memoize tabs array to prevent unnecessary recalculations
  const tabs = useMemo(() => {
    if (tabsOverride?.length) {
      return tabsOverride
    }
    if (currentPanel === 'quiz') {
      return [] // No tabs for quiz panel
    } else if (currentPanel === 'all') {
      return ['question', 'blog', 'quiz'] // All panel: 3 tabs
    } else if (currentPanel === 'qanda') {
      return ['question', 'blog'] // Q&A panel: 2 tabs
    }
    return ['question', 'blog'] // Default
  }, [currentPanel])

  const pickInitialTab = () => {
    if (initialTabOverride) return initialTabOverride
    if (currentPanel === 'quiz' && !tabsOverride?.length) {
      return 'quiz'
    }
    return tabs[0] || 'question'
  }

  const [activeTab, setActiveTab] = useState(pickInitialTab)
  const [formKey, setFormKey] = useState(0) // Key to force form remount on reset

  // Form state preservation
  const [formStates, setFormStates] = useState({
    question: {},
    blog: {},
    quiz: {}
  })

  // Track previous values to detect actual changes
  const prevPanelRef = useRef(currentPanel)
  const prevIsOpenRef = useRef(isOpen)

  // Update active tab only when panel changes or modal opens
  useEffect(() => {
    const panelChanged = prevPanelRef.current !== currentPanel
    const modalJustOpened = !prevIsOpenRef.current && isOpen
    
    // Update refs
    prevPanelRef.current = currentPanel
    prevIsOpenRef.current = isOpen
    
    // Only update if panel changed or modal just opened
    if (!isOpen || (!panelChanged && !modalJustOpened)) {
      return
    }
    
    if (currentPanel === 'quiz' && !tabsOverride?.length) {
      setActiveTab('quiz')
    } else if (tabs.length > 0) {
      // Reset to first tab when panel changes or modal opens
      setActiveTab(initialTabOverride || tabs[0] || 'question')
    }
  }, [currentPanel, isOpen, tabs, tabsOverride, initialTabOverride])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Focus first input when modal opens
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus()
        }
      }, 100)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleTabChange = (tab) => {
    // Explicitly update active tab and prevent any interference
    setActiveTab(tab)
  }

  const handleFormStateChange = (formType, state) => {
    setFormStates(prev => ({
      ...prev,
      [formType]: state
    }))
  }

  const handleSuccess = () => {
    // Reset all form states after successful submission
    setFormStates({
      question: {},
      blog: {},
      quiz: {}
    })
    setFormKey(prev => prev + 1) // Force form remount
    
    if (onPostCreated) {
      onPostCreated()
    }
    onClose()
    // Scroll feed to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  // Reset form states and active tab when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormStates({
        question: {},
        post: {},
        quiz: {}
      })
      setFormKey(prev => prev + 1) // Force form remount on next open
      // Reset active tab to first tab when modal closes
      if (currentPanel === 'quiz' && !tabsOverride?.length) {
        setActiveTab('quiz')
      } else {
        setActiveTab(initialTabOverride || tabs[0] || 'question')
      }
    }
  }, [isOpen, currentPanel, tabs, tabsOverride, initialTabOverride])

  if (!isOpen) return null

  return (
    <div 
      className="create-modal-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-modal-title"
    >
      <div 
        className="create-modal-content" 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-modal-header">
          <h2 id="create-modal-title">
            {currentPanel === 'quiz' ? 'Create Quiz' : 'Create Post'}
          </h2>
          <button 
            className="create-modal-close" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {tabs.length > 0 && (
          <div className="create-modal-tabs">
            {tabs.map(tab => (
              <button
                key={tab}
                className={`create-modal-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => handleTabChange(tab)}
                aria-selected={activeTab === tab}
                role="tab"
              >
                {tab === 'question' ? 'Create Question' : tab === 'blog' ? 'Create Blog Post' : 'Create Quiz'}
              </button>
            ))}
          </div>
        )}

        <div className="create-modal-body">
          <div 
            role="tabpanel" 
            aria-labelledby={`tab-${activeTab}`}
            className="create-modal-tabpanel"
          >
            {activeTab === 'question' && (
              <QuestionForm
                key={`question-${formKey}`}
                ref={firstInputRef}
                onSuccess={handleSuccess}
                onError={(error) => {
                  // Error handling in form component
                }}
                cudetails={cudetails}
                initialState={formStates.question}
                onStateChange={(state) => handleFormStateChange('question', state)}
              />
            )}
            {activeTab === 'blog' && (
              <PostForm
                key={`blog-${formKey}`}
                ref={firstInputRef}
                onSuccess={handleSuccess}
                onError={(error) => {
                  // Error handling in form component
                }}
                cudetails={cudetails}
                initialState={formStates.blog}
                onStateChange={(state) => handleFormStateChange('blog', state)}
              />
            )}
            {activeTab === 'quiz' && (
              <QuizForm
                key={`quiz-${formKey}`}
                ref={firstInputRef}
                onSuccess={handleSuccess}
                onError={(error) => {
                  // Error handling in form component
                }}
                cudetails={cudetails}
                initialState={formStates.quiz}
                onStateChange={(state) => handleFormStateChange('quiz', state)}
              />
            )}
          </div>
        </div>

        <div 
          className="create-modal-aria-live" 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
        >
          {/* ARIA live region for announcements */}
        </div>
      </div>
    </div>
  )
}

export default CreateModal

