/**
 * Calculate feed score for a post based on priority rules
 * @param {object} post - Post object
 * @param {object} userContext - User context { uid, following, interests }
 * @returns {number} Score for sorting
 */
export const calculateFeedScore = (post, userContext) => {
  if (!userContext || !userContext.uid) {
    // If no user context, use recency only
    return (post.createdAt || 0) / 1000000 // Normalize timestamp
  }

  let score = 0

  // Priority 1: Posts by followed users (100 points)
  if (userContext.following && userContext.following.includes(post.createdBy || post.userId)) {
    score += 100
  }

  // Priority 2: Topic match (50 points)
  if (userContext.interests && post.topic) {
    const topicLower = post.topic.toLowerCase()
    const hasInterest = userContext.interests.some(interest => 
      interest.toLowerCase() === topicLower
    )
    if (hasInterest) {
      score += 50
    }
  }

  // Priority 3: Engagement (likes * 2 + comments * 3 + answers * 2 + quizAttempts * 3)
  const likesCount = post.likes ? (Array.isArray(post.likes) ? post.likes.length : Object.keys(post.likes).length) : 0
  const commentsCount = post.comments ? (Array.isArray(post.comments) ? post.comments.length : Object.keys(post.comments).length) : 0
  const answersCount = post.answers ? (Array.isArray(post.answers) ? post.answers.length : Object.keys(post.answers).length) : 0
  
  // For quizzes, count results/attempts as engagement
  // Check both 'results' and 'quizResults' fields for compatibility
  const quizAttemptsCount = post.type === 'quiz' 
    ? (post.results ? Object.keys(post.results).length : (post.quizResults ? Object.keys(post.quizResults).length : 0))
    : 0
  
  score += (likesCount * 2) + (commentsCount * 3) + (answersCount * 2) + (quizAttemptsCount * 3)

  // Priority 4: All remaining posts (recent first)
  // Add recency as a small factor to break ties
  const createdAt = post.createdAt || 0
  const now = Date.now()
  const ageInHours = (now - createdAt) / (1000 * 60 * 60)
  
  // Add small recency bonus (newer posts get slightly higher score)
  // This ensures recent posts appear after trending posts
  score += Math.max(0, 10 - (ageInHours / 24)) // Small bonus that decays over 24 hours

  return score
}

/**
 * Sort posts by feed priority
 * @param {Array} posts - Array of post objects
 * @param {object} userContext - User context { uid, following, interests }
 * @returns {Array} Sorted posts array
 */
export const sortPostsByFeedPriority = (posts, userContext = {}) => {
  if (!posts || posts.length === 0) {
    return []
  }

  // Calculate scores for all posts
  const postsWithScores = posts.map(post => ({
    ...post,
    _feedScore: calculateFeedScore(post, userContext)
  }))

  // Sort by score (descending), then by createdAt (descending) as tiebreaker
  return postsWithScores.sort((a, b) => {
    if (b._feedScore !== a._feedScore) {
      return b._feedScore - a._feedScore
    }
    return (b.createdAt || 0) - (a.createdAt || 0)
  })
}

/**
 * Get user context for feed ordering
 * @param {string} uid - User ID
 * @param {function} getUser - Function to get user data
 * @param {function} getFollows - Function to get user's following list
 * @returns {Promise<object>} User context
 */
export const getUserContextForFeed = async (uid, getUser, getFollows) => {
  try {
    const [userResult, followsResult] = await Promise.all([
      getUser ? getUser(uid) : Promise.resolve({ success: false }),
      getFollows ? getFollows(uid) : Promise.resolve({ success: false })
    ])

    const following = followsResult.success && followsResult.data 
      ? Object.keys(followsResult.data) 
      : []

    const interests = userResult.success && userResult.data?.profile?.interests
      ? userResult.data.profile.interests
      : []

    return {
      uid,
      following,
      interests
    }
  } catch (error) {
    console.error('Error getting user context for feed:', error)
    return {
      uid,
      following: [],
      interests: []
    }
  }
}

