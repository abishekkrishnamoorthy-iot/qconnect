const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    quizTitle: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      minlength: [5, 'Quiz title must be at least 5 characters long'],
      maxlength: [100, 'Quiz title cannot exceed 100 characters']
    },
    quizSynopsis: {
      type: String,
      required: [true, 'Quiz synopsis is required'],
      trim: true,
      maxlength: [500, 'Quiz synopsis cannot exceed 500 characters']
    },
    questions: [{
      question: {
        type: String,
        required: true,
        trim: true
      },
      questionType: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
      },
      answers: [{
        type: String,
        required: true,
        trim: true
      }],
      correctAnswer: {
        type: String,
        required: true
      },
      messageForCorrectAnswer: {
        type: String,
        required: true,
        trim: true
      },
      messageForIncorrectAnswer: {
        type: String,
        required: true,
        trim: true
      },
      explanation: {
        type: String,
        required: true,
        trim: true
      },
      point: {
        type: Number,
        required: true,
        min: 1,
        max: 100
      }
    }]
  },
  category: {
    type: String,
    enum: ['technology', 'science', 'education', 'general', 'programming', 'other'],
    default: 'general'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  attempts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: {
      type: Number,
      min: 0
    },
    totalQuestions: {
      type: Number,
      min: 0
    },
    correctAnswers: {
      type: Number,
      min: 0
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for better performance
quizSchema.index({ createdBy: 1, createdAt: -1 });
quizSchema.index({ category: 1 });
quizSchema.index({ difficulty: 1 });
quizSchema.index({ tags: 1 });

module.exports = mongoose.model('Quiz', quizSchema);