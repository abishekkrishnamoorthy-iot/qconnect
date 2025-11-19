import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { followUser, unfollowUser, isFollowing } from '../../services/db'
import LikeButton from '../common/LikeButton'
import '../../style/quiz/quizFeed.css'
import AttendQuizModal from './AttendQuizModal'
import LeaderboardModal from './LeaderboardModal'

const QuizPostCard = ({ post, onQuizCreated }) => {
  const { currentUser } = useAuth()
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [showAttendModal, setShowAttendModal] = useState(false)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)

  // Validate post data early but don't return yet (hooks must be called first)
  const isValidPost = post && 
                      post.title && 
                      post.questions && 
                      Array.isArray(post.questions) && 
                      post.questions.length > 0

  const postUserId = post?.createdBy || post?.userId

  useEffect(() => {
    if (!isValidPost) {
      console.warn('QuizPostCard: Invalid post data:', post)
      return
    }
    
    if (currentUser && postUserId && postUserId !== currentUser.uid) {
      checkFollowStatus()
    }
  }, [currentUser, postUserId, isValidPost, post])

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

  const handleAttendQuiz = () => {
    setShowAttendModal(true)
  }

  const handleShowLeaderboard = () => {
    setShowLeaderboardModal(true)
  }

  const handleCloseAttendModal = () => {
    setShowAttendModal(false)
  }

  const handleCloseLeaderboardModal = () => {
    setShowLeaderboardModal(false)
  }

  // Return null after all hooks are called
  if (!isValidPost) {
    console.warn('QuizPostCard: Returning null - invalid post:', {
      hasPost: !!post,
      hasTitle: !!post?.title,
      hasQuestions: !!post?.questions,
      questionsType: typeof post?.questions,
      questionsLength: post?.questions?.length || 0
    })
    return null
  }

  // Debug log for valid posts
  console.log('QuizPostCard: Rendering valid post:', {
    id: post._id || post.postId,
    title: post.title,
    questionsCount: post.questions?.length || 0
  })

  return (
    <>
      <div className='quiz-post-card'>
        <div className="quiz-card-header">
          <div className="quiz-user-profile">
            <div className="quiz-user-img">
              {post.userProfilePic ? (
                <img 
                  src={post.userProfilePic} 
                  alt={post.createdByName || post.username || 'User'} 
                  className="quiz-user-profile-pic"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const iconElement = e.target.parentElement.querySelector('.quiz-user-icon');
                    if (iconElement) {
                      iconElement.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <FontAwesomeIcon 
                icon="fa-solid fa-user" 
                size='xl' 
                className='quiz-user-icon'
                style={{ display: post.userProfilePic ? 'none' : 'flex' }}
              />
            </div>
            <div className="quiz-user-details">
              <h5>{post.createdByName || post.username || 'Unknown'}</h5>
              <h6>Qconnect user</h6>
            </div>
          </div>
          {currentUser && postUserId && postUserId !== currentUser.uid && (
            <div className="quiz-follow-btn">
              <button onClick={handleFollow} disabled={followLoading}>
                {followLoading ? '...' : following ? 'Unfollow' : 'Follow'}
              </button>
            </div>
          )}
        </div>

        {post.banner && (
          <div className="quiz-card-banner">
            <img src={post.banner} alt={post.title || 'Quiz banner'} />
          </div>
        )}

        <div className="quiz-card-content">
          <h2 className="quiz-card-title">{post.title || 'Untitled Quiz'}</h2>
          {post.description && (
            <p className="quiz-card-description">{post.description}</p>
          )}
        </div>

        <div className="quiz-card-actions">
          <LikeButton post={post} />
          <button 
            className="quiz-leaderboard-btn"
            onClick={handleShowLeaderboard}
          >
            Leaderboard
          </button>
          <button 
            className="quiz-attend-btn"
            onClick={handleAttendQuiz}
          >
            Attend Quiz
          </button>
        </div>
      </div>

      {showAttendModal && (
        <AttendQuizModal
          post={post}
          onClose={handleCloseAttendModal}
        />
      )}

      {showLeaderboardModal && (
        <LeaderboardModal
          postId={post._id || post.postId}
          onClose={handleCloseLeaderboardModal}
        />
      )}
    </>
  )
}

export default QuizPostCard

