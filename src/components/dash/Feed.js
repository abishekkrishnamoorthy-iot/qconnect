import React, { useState, useEffect } from 'react'
import Post from './Post'
import CreateCard from '../feed/CreateCard'
import CreateModal from '../feed/CreateModal'
import { subscribeToPosts } from '../../services/db'
import { sortPostsByFeedPriority, getUserContextForFeed } from '../../utils/feedOrdering'
import { ref, get } from 'firebase/database'
import { database } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'

const Feed = ({ id, qpost, setqpost, cudetails, groupId }) => {
  const { currentUser, userData } = useAuth()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
    // Use real-time subscription for posts
    const unsubscribe = subscribeToPosts((posts) => {
      // Strict filtering: only show posts posted to "everyone"
      // Never show posts where postedTo is a groupId
      let filteredPosts = posts.filter(post => 
        post.postedTo === "everyone" || !post.postedTo || post.postedTo == null
      )
      
      // Filter out quizzes - Q&A tab only shows questions and posts
      filteredPosts = filteredPosts.filter(post => post.type !== 'quiz')
      
      // Apply feed ordering if user context is available
      if (userContext) {
        filteredPosts = sortPostsByFeedPriority(filteredPosts, userContext)
      } else {
        // Fallback: sort by createdAt DESC
        filteredPosts = filteredPosts.sort((a, b) => {
          const aTime = a.createdAt || 0
          const bTime = b.createdAt || 0
          return bTime - aTime
        })
      }
      
      setqpost(filteredPosts)
    }, {})

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [setqpost, userContext])

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1)
    // Scroll to top to show new post
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div>
      <CreateCard onOpenModal={handleOpenModal} />
      <CreateModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onPostCreated={handlePostCreated}
        cudetails={cudetails}
      />
      {qpost && qpost.length > 0 ? (
        qpost.map(post => (
          <Post 
            key={post._id} 
            post={post} 
            postid={id}
            onDelete={() => {
              // Post will be removed automatically via real-time subscription
            }}
          />
        ))
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          No posts yet. Be the first to post!
        </div>
      )}
    </div>
  )
}

export default Feed
