import { ref, get, set, query, orderByChild } from 'firebase/database'
import { database } from '../firebase/config'

/**
 * Check if user has already completed a quiz
 * @param {string} postId - Quiz post ID
 * @param {string} uid - User ID
 */
export const checkQuizCompleted = async (postId, uid) => {
  try {
    const resultRef = ref(database, `posts/${postId}/results/${uid}`)
    const snapshot = await get(resultRef)
    return { success: true, completed: snapshot.exists() }
  } catch (error) {
    console.error('Error checking quiz completion:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Save quiz result
 * @param {string} postId - Quiz post ID
 * @param {string} uid - User ID
 * @param {object} resultData - Result data { score, answers, correctCount, finishedAt }
 */
export const saveQuizResult = async (postId, uid, resultData) => {
  try {
    const resultRef = ref(database, `posts/${postId}/results/${uid}`)
    await set(resultRef, {
      score: resultData.score,
      answers: resultData.answers,
      correctCount: resultData.correctCount,
      finishedAt: resultData.finishedAt || Date.now()
    })
    return { success: true }
  } catch (error) {
    console.error('Error saving quiz result:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all quiz results for a post
 * @param {string} postId - Quiz post ID
 */
export const getQuizResults = async (postId) => {
  try {
    const resultsRef = ref(database, `posts/${postId}/results`)
    const snapshot = await get(resultsRef)
    
    if (snapshot.exists()) {
      const results = snapshot.val()
      // Convert to array with uid
      const resultsArray = Object.keys(results).map(uid => ({
        uid,
        ...results[uid]
      }))
      return { success: true, data: resultsArray }
    }
    
    return { success: true, data: [] }
  } catch (error) {
    console.error('Error getting quiz results:', error)
    return { success: false, error: error.message }
  }
}

