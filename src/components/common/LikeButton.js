import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { toggleLikePost } from '../../services/db'
import '../../style/components/likeButton.css'

const LikeButton = ({ post }) => {
  const { currentUser } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Initialize like state from post data
  useEffect(() => {
    if (post) {
      // Calculate like count
      const likes = post.likes || {}
      const count = typeof likes === 'object' ? Object.keys(likes).length : (Array.isArray(likes) ? likes.length : 0)
      setLikeCount(count)

      // Check if current user has liked
      if (currentUser && likes[currentUser.uid] === true) {
        setIsLiked(true)
      } else {
        setIsLiked(false)
      }
    }
  }, [post, currentUser])

  const handleLike = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUser) {
      return
    }

    if (loading) {
      return
    }

    setLoading(true)

    try {
      const postId = post._id || post.postId
      if (!postId) {
        console.error('Post ID not found')
        setLoading(false)
        return
      }

      const result = await toggleLikePost(postId, currentUser.uid)
      
      if (result.success) {
        setIsLiked(result.isLiked)
        // Update count optimistically
        if (result.isLiked) {
          setLikeCount(prev => prev + 1)
        } else {
          setLikeCount(prev => Math.max(0, prev - 1))
        }
      } else {
        console.error('Failed to toggle like:', result.error)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className={`like-button ${isLiked ? 'liked' : ''} ${loading ? 'loading' : ''}`}
      onClick={handleLike}
      disabled={!currentUser || loading}
      aria-label={isLiked ? 'Unlike this post' : 'Like this post'}
    >
      <FontAwesomeIcon 
        icon={isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"} 
        className="like-icon"
      />
      <span className="like-count">{likeCount}</span>
    </button>
  )
}

export default LikeButton

