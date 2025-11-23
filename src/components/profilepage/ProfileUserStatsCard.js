import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getGroups } from '../../services/db'
import FollowersModal from '../dash/FollowersModal'
import FollowingModal from '../dash/FollowingModal'
import GroupsModal from '../dash/GroupsModal'
import '../../style/profile/profileStatsCard.css'

const ProfileUserStatsCard = () => {
  const { currentUser, userData, signOut } = useAuth()
  const navigate = useNavigate()
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [groupsCount, setGroupsCount] = useState(0)
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false)
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false)
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false)

  const loadGroupsCount = async () => {
    if (!currentUser) return
    
    const result = await getGroups()
    if (result.success) {
      // Count groups where user is a member
      const userGroups = result.data.filter(group => {
        return group.members && group.members[currentUser.uid]
      })
      setGroupsCount(userGroups.length)
    }
  }

  useEffect(() => {
    if (currentUser && userData) {
      // Get counts from userData
      setFollowersCount(userData.followerCount || 0)
      setFollowingCount(userData.followingCount || 0)
      
      // Load groups count
      loadGroupsCount()
    }
  }, [currentUser, userData])

  const handleLogout = async () => {
    const result = await signOut()
    if (result.success) {
      navigate('/login')
    }
  }

  const handleFollowersUpdate = (newCount) => {
    setFollowersCount(newCount)
  }

  const handleFollowingUpdate = (newCount) => {
    setFollowingCount(newCount)
  }

  return (
    <>
      <div className="profile-stats-card">
        <div 
          className="profile-stats-item" 
          onClick={() => setIsFollowersModalOpen(true)}
        >
          <div className="profile-stats-item-left">
            <FontAwesomeIcon icon="fa-solid fa-user-group" className="profile-stats-icon" />
            <span className="profile-stats-label">Followers</span>
          </div>
          <span className="profile-stats-count">{followersCount}</span>
        </div>

        <div 
          className="profile-stats-item" 
          onClick={() => setIsFollowingModalOpen(true)}
        >
          <div className="profile-stats-item-left">
            <FontAwesomeIcon icon="fa-solid fa-user-check" className="profile-stats-icon" />
            <span className="profile-stats-label">Following</span>
          </div>
          <span className="profile-stats-count">{followingCount}</span>
        </div>

        <div 
          className="profile-stats-item" 
          onClick={() => setIsGroupsModalOpen(true)}
        >
          <div className="profile-stats-item-left">
            <FontAwesomeIcon icon="fa-solid fa-people-group" className="profile-stats-icon" />
            <span className="profile-stats-label">Groups</span>
          </div>
          <span className="profile-stats-count">{groupsCount}</span>
        </div>

        <div className="profile-stats-divider" />

        <div 
          className="profile-stats-item profile-stats-item-logout" 
          onClick={handleLogout}
        >
          <div className="profile-stats-item-left">
            <FontAwesomeIcon icon="fa-solid fa-arrow-right-from-bracket" className="profile-stats-icon" />
            <span className="profile-stats-label">Logout</span>
          </div>
        </div>
      </div>

      {isFollowersModalOpen && (
        <FollowersModal 
          onClose={() => setIsFollowersModalOpen(false)}
          onUpdate={handleFollowersUpdate}
        />
      )}

      {isFollowingModalOpen && (
        <FollowingModal 
          onClose={() => setIsFollowingModalOpen(false)}
          onUpdate={handleFollowingUpdate}
        />
      )}

      {isGroupsModalOpen && (
        <GroupsModal 
          onClose={() => setIsGroupsModalOpen(false)}
        />
      )}
    </>
  )
}

export default ProfileUserStatsCard

