const express = require('express');
const router = express.Router();
const {
  getAnswersForQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  acceptAnswer,
  toggleLikeAnswer
} = require('../controllers/answerController');
const { validateAnswer } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

// @route   GET /api/answers/question/:questionId
// @desc    Get answers for a question
// @access  Private
router.get('/question/:questionId', auth, getAnswersForQuestion);

// @route   POST /api/answers/:questionId
// @desc    Create new answer
// @access  Private
router.post('/:questionId', auth, validateAnswer, createAnswer);

// @route   PUT /api/answers/:id
// @desc    Update answer
// @access  Private
router.put('/:id', auth, validateAnswer, updateAnswer);

// @route   DELETE /api/answers/:id
// @desc    Delete answer
// @access  Private
router.delete('/:id', auth, deleteAnswer);

// @route   POST /api/answers/:id/accept
// @desc    Accept answer
// @access  Private
router.post('/:id/accept', auth, acceptAnswer);

// @route   POST /api/answers/:id/like
// @desc    Like/Unlike answer
// @access  Private
router.post('/:id/like', auth, toggleLikeAnswer);

module.exports = router;