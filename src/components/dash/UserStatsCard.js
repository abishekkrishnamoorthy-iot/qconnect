import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getGroups } from '../../services/db'
import FollowersModal from './FollowersModal'
import FollowingModal from './FollowingModal'
import GroupsModal from './GroupsModal'
import '../../style/dash/userStatsCard.css'

const UserStatsCard = () => {
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

  return (
    <>
      <div className="user-stats-card">
        <div 
          className="stats-item" 
          onClick={() => setIsFollowersModalOpen(true)}
        >
          <div className="stats-item-left">
            <FontAwesomeIcon icon="fa-solid fa-user-group" className="stats-icon" />
            <span className="stats-label">Followers</span>
          </div>
          <span className="stats-count">{followersCount}</span>
        </div>

        <div 
          className="stats-item" 
          onClick={() => setIsFollowingModalOpen(true)}
        >
          <div className="stats-item-left">
            <FontAwesomeIcon icon="fa-solid fa-user-check" className="stats-icon" />
            <span className="stats-label">Following</span>
          </div>
          <span className="stats-count">{followingCount}</span>
        </div>

        <div 
          className="stats-item" 
          onClick={() => setIsGroupsModalOpen(true)}
        >
          <div className="stats-item-left">
            <FontAwesomeIcon icon="fa-solid fa-people-group" className="stats-icon" />
            <span className="stats-label">Groups</span>
          </div>
          <span className="stats-count">{groupsCount}</span>
        </div>

        <div className="stats-divider" />

        <div 
          className="stats-item stats-item-logout" 
          onClick={handleLogout}
        >
          <div className="stats-item-left">
            <FontAwesomeIcon icon="fa-solid fa-arrow-right-from-bracket" className="stats-icon" />
            <span className="stats-label">Logout</span>
          </div>
        </div>
      </div>

      {isFollowersModalOpen && (
        <FollowersModal 
          onClose={() => setIsFollowersModalOpen(false)}
        />
      )}

      {isFollowingModalOpen && (
        <FollowingModal 
          onClose={() => setIsFollowingModalOpen(false)}
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

export default UserStatsCard

