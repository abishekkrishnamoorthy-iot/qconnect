import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
  const { currentUser, userData, signOut } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  const handleLogout = async () => {
    const result = await signOut()
    if (result.success) {
      navigate('/login')
    }
  }

  const toggleDropdown = () => setIsOpen(prev => !prev)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <>
      {isOpen && <div className="profile-dropdown-overlay" onClick={() => setIsOpen(false)} />}
      <div className="profile-trigger-wrapper" ref={wrapperRef}>
        <button
          type="button"
          className='profile profile-trigger'
          onClick={toggleDropdown}
          aria-expanded={isOpen}
        >
          <div className="proimg">
            {userData?.profile?.profilePic || userData?.profilePic ? (
              <img 
                src={userData?.profile?.profilePic || userData?.profilePic} 
                alt={userData?.username || currentUser?.displayName || 'Profile'} 
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <FontAwesomeIcon icon="fa-solid fa-user" size='2xl' />
            )}
          </div>
        </button>

        {isOpen && (
          <div className="profile-dropdown-card">
            <div className="profile-dropdown-header">
              <div className="profile-dropdown-avatar">
                {userData?.profile?.profilePic || userData?.profilePic ? (
                  <img
                    src={userData?.profile?.profilePic || userData?.profilePic}
                    alt={userData?.username || currentUser?.displayName || 'Profile'}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <FontAwesomeIcon icon="fa-solid fa-user" color="#7c6640" />
                )}
              </div>
              <div className="profile-dropdown-info">
                <h4>{userData?.profile?.username || userData?.username || currentUser?.displayName || 'Qconnect user'}</h4>
                <p>{userData?.email || currentUser?.email}</p>
              </div>
            </div>
            <div className="profile-dropdown-actions">
              <button
                className="profile-dropdown-btn primary"
                onClick={() => {
                  navigate('/profile')
                  setIsOpen(false)
                }}
              >
                View Profile
              </button>
              <button
                className="profile-dropdown-btn secondary"
                onClick={() => {
                  navigate('/settings')
                  setIsOpen(false)
                }}
              >
                Settings
              </button>
            </div>
            <div className="profile-dropdown-divider" />
            <button
              className="profile-dropdown-btn danger"
              onClick={handleLogout}
            >
              <FontAwesomeIcon icon="fa-solid fa-arrow-right-from-bracket" />
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default Profile