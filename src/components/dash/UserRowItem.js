import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { followUser, unfollowUser, isFollowing } from '../../services/db'
import ThreeDotMenu from './ThreeDotMenu'
import '../../style/dash/userRowItem.css'

const UserRowItem = ({ user, showFollowButton = true, showUnfollowButton = false, onUnfollow, relationshipTag }) => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  const username = user?.profile?.username || user?.username || 'Qconnect user'
  const profilePic = user?.profile?.profilePic || user?.profilePic || ''
  const userId = user?.uid || user?._id

  useEffect(() => {
    if (showFollowButton && currentUser && userId && currentUser.uid !== userId) {
      checkFollowStatus()
    } else {
      setCheckingStatus(false)
    }
  }, [userId, currentUser, showFollowButton])

  const checkFollowStatus = async () => {
    setCheckingStatus(true)
    const result = await isFollowing(currentUser.uid, userId)
    if (result.success) {
      setFollowing(result.isFollowing)
    }
    setCheckingStatus(false)
  }

  const handleFollow = async () => {
    if (!currentUser || currentUser.uid === userId) return
    setLoading(true)
    const result = await followUser(currentUser.uid, userId)
    if (result.success) {
      setFollowing(true)
    }
    setLoading(false)
  }

  const handleUnfollow = async () => {
    if (!currentUser || currentUser.uid === userId) return
    setLoading(true)
    const result = await unfollowUser(currentUser.uid, userId)
    if (result.success) {
      setFollowing(false)
      if (onUnfollow) {
        onUnfollow(userId)
      }
    }
    setLoading(false)
  }

  const handleViewProfile = () => {
    navigate(`/profile/${userId}`)
  }

  const isOwnProfile = currentUser && userId === currentUser.uid

  return (
    <div className="user-row-item">
      <div className="user-row-avatar" onClick={handleViewProfile}>
        {profilePic ? (
          <img 
            src={profilePic} 
            alt={username}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div className="user-row-avatar-placeholder" style={{ display: profilePic ? 'none' : 'flex' }}>
          <FontAwesomeIcon icon="fa-solid fa-user" />
        </div>
      </div>

      <div className="user-row-info" onClick={handleViewProfile}>
        <div className="user-row-name-row">
          <h4 className="user-row-username">{username}</h4>
          {relationshipTag && (
            <span className="user-row-relationship">{relationshipTag}</span>
          )}
        </div>
      </div>

      <div className="user-row-actions">
        {!isOwnProfile && showFollowButton && !showUnfollowButton && (
          <button
            className={`user-row-follow-btn ${following ? 'following' : ''}`}
            onClick={following ? handleUnfollow : handleFollow}
            disabled={loading || checkingStatus}
          >
            {loading ? '...' : checkingStatus ? '...' : following ? 'Following' : 'Follow'}
          </button>
        )}

        {!isOwnProfile && showUnfollowButton && (
          <button
            className="user-row-unfollow-btn"
            onClick={handleUnfollow}
            disabled={loading}
          >
            {loading ? '...' : 'Unfollow'}
          </button>
        )}

        {!isOwnProfile && (
          <ThreeDotMenu 
            userId={userId}
            username={username}
            isFollowing={following}
            onUnfollow={handleUnfollow}
            onFollow={handleFollow}
          />
        )}
      </div>
    </div>
  )
}

export default UserRowItem

