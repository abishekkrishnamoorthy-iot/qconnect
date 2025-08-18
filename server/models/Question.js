const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    minlength: [10, 'Question title must be at least 10 characters long'],
    maxlength: [200, 'Question title cannot exceed 200 characters']
  },
  text: {
    type: String,
    maxlength: [2000, 'Question text cannot exceed 2000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    enum: ['technology', 'science', 'education', 'general', 'programming', 'other'],
    default: 'general'
  },
  answers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  }],
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
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes for better performance
questionSchema.index({ user: 1, createdAt: -1 });
questionSchema.index({ title: 'text', text: 'text' });
questionSchema.index({ tags: 1 });
questionSchema.index({ category: 1 });

module.exports = mongoose.model('Question', questionSchema);