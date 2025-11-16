import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState, useEffect } from 'react'
import Popup from 'reactjs-popup'
import { useAuth } from '../../context/AuthContext'
import { createAnswer, followUser, unfollowUser, isFollowing } from '../../services/db'

const Question = ({ post, id, userdetails, onAnswerCreated }) => {
  const { currentUser, userData } = useAuth()
  const [rply, setrply] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const postUserId = post?.userId || post?.user?.userId

  useEffect(() => {
    if (currentUser && postUserId && postUserId !== currentUser.uid) {
      checkFollowStatus()
    }
  }, [currentUser, postUserId])

  const checkFollowStatus = async () => {
    const result = await isFollowing(currentUser.uid, postUserId)
    if (result.success) {
      setFollowing(result.isFollowing)
    }
  }

  const handleFollow = async () => {
    if (!currentUser || !postUserId || postUserId === currentUser.uid) return

    setFollowLoading(true)
    
    if (following) {
      const result = await unfollowUser(currentUser.uid, postUserId)
      if (result.success) {
        setFollowing(false)
      }
    } else {
      const result = await followUser(currentUser.uid, postUserId)
      if (result.success) {
        setFollowing(true)
      }
    }
    
    setFollowLoading(false)
  }

  const handlerply = async (e) => {
    e.preventDefault();
    setError('')

    if (!rply.trim()) {
      setError('Please write an answer')
      return
    }

    if (!currentUser) {
      setError('You must be logged in to answer')
      return
    }

    setLoading(true)

    const result = await createAnswer({
      postId: id,
      userId: currentUser.uid,
      username: userData?.username || 'Unknown',
      answer: rply.trim()
    })

    if (result.success) {
      setrply('')
      if (onAnswerCreated) {
        onAnswerCreated()
      }
      // Close popup - you might need to handle this differently based on reactjs-popup API
    } else {
      setError(result.error || 'Failed to post answer')
    }

    setLoading(false)
  };

  return (
    <div className='questionpanel'>
      <div className="userprofile">
        <div className="img">
          <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
        </div>
        <div className="userdetials">
          <h5>{post?.username || post?.user?.username || 'Unknown'}</h5>
          <h6>Qconnect Professional</h6>
        </div>
        {currentUser && postUserId && postUserId !== currentUser.uid && (
          <div className="followbtn">
            <button onClick={handleFollow} disabled={followLoading}>
              {followLoading ? '...' : following ? 'Unfollow' : 'Follow'}
            </button>
          </div>
        )}
      </div>
      <h1>{post?.title || post?.qpost?.title}</h1>
      {post?.text && <p style={{ marginTop: '10px', color: '#666' }}>{post.text}</p>}
      <Popup trigger={<button className='ansbtn'>Write Answer</button>} position={'left center'}>
        <div className='write'>
          <div className="title">
            <h1>{post?.title || post?.qpost?.title}</h1>
          </div>
          {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
          <form onSubmit={handlerply}>
            <textarea
              className='textarea'
              placeholder='Write your answer'
              id='answer'
              name='ans'
              value={rply}
              onChange={(e) => setrply(e.target.value)}
              disabled={loading}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      </Popup>
    </div>
  )
}

export default Question
