import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { getFollowers } from '../../services/db'
import UserRowItem from './UserRowItem'
import '../../style/dash/followersModal.css'

const FollowersModal = ({ onClose, onUpdate }) => {
  const { currentUser } = useAuth()
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentUser) {
      loadFollowers()
    }
  }, [currentUser])

  const loadFollowers = async () => {
    if (!currentUser) return
    setLoading(true)
    const result = await getFollowers(currentUser.uid)
    if (result.success) {
      setFollowers(result.data)
    }
    setLoading(false)
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="followers-modal-overlay" onClick={handleOverlayClick}>
      <div className="followers-modal-content">
        <div className="followers-modal-header">
          <h2>Your Followers</h2>
          <button className="followers-modal-close" onClick={onClose}>
            <FontAwesomeIcon icon="fa-solid fa-times" />
          </button>
        </div>

        <div className="followers-modal-body">
          {loading ? (
            <div className="followers-modal-loading">
              <FontAwesomeIcon icon="fa-solid fa-spinner" spin />
              <span>Loading followers...</span>
            </div>
          ) : followers.length === 0 ? (
            <div className="followers-modal-empty">
              <FontAwesomeIcon icon="fa-solid fa-user-group" />
              <p>No followers yet</p>
            </div>
          ) : (
            <div className="followers-modal-list">
              {followers.map((follower) => (
                <UserRowItem
                  key={follower.uid}
                  user={follower}
                  showFollowButton={true}
                  relationshipTag={follower.isFollowingBack ? "Follows you" : null}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FollowersModal

