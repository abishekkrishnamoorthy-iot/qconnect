import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { joinGroup, leaveGroup, getUser } from '../../services/db'

const Grp = ({ group, onJoin }) => {
  const { currentUser } = useAuth()
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creator, setCreator] = useState(null)

  useEffect(() => {
    if (group && currentUser) {
      // Check if current user is a member
      const members = group.members || {}
      setIsMember(!!members[currentUser.uid])

      // Fetch creator info
      if (group.creatorId) {
        getUser(group.creatorId).then(result => {
          if (result.success) {
            setCreator(result.data)
          }
        })
      }
    }
  }, [group, currentUser])

  const handleJoinLeave = async () => {
    if (!currentUser) return

    setLoading(true)

    if (isMember) {
      const result = await leaveGroup(group._id, currentUser.uid)
      if (result.success) {
        setIsMember(false)
        if (onJoin) onJoin()
      }
    } else {
      const result = await joinGroup(group._id, currentUser.uid)
      if (result.success) {
        setIsMember(true)
        if (onJoin) onJoin()
      }
    }

    setLoading(false)
  }

  if (!group) return null

  const memberCount = group.members ? Object.keys(group.members).length : 0

  return (
    <div className='group-card'>
      <img 
        src={group.banner || '/default-banner.jpg'} 
        className="group-card-banner" 
        alt={group.name}
      />
      <img 
        src={group.icon || '/default-icon.png'} 
        className="group-card-icon" 
        alt={group.name}
      />
      <div className="group-card-title">{group.name}</div>
      <div className="group-card-meta">
        {memberCount} {memberCount === 1 ? 'member' : 'members'} • {group.category} • {group.privacy}
      </div>
      <div className="group-card-desc">{group.description}</div>
      {currentUser && (
        <button 
          onClick={handleJoinLeave} 
          disabled={loading}
          className="group-card-join-button"
        >
          {loading ? '...' : isMember ? 'Leave' : 'Join'}
        </button>
      )}
    </div>
  )
}

export default Grp