import { ref, get, set, query, orderByChild } from 'firebase/database'
import { database } from '../firebase/config'
import { createNotification } from './db'
import { getPost, getUser } from './db'
import { sendNotificationEmail } from '../utils/notificationEmailService'

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
    
    // Create notification for quiz owner
    try {
      // Get quiz post to find the quiz creator
      const postResult = await getPost(postId)
      if (postResult.success && postResult.data) {
        const quizPost = postResult.data
        const quizOwnerId = quizPost.userId || quizPost.createdBy
        
        // Only create notification if quiz taker is not the quiz owner
        if (quizOwnerId && quizOwnerId !== uid) {
          // Get quiz taker user data
          const takerResult = await getUser(uid)
          const takerUsername = takerResult.success 
            ? (takerResult.data.profile?.username || takerResult.data.username || 'Someone')
            : 'Someone'
          
          const quizPercentage = Math.round(resultData.score || 0)
          const message = `${takerUsername} completed your quiz with a score of ${quizPercentage}%`
          
          // Create in-app notification
          await createNotification(quizOwnerId, {
            type: 'quiz_complete',
            fromUserId: uid, // Quiz taker
            postId: postId,
            quizPercentage: quizPercentage,
            message: message,
            read: false
          })
          
          // Send email notification
          try {
            const ownerResult = await getUser(quizOwnerId)
            if (ownerResult.success) {
              const ownerUser = ownerResult.data
              const ownerEmail = ownerUser.email
              
              if (ownerEmail && ownerEmail.includes('@')) {
                const emailResult = await sendNotificationEmail(ownerEmail, {
                  type: 'quiz_complete',
                  memberName: takerUsername,
                  quizPercentage: quizPercentage,
                  postTitle: quizPost.title || 'Quiz',
                  actionLink: typeof window !== 'undefined' ? `${window.location.origin}/home/${postId}` : `https://qconnect.com/home/${postId}`
                })
                
                if (emailResult.success) {
                  console.log(`✓ Quiz completion email sent to quiz owner: ${ownerEmail}`)
                } else {
                  console.warn(`⚠ Failed to send quiz completion email: ${emailResult.error}`)
                }
              }
            }
          } catch (emailError) {
            // Don't fail if email fails
            console.error('Error sending quiz completion email:', emailError)
          }
          
          console.log(`✓ Created quiz_complete notification for quiz owner: ${quizOwnerId}`)
        }
      }
    } catch (notifError) {
      // Don't block quiz result save if notification fails
      console.error('Error creating quiz_complete notification:', notifError)
    }
    
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

