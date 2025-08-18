const Quiz = require('../models/Quiz');

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Private
const getQuizzes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, difficulty, search } = req.query;

    // Build query
    let query = { isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }

    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    if (search) {
      query.$or = [
        { 'quiz.quizTitle': { $regex: search, $options: 'i' } },
        { 'quiz.quizSynopsis': { $regex: search, $options: 'i' } }
      ];
    }

    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Quiz.countDocuments(query);

    res.json({
      success: true,
      data: quizzes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Private
const createQuiz = async (req, res) => {
  try {
    const { quiz, category, difficulty, tags } = req.body;

    // Validate quiz structure
    if (!quiz || !quiz.quizTitle || !quiz.quizSynopsis || !quiz.questions || quiz.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz data. Title, synopsis, and at least one question are required.'
      });
    }

    // Validate each question
    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i];
      if (!question.question || !question.answers || question.answers.length < 2 || !question.correctAnswer) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} is invalid. Each question must have a question text, at least 2 answers, and a correct answer.`
        });
      }
    }

    const newQuiz = await Quiz.create({
      createdBy: req.user.id,
      quiz,
      category: category || 'general',
      difficulty: difficulty || 'medium',
      tags: tags || []
    });

    const populatedQuiz = await Quiz.findById(newQuiz._id)
      .populate('createdBy', 'username');

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: populatedQuiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private
const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user owns the quiz
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this quiz'
      });
    }

    const { quiz: quizData, category, difficulty, tags } = req.body;

    if (quizData) quiz.quiz = quizData;
    if (category) quiz.category = category;
    if (difficulty) quiz.difficulty = difficulty;
    if (tags) quiz.tags = tags;

    await quiz.save();

    const updatedQuiz = await Quiz.findById(quiz._id)
      .populate('createdBy', 'username');

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: updatedQuiz
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user owns the quiz or is admin
    if (quiz.createdBy.toString() !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this quiz'
      });
    }

    // Soft delete
    quiz.isActive = false;
    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:id/attempt
// @access  Private
const submitQuizAttempt = async (req, res) => {
  try {
    const { score, totalQuestions, correctAnswers } = req.body;
    
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Add attempt to quiz
    quiz.attempts.push({
      user: req.user.id,
      score,
      totalQuestions,
      correctAnswers
    });

    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz attempt submitted successfully',
      data: {
        score,
        totalQuestions,
        correctAnswers,
        percentage: Math.round((correctAnswers / totalQuestions) * 100)
      }
    });
  } catch (error) {
    console.error('Submit quiz attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user's quiz attempts
// @route   GET /api/quizzes/attempts
// @access  Private
const getUserQuizAttempts = async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      'attempts.user': req.user.id
    })
      .populate('createdBy', 'username')
      .select('quiz.quizTitle attempts createdBy createdAt');

    const userAttempts = quizzes.map(quiz => {
      const userAttempt = quiz.attempts.find(
        attempt => attempt.user.toString() === req.user.id
      );
      
      return {
        quiz: {
          id: quiz._id,
          title: quiz.quiz.quizTitle,
          createdBy: quiz.createdBy
        },
        attempt: userAttempt
      };
    });

    res.json({
      success: true,
      data: userAttempts
    });
  } catch (error) {
    console.error('Get user quiz attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuizAttempt,
  getUserQuizAttempts
};