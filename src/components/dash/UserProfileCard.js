import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import '../../style/dash/userProfileCard.css'

const UserProfileCard = () => {
  const { currentUser, userData } = useAuth()
  const navigate = useNavigate()

  const username = userData?.profile?.username || userData?.username || currentUser?.displayName || 'Qconnect user'
  const email = userData?.email || currentUser?.email || ''
  const profilePic = userData?.profile?.profilePic || userData?.profilePic || ''

  const handleEditProfile = () => {
    navigate('/profile')
  }

  return (
    <div className="user-profile-card">
      <div className="profile-card-avatar">
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
        <div className="profile-card-avatar-placeholder" style={{ display: profilePic ? 'none' : 'flex' }}>
          <FontAwesomeIcon icon="fa-solid fa-user" />
        </div>
      </div>
      
      <div className="profile-card-info">
        <h3 className="profile-card-username">{username}</h3>
        <p className="profile-card-email">{email}</p>
      </div>

      <button className="profile-card-edit-btn" onClick={handleEditProfile}>
        <FontAwesomeIcon icon="fa-solid fa-pencil" />
        <span>Edit Profile</span>
      </button>
    </div>
  )
}

export default UserProfileCard

