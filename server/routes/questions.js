const express = require('express');
const router = express.Router();
const {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleLikeQuestion
} = require('../controllers/questionController');
const { validateQuestion } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

// @route   GET /api/questions
// @desc    Get all questions
// @access  Private
router.get('/', auth, getQuestions);

// @route   POST /api/questions
// @desc    Create new question
// @access  Private
router.post('/', auth, validateQuestion, createQuestion);

// @route   GET /api/questions/:id
// @desc    Get single question
// @access  Private
router.get('/:id', auth, getQuestion);

// @route   PUT /api/questions/:id
// @desc    Update question
// @access  Private
router.put('/:id', auth, validateQuestion, updateQuestion);

// @route   DELETE /api/questions/:id
// @desc    Delete question
// @access  Private
router.delete('/:id', auth, deleteQuestion);

// @route   POST /api/questions/:id/like
// @desc    Like/Unlike question
// @access  Private
router.post('/:id/like', auth, toggleLikeQuestion);

module.exports = router;