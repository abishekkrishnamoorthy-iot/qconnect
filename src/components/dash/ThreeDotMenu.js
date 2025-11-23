import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { blockUser } from '../../services/db'
import '../../style/dash/threeDotMenu.css'

const ThreeDotMenu = ({ userId, username, isFollowing, onUnfollow, onFollow }) => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleViewProfile = () => {
    setIsOpen(false)
    navigate(`/profile/${userId}`)
  }

  const handleBlock = async () => {
    if (!currentUser) return
    setIsOpen(false)
    const result = await blockUser(currentUser.uid, userId)
    if (result.success) {
      alert(`${username} has been blocked`)
      // Optionally refresh the page or update the list
      window.location.reload()
    }
  }

  const handleUnfollowClick = () => {
    setIsOpen(false)
    if (onUnfollow) {
      onUnfollow()
    }
  }

  const handleFollowClick = () => {
    setIsOpen(false)
    if (onFollow) {
      onFollow()
    }
  }

  return (
    <div className="three-dot-menu" ref={menuRef}>
      <button 
        className="three-dot-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More options"
      >
        <FontAwesomeIcon icon="fa-solid fa-ellipsis-vertical" />
      </button>

      {isOpen && (
        <div className="three-dot-menu-dropdown">
          <button className="menu-item" onClick={handleViewProfile}>
            <FontAwesomeIcon icon="fa-solid fa-user" />
            <span>View Profile</span>
          </button>
          
          <button className="menu-item" disabled>
            <FontAwesomeIcon icon="fa-solid fa-comments" />
            <span>Chat</span>
            <span className="menu-item-badge">Coming Soon</span>
          </button>

          {isFollowing ? (
            <button className="menu-item menu-item-danger" onClick={handleUnfollowClick}>
              <FontAwesomeIcon icon="fa-solid fa-user-minus" />
              <span>Unfollow</span>
            </button>
          ) : (
            <button className="menu-item" onClick={handleFollowClick}>
              <FontAwesomeIcon icon="fa-solid fa-user-plus" />
              <span>Follow</span>
            </button>
          )}

          <div className="menu-divider" />

          <button className="menu-item menu-item-danger" onClick={handleBlock}>
            <FontAwesomeIcon icon="fa-solid fa-ban" />
            <span>Block User</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default ThreeDotMenu

