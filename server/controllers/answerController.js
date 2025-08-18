const Answer = require('../models/Answer');
const Question = require('../models/Question');

// @desc    Get answers for a question
// @route   GET /api/answers/question/:questionId
// @access  Private
const getAnswersForQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const answers = await Answer.find({ 
      question: questionId, 
      isActive: true 
    })
      .populate('user', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ isAccepted: -1, createdAt: -1 });

    // Add username to each answer for compatibility with frontend
    const answersWithUsername = answers.map(answer => ({
      ...answer.toObject(),
      username: answer.user.username
    }));

    const total = await Answer.countDocuments({ 
      question: questionId, 
      isActive: true 
    });

    res.json({
      success: true,
      data: answersWithUsername,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get answers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new answer
// @route   POST /api/answers/:questionId
// @access  Private
const createAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Create answer
    const newAnswer = await Answer.create({
      user: req.user.id,
      question: questionId,
      answer
    });

    // Add answer to question's answers array
    question.answers.push(newAnswer._id);
    await question.save();

    const populatedAnswer = await Answer.findById(newAnswer._id)
      .populate('user', 'username');

    res.status(201).json({
      success: true,
      message: 'Answer created successfully',
      data: {
        ...populatedAnswer.toObject(),
        username: populatedAnswer.user.username
      }
    });
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update answer
// @route   PUT /api/answers/:id
// @access  Private
const updateAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check if user owns the answer
    if (answer.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this answer'
      });
    }

    answer.answer = req.body.answer || answer.answer;
    await answer.save();

    const updatedAnswer = await Answer.findById(answer._id)
      .populate('user', 'username');

    res.json({
      success: true,
      message: 'Answer updated successfully',
      data: updatedAnswer
    });
  } catch (error) {
    console.error('Update answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete answer
// @route   DELETE /api/answers/:id
// @access  Private
const deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check if user owns the answer or is admin
    if (answer.user.toString() !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this answer'
      });
    }

    // Remove answer from question's answers array
    await Question.findByIdAndUpdate(
      answer.question,
      { $pull: { answers: answer._id } }
    );

    // Soft delete
    answer.isActive = false;
    await answer.save();

    res.json({
      success: true,
      message: 'Answer deleted successfully'
    });
  } catch (error) {
    console.error('Delete answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Accept answer
// @route   POST /api/answers/:id/accept
// @access  Private
const acceptAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check if user owns the question
    const question = await Question.findById(answer.question);
    if (question.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the question owner can accept answers'
      });
    }

    // Unaccept all other answers for this question
    await Answer.updateMany(
      { question: answer.question },
      { isAccepted: false }
    );

    // Accept this answer
    answer.isAccepted = true;
    await answer.save();

    res.json({
      success: true,
      message: 'Answer accepted successfully',
      data: answer
    });
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Like/Unlike answer
// @route   POST /api/answers/:id/like
// @access  Private
const toggleLikeAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    const existingLike = answer.likes.find(
      like => like.user.toString() === req.user.id
    );

    if (existingLike) {
      // Unlike
      answer.likes = answer.likes.filter(
        like => like.user.toString() !== req.user.id
      );
    } else {
      // Like
      answer.likes.push({ user: req.user.id });
    }

    await answer.save();

    res.json({
      success: true,
      message: existingLike ? 'Answer unliked' : 'Answer liked',
      data: {
        likes: answer.likes.length,
        isLiked: !existingLike
      }
    });
  } catch (error) {
    console.error('Toggle like answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAnswersForQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  acceptAnswer,
  toggleLikeAnswer
};