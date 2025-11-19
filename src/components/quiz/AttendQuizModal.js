import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { checkQuizCompleted, saveQuizResult } from '../../services/quizDb'
import '../../style/quiz/quiz.css'

const AttendQuizModal = ({ post, onClose }) => {
  const { currentUser } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [answers, setAnswers] = useState([])
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const questions = post?.questions || []
  const totalQuestions = questions.length

  useEffect(() => {
    checkIfCompleted()
  }, [])

  const checkIfCompleted = async () => {
    if (!currentUser || !post?._id && !post?.postId) {
      setError('Invalid quiz data')
      setLoading(false)
      return
    }

    const postId = post._id || post.postId
    const result = await checkQuizCompleted(postId, currentUser.uid)
    
    if (result.success && result.completed) {
      alert('You already completed this quiz.')
      onClose()
      return
    }

    setLoading(false)
    // Initialize answers array
    setAnswers(new Array(totalQuestions).fill(null))
  }

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = answerIndex
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (answers[currentSlide] === null) {
      alert('Please select an answer before proceeding.')
      return
    }

    if (currentSlide < totalQuestions - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleSubmit = async () => {
    if (answers[currentSlide] === null) {
      alert('Please select an answer before submitting.')
      return
    }

    // Calculate score
    let correctCount = 0
    questions.forEach((question, index) => {
      if (answers[index] === question.correct) {
        correctCount++
      }
    })

    const calculatedScore = (correctCount / totalQuestions) * 100

    setScore(calculatedScore)
    setShowResult(true)

    // Save result to Firebase
    const postId = post._id || post.postId
    const resultData = {
      score: calculatedScore,
      answers: answers,
      correctCount: correctCount,
      finishedAt: Date.now()
    }

    await saveQuizResult(postId, currentUser.uid, resultData)

    // Show result for 2 seconds then close
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  if (loading) {
    return (
      <div className="quiz-modal-overlay" onClick={onClose}>
        <div className="quiz-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="quiz-modal-loading">
            <p>Loading quiz...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="quiz-modal-overlay" onClick={onClose}>
        <div className="quiz-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="quiz-modal-error">
            <p>{error}</p>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  if (showResult) {
    return (
      <div className="quiz-modal-overlay" onClick={onClose}>
        <div className="quiz-modal-content quiz-result-content" onClick={(e) => e.stopPropagation()}>
          <h2>Quiz Completed!</h2>
          <div className="quiz-result-score">
            <p className="score-value">{score.toFixed(0)}%</p>
            <p className="score-detail">
              {questions.filter((q, i) => answers[i] === q.correct).length} out of {totalQuestions} correct
            </p>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentSlide]

  return (
    <div className="quiz-modal-overlay" onClick={onClose}>
      <div className="quiz-modal-content quiz-attend-content" onClick={(e) => e.stopPropagation()}>
        <div className="quiz-modal-header">
          <h2>{post.title || 'Quiz'}</h2>
          <button className="quiz-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="quiz-slideshow">
          <div className="quiz-progress">
            Question {currentSlide + 1} of {totalQuestions}
          </div>

          <div className="quiz-question-slide">
            <h3 className="quiz-question-text">{currentQuestion.q}</h3>
            
            <div className="quiz-options">
              {currentQuestion.options.map((option, index) => (
                <label 
                  key={index} 
                  className={`quiz-option-label ${answers[currentSlide] === index ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={`question-${currentSlide}`}
                    value={index}
                    checked={answers[currentSlide] === index}
                    onChange={() => handleAnswerSelect(currentSlide, index)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="quiz-navigation">
            <button
              className="quiz-nav-btn quiz-prev-btn"
              onClick={handlePrevious}
              disabled={currentSlide === 0}
            >
              Previous
            </button>
            
            {currentSlide === totalQuestions - 1 ? (
              <button
                className="quiz-nav-btn quiz-submit-btn"
                onClick={handleSubmit}
              >
                Submit
              </button>
            ) : (
              <button
                className="quiz-nav-btn quiz-next-btn"
                onClick={handleNext}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendQuizModal

