import React, { useState, useEffect } from 'react'
import Post from './Post'
import Defaultpost from './Defaultpost'
import AskModal from './AskModal'
import { subscribeToPosts, getPosts } from '../../services/db'

const Feed = ({ id, qpost, setqpost, cudetails, groupId }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Use real-time subscription for posts
    const unsubscribe = subscribeToPosts((posts) => {
      // Filter by group if groupId is provided
      const filteredPosts = groupId 
        ? posts.filter(post => post.groupId === groupId)
        : posts.filter(post => !post.groupId) // Show only non-group posts in main feed
      
      setqpost(filteredPosts)
    }, groupId ? { groupId } : {})

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [groupId, setqpost])

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div>
      <Defaultpost onOpenModal={handleOpenModal} />
      {isModalOpen && (
        <AskModal
          onClose={handleCloseModal}
          onPostCreated={handlePostCreated}
          cudetails={cudetails}
        />
      )}
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
        <div style={{ padding: '20px', textAlign: 'center' }}>
          No posts yet. Be the first to post!
        </div>
      )}
    </div>
  )
}

export default Feed
