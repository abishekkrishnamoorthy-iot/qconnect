const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  answer: {
    type: String,
    required: [true, 'Answer content is required'],
    trim: true,
    minlength: [10, 'Answer must be at least 10 characters long'],
    maxlength: [5000, 'Answer cannot exceed 5000 characters']
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isAccepted: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes for better performance
answerSchema.index({ question: 1, createdAt: -1 });
answerSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Answer', answerSchema);