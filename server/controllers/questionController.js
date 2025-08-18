const Question = require('../models/Question');
const Answer = require('../models/Answer');

// @desc    Get all questions
// @route   GET /api/questions
// @access  Private
const getQuestions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, search } = req.query;

    // Build query
    let query = { isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { text: { $regex: search, $options: 'i' } }
      ];
    }

    const questions = await Question.find(query)
      .populate('user', 'username')
      .populate('answers')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Add username to each question for compatibility with frontend
    const questionsWithUsername = questions.map(question => ({
      ...question.toObject(),
      username: question.user.username
    }));

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: questionsWithUsername,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Private
const getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('user', 'username')
      .populate({
        path: 'answers',
        populate: {
          path: 'user',
          select: 'username'
        }
      });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Increment views
    question.views += 1;
    await question.save();

    res.json({
      success: true,
      data: {
        qpost: question,
        user: question.user
      }
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new question
// @route   POST /api/questions
// @access  Private
const createQuestion = async (req, res) => {
  try {
    const { title, text, tags, category } = req.body;

    const question = await Question.create({
      user: req.user.id,
      title,
      text: text || '',
      tags: tags || [],
      category: category || 'general'
    });

    const populatedQuestion = await Question.findById(question._id)
      .populate('user', 'username');

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: {
        ...populatedQuestion.toObject(),
        username: populatedQuestion.user.username
      }
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user owns the question
    if (question.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this question'
      });
    }

    const { title, text, tags, category } = req.body;

    question.title = title || question.title;
    question.text = text || question.text;
    question.tags = tags || question.tags;
    question.category = category || question.category;

    await question.save();

    const updatedQuestion = await Question.findById(question._id)
      .populate('user', 'username');

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: updatedQuestion
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if user owns the question or is admin
    if (question.user.toString() !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this question'
      });
    }

    // Soft delete
    question.isActive = false;
    await question.save();

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Like/Unlike question
// @route   POST /api/questions/:id/like
// @access  Private
const toggleLikeQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const existingLike = question.likes.find(
      like => like.user.toString() === req.user.id
    );

    if (existingLike) {
      // Unlike
      question.likes = question.likes.filter(
        like => like.user.toString() !== req.user.id
      );
    } else {
      // Like
      question.likes.push({ user: req.user.id });
    }

    await question.save();

    res.json({
      success: true,
      message: existingLike ? 'Question unliked' : 'Question liked',
      data: {
        likes: question.likes.length,
        isLiked: !existingLike
      }
    });
  } catch (error) {
    console.error('Toggle like question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleLikeQuestion
};