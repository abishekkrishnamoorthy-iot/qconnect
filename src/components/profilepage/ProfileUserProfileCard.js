import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import '../../style/profile/profileUserCard.css'

const ProfileUserProfileCard = () => {
  const { currentUser, userData } = useAuth()
  const navigate = useNavigate()

  const username = userData?.profile?.username || userData?.username || currentUser?.displayName || 'Qconnect user'
  const email = userData?.email || currentUser?.email || ''
  const profilePic = userData?.profile?.profilePic || userData?.profilePic || ''
  const isVerified = userData?.profile?.verified || false

  const handleEditProfile = () => {
    navigate('/settings')
  }

  return (
    <div className="profile-user-card">
      <div className="profile-user-card-avatar">
        {profilePic ? (
          <img 
            src={profilePic} 
            alt={username}
            onError={(e) => {
              e.target.style.display = 'none'
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'flex'
              }
            }}
          />
        ) : null}
        <div className="profile-user-card-avatar-placeholder" style={{ display: profilePic ? 'none' : 'flex' }}>
          <FontAwesomeIcon icon="fa-solid fa-user" />
        </div>
        {isVerified && (
          <div className="profile-user-card-verified">
            <FontAwesomeIcon icon="fa-solid fa-check-circle" />
          </div>
        )}
      </div>
      
      <div className="profile-user-card-info">
        <h3 className="profile-user-card-username">
          {username}
          {isVerified && <span className="verified-badge">✓</span>}
        </h3>
        <p className="profile-user-card-email">{email}</p>
      </div>

      <button className="profile-user-card-edit-btn" onClick={handleEditProfile}>
        <FontAwesomeIcon icon="fa-solid fa-pencil" />
        <span>Edit Profile</span>
      </button>
    </div>
  )
}

export default ProfileUserProfileCard

