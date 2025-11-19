import { createPost } from '../services/db'

/**
 * Unified function to save posts to Firebase
 * Supports question, post, and quiz types
 * @param {object} postData - Post data matching unified schema
 * @returns {Promise<object>} { success: boolean, postId?: string, error?: string }
 */
export const savePostToFirebase = async (postData) => {
  try {
    // Use existing createPost function which already handles the schema
    const result = await createPost(postData)
    return result
  } catch (error) {
    console.error('Error saving post to Firebase:', error)
    return {
      success: false,
      error: error.message || 'Failed to save post'
    }
  }
}

