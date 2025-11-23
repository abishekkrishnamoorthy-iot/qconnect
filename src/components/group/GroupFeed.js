import React, { useState, useEffect } from 'react'
import { subscribeToPosts } from '../../services/db'
import Post from '../dash/Post'
import QuizPostCard from '../quiz/QuizPostCard'
import '../../style/group/grouppage.css'
import { normalizePostType } from '../../utils/postTypes'

const GroupFeed = ({ groupId }) => {
  const [posts, setPosts] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!groupId) {
      setLoading(false)
      return
    }

    // Subscribe to posts for this group
    const unsubscribe = subscribeToPosts((allPosts) => {
      // Filter posts by postedTo == groupId
      let filteredPosts = allPosts.filter(post => post.postedTo === groupId)
      
      // Apply tab filter
      if (activeTab === 'qanda') {
        filteredPosts = filteredPosts.filter(post => {
          const type = normalizePostType(post.type)
          return type === 'question' || type === 'blog'
        })
      } else if (activeTab === 'quiz') {
        filteredPosts = filteredPosts.filter(post => normalizePostType(post.type) === 'quiz')
      }
      // 'all' tab shows all post types

      // Sort by createdAt DESC (latest first)
      filteredPosts = filteredPosts.sort((a, b) => {
        const aTime = a.createdAt || 0
        const bTime = b.createdAt || 0
        return bTime - aTime
      })

      setPosts(filteredPosts)
      setLoading(false)
    }, { postedTo: groupId })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [groupId, activeTab])

  if (loading) {
    return (
      <div className="group-feed">
        <div className="group-feed-loading">
          <p>Loading posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="group-feed">
      {/* Tabs */}
      <div className="group-feed-tabs">
        <button
          className={`group-feed-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button
          className={`group-feed-tab ${activeTab === 'qanda' ? 'active' : ''}`}
          onClick={() => setActiveTab('qanda')}
        >
          Q&A
        </button>
        <button
          className={`group-feed-tab ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz')}
        >
          Quiz
        </button>
      </div>

      {/* Feed Content */}
      <div className="group-feed-content">
        {posts.length > 0 ? (
          posts.map(post => {
            if (normalizePostType(post.type) === 'quiz') {
              return (
                <QuizPostCard 
                  key={post._id || post.postId} 
                  post={post}
                  onQuizCreated={() => {}}
                />
              )
            } else {
              return (
                <Post 
                  key={post._id || post.postId} 
                  post={post} 
                  postid={post._id || post.postId}
                  onDelete={() => {}}
                />
              )
            }
          })
        ) : (
          <div className="group-feed-empty">
            <p>No posts yet. Be the first to post in this group!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupFeed

