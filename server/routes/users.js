const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserByUsername, 
  getUserPosts, 
  updateProfile, 
  toggleFollowUser 
} = require('../controllers/userController');
const { registerUser } = require('../controllers/authController');
const { validateUserRegistration } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Private
router.get('/', auth, getUsers);

// @route   POST /api/users
// @desc    Register new user (alternative endpoint)
// @access  Public
router.post('/', validateUserRegistration, registerUser);

// @route   GET /api/users/username/:username
// @desc    Get user by username
// @access  Public
router.get('/username/:username', getUserByUsername);

// @route   GET /api/users/:userId/posts
// @desc    Get user posts
// @access  Private
router.get('/:userId/posts', auth, getUserPosts);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, updateProfile);

// @route   POST /api/users/:userId/follow
// @desc    Follow/Unfollow user
// @access  Private
router.post('/:userId/follow', auth, toggleFollowUser);

module.exports = router;