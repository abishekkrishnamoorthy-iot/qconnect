const User = require('../models/User');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ isActive: true })
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user by username
// @route   GET /api/users/username/:username
// @access  Public
const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username, isActive: true })
      .populate('profile.followers', 'username')
      .populate('profile.following', 'username')
      .populate('profile.groups', 'name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by username error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user posts (questions and quizzes)
// @route   GET /api/users/:userId/posts
// @access  Private
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's questions
    const questionPosts = await Question.find({ user: userId, isActive: true })
      .populate('user', 'username')
      .populate('answers')
      .sort({ createdAt: -1 });

    // Get user's quizzes
    const quizPosts = await Quiz.find({ createdBy: userId, isActive: true })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        questionPosts,
        quizPosts
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { bio, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update profile fields
    if (bio !== undefined) user.profile.bio = bio;
    if (avatar !== undefined) user.profile.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/:userId/follow
// @access  Private
const toggleFollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const userToFollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isFollowing = currentUser.profile.following.includes(userId);

    if (isFollowing) {
      // Unfollow
      currentUser.profile.following.pull(userId);
      userToFollow.profile.followers.pull(currentUserId);
    } else {
      // Follow
      currentUser.profile.following.push(userId);
      userToFollow.profile.followers.push(currentUserId);
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({
      success: true,
      message: isFollowing ? 'User unfollowed successfully' : 'User followed successfully',
      data: {
        isFollowing: !isFollowing
      }
    });
  } catch (error) {
    console.error('Toggle follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getUsers,
  getUserByUsername,
  getUserPosts,
  updateProfile,
  toggleFollowUser
};