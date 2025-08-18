const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validateQuestion = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Question title must be between 10 and 200 characters'),
  
  body('text')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Question text cannot exceed 2000 characters'),
  
  handleValidationErrors
];

const validateAnswer = [
  body('answer')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Answer must be between 10 and 5000 characters'),
  
  handleValidationErrors
];

const validateQuiz = [
  body('quiz.quizTitle')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Quiz title must be between 5 and 100 characters'),
  
  body('quiz.quizSynopsis')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Quiz synopsis must be between 10 and 500 characters'),
  
  body('quiz.questions')
    .isArray({ min: 1 })
    .withMessage('Quiz must have at least one question'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateQuestion,
  validateAnswer,
  validateQuiz,
  handleValidationErrors
};