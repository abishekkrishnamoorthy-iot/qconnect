const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const questionRoutes = require('./routes/questions');
const answerRoutes = require('./routes/answers');
const quizRoutes = require('./routes/quizzes');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Qconnect API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/quizzes', quizRoutes);

// Legacy route mappings for frontend compatibility
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/qpost', questionRoutes);
app.use('/answers', answerRoutes);
app.use('/quizpost', quizRoutes);

// Additional legacy endpoints for frontend compatibility
app.get('/currentuser/:username', async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

app.get('/userpost/:userId', async (req, res) => {
  try {
    const Question = require('./models/Question');
    const Quiz = require('./models/Quiz');
    
    const questionPosts = await Question.find({ user: req.params.userId, isActive: true })
      .populate('user', 'username')
      .populate('answers')
      .sort({ createdAt: -1 });

    const quizPosts = await Quiz.find({ createdBy: req.params.userId, isActive: true })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      questionPosts,
      quizPosts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const PORT = process.env.PORT || 3500;

app.listen(PORT, () => {
  console.log(`🚀 Qconnect API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});

module.exports = app;