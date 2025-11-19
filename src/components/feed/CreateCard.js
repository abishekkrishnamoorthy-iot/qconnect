import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import '../../style/feed/createCard.css'

const CreateCard = ({ onOpenModal }) => {
  const { currentUser, userData } = useAuth()

  const handleClick = () => {
    if (onOpenModal) {
      onOpenModal()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const profilePic = userData?.profile?.profilePic || userData?.profilePic || ''

  return (
    <div
      className="create-card"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label="Create post"
    >
      <div className="create-card-avatar">
        {profilePic ? (
          <img 
            src={profilePic} 
            alt={userData?.profile?.username || userData?.username || 'User'} 
            className="create-card-avatar-img"
            onError={(e) => {
              e.target.style.display = 'none'
              const iconElement = e.target.parentElement.querySelector('.create-card-avatar-icon')
              if (iconElement) {
                iconElement.style.display = 'flex'
              }
            }}
          />
        ) : null}
        <FontAwesomeIcon 
          icon="fa-solid fa-user" 
          size='lg' 
          className='create-card-avatar-icon'
          style={{ display: profilePic ? 'none' : 'flex' }}
        />
      </div>
      <div className="create-card-text">
        What is your question?
      </div>
      <div className="create-card-icon">
        <FontAwesomeIcon icon="fa-solid fa-plus" size='sm' />
      </div>
    </div>
  )
}

export default CreateCard

