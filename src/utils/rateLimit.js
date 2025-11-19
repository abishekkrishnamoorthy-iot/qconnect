/**
 * Rate limiting utilities for client-side rate limiting
 */

/**
 * Check if rate limit is exceeded
 * @param {string} key - Rate limit key (e.g., 'group_create', 'join_request_<groupId>')
 * @param {number} seconds - Time window in seconds
 * @returns {object} { allowed: boolean, waitTime?: number }
 */
export const checkRateLimit = (key, seconds) => {
  const storageKey = `rate_limit_${key}`
  const lastAction = localStorage.getItem(storageKey)
  
  if (!lastAction) {
    return { allowed: true }
  }
  
  const lastActionTime = parseInt(lastAction, 10)
  const now = Date.now()
  const timeSinceLastAction = (now - lastActionTime) / 1000
  
  if (timeSinceLastAction < seconds) {
    const waitTime = Math.ceil(seconds - timeSinceLastAction)
    return { allowed: false, waitTime }
  }
  
  return { allowed: true }
}

/**
 * Record rate limit action
 * @param {string} key - Rate limit key
 */
export const recordRateLimit = (key) => {
  const storageKey = `rate_limit_${key}`
  localStorage.setItem(storageKey, Date.now().toString())
}

/**
 * Clear rate limit (for testing or reset)
 * @param {string} key - Rate limit key
 */
export const clearRateLimit = (key) => {
  const storageKey = `rate_limit_${key}`
  localStorage.removeItem(storageKey)
}

/**
 * Check and record rate limit for group creation (60 seconds)
 * @param {string} userId - User ID
 * @returns {object} { allowed: boolean, waitTime?: number }
 */
export const checkGroupCreateRateLimit = (userId) => {
  const key = `group_create_${userId}`
  const result = checkRateLimit(key, 60)
  
  if (result.allowed) {
    recordRateLimit(key)
  }
  
  return result
}

/**
 * Check and record rate limit for join request (10 seconds)
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {object} { allowed: boolean, waitTime?: number }
 */
export const checkJoinRequestRateLimit = (userId, groupId) => {
  const key = `join_request_${userId}_${groupId}`
  const result = checkRateLimit(key, 10)
  
  if (result.allowed) {
    recordRateLimit(key)
  }
  
  return result
}

