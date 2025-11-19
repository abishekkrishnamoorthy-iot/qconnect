import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import QuizCreationModal from '../quiz/QuizCreationModal'
import '../../style/components/create-form.css'

const QuizForm = forwardRef(({ onSuccess, onError, cudetails, initialState, onStateChange }, ref) => {
  const [isInternalModalOpen, setIsInternalModalOpen] = useState(true)

  useImperativeHandle(ref, () => ({
    focus: () => {
      // Focus will be handled by QuizCreationModal
    }
  }))

  const handleClose = () => {
    setIsInternalModalOpen(false)
    // Don't call onSuccess here - let QuizCreationModal handle it
  }

  const handleQuizCreated = () => {
    if (onSuccess) {
      onSuccess()
    }
    setIsInternalModalOpen(false)
  }

  // This component wraps QuizCreationModal to integrate with CreateModal
  // We render it without the overlay since CreateModal provides that
  if (!isInternalModalOpen) {
    return null
  }

  return (
    <div className="quiz-form-wrapper">
      <QuizCreationModal
        onClose={handleClose}
        onQuizCreated={handleQuizCreated}
        cudetails={cudetails}
        embedded={true} // Flag to indicate it's embedded in another modal
      />
    </div>
  )
})

QuizForm.displayName = 'QuizForm'

export default QuizForm

