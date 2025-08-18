const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Group name must be at least 3 characters long'],
    maxlength: [50, 'Group name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Group description is required'],
    trim: true,
    maxlength: [500, 'Group description cannot exceed 500 characters']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  category: {
    type: String,
    enum: ['technology', 'science', 'education', 'general', 'programming', 'other'],
    default: 'general'
  },
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes for better performance
groupSchema.index({ creator: 1 });
groupSchema.index({ category: 1 });
groupSchema.index({ privacy: 1 });
groupSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Group', groupSchema);