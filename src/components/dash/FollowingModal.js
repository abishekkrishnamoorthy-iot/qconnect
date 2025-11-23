import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { getFollowing } from '../../services/db'
import UserRowItem from './UserRowItem'
import '../../style/dash/followingModal.css'

const FollowingModal = ({ onClose }) => {
  const { currentUser } = useAuth()
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentUser) {
      loadFollowing()
    }
  }, [currentUser])

  const loadFollowing = async () => {
    if (!currentUser) return
    setLoading(true)
    const result = await getFollowing(currentUser.uid)
    if (result.success) {
      setFollowing(result.data)
    }
    setLoading(false)
  }

  const handleUnfollow = (userId) => {
    setFollowing(prev => prev.filter(user => user.uid !== userId))
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="following-modal-overlay" onClick={handleOverlayClick}>
      <div className="following-modal-content">
        <div className="following-modal-header">
          <h2>Following</h2>
          <button className="following-modal-close" onClick={onClose}>
            <FontAwesomeIcon icon="fa-solid fa-times" />
          </button>
        </div>

        <div className="following-modal-body">
          {loading ? (
            <div className="following-modal-loading">
              <FontAwesomeIcon icon="fa-solid fa-spinner" spin />
              <span>Loading following...</span>
            </div>
          ) : following.length === 0 ? (
            <div className="following-modal-empty">
              <FontAwesomeIcon icon="fa-solid fa-user-check" />
              <p>Not following anyone yet</p>
            </div>
          ) : (
            <div className="following-modal-list">
              {following.map((user) => (
                <UserRowItem
                  key={user.uid}
                  user={user}
                  showUnfollowButton={true}
                  onUnfollow={handleUnfollow}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FollowingModal

