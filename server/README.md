# Qconnect Backend API

A comprehensive backend API for the Qconnect application - "Where questions connect us all"

## Features

- **User Authentication & Authorization**: JWT-based auth with role-based access control
- **Question & Answer System**: Full CRUD operations for questions and answers
- **Quiz System**: Create, take, and track quiz attempts
- **User Management**: User profiles, following system, and activity tracking
- **Security**: Rate limiting, input validation, and secure password hashing
- **Database**: MongoDB with Mongoose ODM

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Password Hashing**: bcryptjs

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone and navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/qconnect
   JWT_SECRET=your_super_secret_jwt_key_here
   PORT=3500
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:3500`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/username/:username` - Get user by username
- `GET /api/users/:userId/posts` - Get user's posts
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/:userId/follow` - Follow/unfollow user

### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Create new question
- `GET /api/questions/:id` - Get single question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/:id/like` - Like/unlike question

### Answers
- `GET /api/answers/question/:questionId` - Get answers for question
- `POST /api/answers/:questionId` - Create new answer
- `PUT /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer
- `POST /api/answers/:id/accept` - Accept answer
- `POST /api/answers/:id/like` - Like/unlike answer

### Quizzes
- `GET /api/quizzes` - Get all quizzes
- `POST /api/quizzes` - Create new quiz
- `GET /api/quizzes/:id` - Get single quiz
- `PUT /api/quizzes/:id` - Update quiz
- `DELETE /api/quizzes/:id` - Delete quiz
- `POST /api/quizzes/:id/attempt` - Submit quiz attempt
- `GET /api/quizzes/attempts` - Get user's quiz attempts

## Database Models

### User
- Username, email, password (hashed)
- Roles (user, admin, moderator)
- Profile information (bio, avatar, followers, following)
- Activity tracking

### Question
- Title, text content, tags, category
- Associated answers, likes, views
- User ownership and timestamps

### Answer
- Answer content, question reference
- Likes, acceptance status
- User ownership and timestamps

### Quiz
- Quiz title, synopsis, questions array
- Category, difficulty, tags
- Attempt tracking and scoring

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin requests
- **Helmet Security**: Security headers and protection

## Development

### Project Structure
```
server/
├── config/          # Database configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── .env           # Environment variables
├── server.js      # Main server file
└── package.json   # Dependencies and scripts
```

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3500)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details