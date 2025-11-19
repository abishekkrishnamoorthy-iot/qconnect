import React, { useState, useEffect } from 'react'
import { subscribeToPosts } from '../../services/db'
import QuizPostCard from './QuizPostCard'
import { sortPostsByFeedPriority } from '../../utils/feedOrdering'
import { ref, get } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import '../../style/quiz/quizFeed.css'

const QuizFeed = ({ cudetails, onQuizCreated }) => {
  const { currentUser, userData } = useAuth()
  const [quizPosts, setQuizPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [userContext, setUserContext] = useState(null)

  // Get user context for feed ordering
  useEffect(() => {
    if (currentUser) {
      const loadUserContext = async () => {
        try {
          // Get following list
          const followsRef = ref(database, `follows/${currentUser.uid}`)
          const followsSnapshot = await get(followsRef)
          const following = followsSnapshot.exists() ? Object.keys(followsSnapshot.val()) : []

          // Get interests from userData
          const interests = userData?.profile?.interests || []

          setUserContext({
            uid: currentUser.uid,
            following,
            interests
          })
        } catch (error) {
          console.error('Error loading user context:', error)
          setUserContext({
            uid: currentUser.uid,
            following: [],
            interests: []
          })
        }
      }
      loadUserContext()
    }
  }, [currentUser, userData])

  useEffect(() => {
    // Use subscribeToPosts like AllFeed does - it already filters for postedTo === "everyone"
    // Run subscription immediately, don't wait for userContext
    const unsubscribe = subscribeToPosts((posts) => {
      console.log('QuizFeed: Posts received from subscribeToPosts:', posts.length)
      console.log('QuizFeed: Sample post types:', posts.slice(0, 5).map(p => ({
        id: p._id || p.postId,
        type: p.type || p.postType,
        title: p.title?.substring(0, 30)
      })))
      
      // Filter for quiz posts only with validation
      // Use same strict check as AllFeed: post.type === 'quiz'
      let quizPosts = posts.filter(post => {
        // Skip null/undefined posts
        if (!post || typeof post !== 'object') {
          return false
        }
        
        // Check type field - handle both 'type' and 'postType' for backward compatibility
        const postType = post.type || post.postType
        
        // Strict check: must be exactly 'quiz' (case-sensitive like AllFeed)
        if (postType !== 'quiz') {
          return false
        }
        
        // Validate essential fields - must have at least title and questions
        if (!post.title || !post.questions || !Array.isArray(post.questions) || post.questions.length === 0) {
          console.warn('QuizFeed: Excluding invalid quiz post (missing title or questions):', {
            id: post._id || post.postId,
            hasTitle: !!post.title,
            hasQuestions: !!post.questions,
            questionsLength: post.questions?.length || 0,
            questionsType: typeof post.questions
          })
          return false
        }
        
        // subscribeToPosts already filters for postedTo === "everyone" or !postedTo
        // But let's double-check to be safe
        const postedTo = post.postedTo
        if (postedTo && postedTo !== 'everyone' && typeof postedTo === 'string') {
          console.log('QuizFeed: Excluding quiz post with postedTo (groupId):', postedTo, 'Post ID:', post._id || post.postId)
          return false
        }
        
        // Ensure post has valid ID
        if (!post._id && !post.postId) {
          console.warn('QuizFeed: Excluding quiz post without ID:', post)
          return false
        }
        
        return true
      })
      
      console.log('QuizFeed: Valid quiz posts found after filtering:', quizPosts.length)
      if (quizPosts.length > 0) {
        console.log('QuizFeed: Quiz posts details:', quizPosts.map(q => ({
          id: q._id || q.postId,
          title: q.title,
          postedTo: q.postedTo,
          questionsCount: q.questions?.length || 0,
          hasBanner: !!q.banner,
          hasUserProfilePic: !!q.userProfilePic
        })))
      } else {
        console.warn('QuizFeed: ⚠️ No valid quiz posts found! Check the logs above to see why posts were excluded.')
      }
      
      // Apply feed ordering if user context is available
      if (userContext) {
        quizPosts = sortPostsByFeedPriority(quizPosts, userContext)
      } else {
        // Fallback: sort by createdAt DESC
        quizPosts = quizPosts.sort((a, b) => {
          const aTime = a.createdAt || 0
          const bTime = b.createdAt || 0
          return bTime - aTime // DESC order
        })
      }
      
      console.log('QuizFeed: Final quiz posts to display:', quizPosts.length)
      setQuizPosts(quizPosts)
      setLoading(false)
    }, {})

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [userContext]) // Keep userContext dependency for re-sorting when it changes

  if (loading) {
    return (
      <div className="quiz-feed-loading">
        <p>Loading quizzes...</p>
      </div>
    )
  }

  // Debug: Log what we're about to render
  console.log('QuizFeed: Rendering - quizPosts.length:', quizPosts.length, 'loading:', loading)
  
  return (
    <div className="quiz-feed">
      {quizPosts.length > 0 ? (
        quizPosts
          .filter(post => {
            // Additional defensive check before rendering
            const isValid = post && 
                   (post._id || post.postId) && 
                   post.title && 
                   post.questions && 
                   Array.isArray(post.questions) && 
                   post.questions.length > 0
            
            if (!isValid) {
              console.warn('QuizFeed: Filtering out invalid post before render:', {
                hasPost: !!post,
                hasId: !!(post?._id || post?.postId),
                hasTitle: !!post?.title,
                hasQuestions: !!post?.questions,
                questionsIsArray: Array.isArray(post?.questions),
                questionsLength: post?.questions?.length || 0
              })
            }
            
            return isValid
          })
          .map((post, index) => {
            // Ensure post has all required properties with defaults
            const validPost = {
              ...post,
              _id: post._id || post.postId,
              postId: post.postId || post._id,
              title: post.title || 'Untitled Quiz',
              description: post.description || '',
              banner: post.banner || null,
              userProfilePic: post.userProfilePic || '',
              username: post.username || post.createdByName || 'Unknown',
              createdByName: post.createdByName || post.username || 'Unknown',
              createdBy: post.createdBy || post.userId,
              userId: post.userId || post.createdBy,
              questions: post.questions || [],
              createdAt: post.createdAt || 0
            }
            
            console.log(`QuizFeed: Rendering quiz post ${index + 1}:`, {
              id: validPost._id,
              title: validPost.title,
              questionsCount: validPost.questions.length
            })
            
            return (
              <QuizPostCard 
                key={validPost._id || validPost.postId || `quiz-${index}`} 
                post={validPost}
                onQuizCreated={onQuizCreated}
              />
            )
          })
      ) : (
        <div className="quiz-feed-empty">
          <p>No quizzes yet. Be the first to create one!</p>
        </div>
      )}
    </div>
  )
}

export default QuizFeed

