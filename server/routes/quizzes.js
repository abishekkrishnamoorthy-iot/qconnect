const express = require('express');
const router = express.Router();
const {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuizAttempt,
  getUserQuizAttempts
} = require('../controllers/quizController');
const { validateQuiz } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

// @route   GET /api/quizzes
// @desc    Get all quizzes
// @access  Private
router.get('/', auth, getQuizzes);

// @route   POST /api/quizzes
// @desc    Create new quiz
// @access  Private
router.post('/', auth, validateQuiz, createQuiz);

// @route   GET /api/quizzes/attempts
// @desc    Get user's quiz attempts
// @access  Private
router.get('/attempts', auth, getUserQuizAttempts);

// @route   GET /api/quizzes/:id
// @desc    Get single quiz
// @access  Private
router.get('/:id', auth, getQuiz);

// @route   PUT /api/quizzes/:id
// @desc    Update quiz
// @access  Private
router.put('/:id', auth, validateQuiz, updateQuiz);

// @route   DELETE /api/quizzes/:id
// @desc    Delete quiz
// @access  Private
router.delete('/:id', auth, deleteQuiz);

// @route   POST /api/quizzes/:id/attempt
// @desc    Submit quiz attempt
// @access  Private
router.post('/:id/attempt', auth, submitQuizAttempt);

module.exports = router;