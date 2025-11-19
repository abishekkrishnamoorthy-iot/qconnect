import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { joinGroup, leaveGroup, requestGroupJoin, cancelGroupRequest, getUser, getGroup } from '../../services/db'

const Grp = ({ group, onJoin }) => {
  const { currentUser } = useAuth()
  const [isMember, setIsMember] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creator, setCreator] = useState(null)

  useEffect(() => {
    if (group && currentUser) {
      // Check if current user is a member
      const members = group.members || {}
      setIsMember(!!members[currentUser.uid])

      // Check for pending request if not a member and group is private
      if (!members[currentUser.uid] && group.privacy === 'private') {
        checkPendingRequest()
      }

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

  const checkPendingRequest = async () => {
    if (!group?._id || !currentUser) return
    
    try {
      // Refresh group data to get latest requests
      const groupResult = await getGroup(group._id)
      if (groupResult.success && groupResult.data.requests) {
        const request = groupResult.data.requests[currentUser.uid]
        if (request && (request.status === 'pending' || !request.status)) {
          setHasPendingRequest(true)
        } else {
          setHasPendingRequest(false)
        }
      }
    } catch (error) {
      console.error('Error checking pending request:', error)
    }
  }

  const handleJoinLeave = async () => {
    if (!currentUser) return

    setLoading(true)

    if (isMember) {
      // Leave group
      const result = await leaveGroup(group._id, currentUser.uid)
      if (result.success) {
        setIsMember(false)
        if (onJoin) onJoin()
      }
    } else if (group.privacy === 'private') {
      // Private group: handle request flow
      if (hasPendingRequest) {
        // Cancel pending request
        const result = await cancelGroupRequest(group._id, currentUser.uid, currentUser.uid)
        if (result.success) {
          setHasPendingRequest(false)
          if (onJoin) onJoin()
        }
      } else {
        // Request to join
        const result = await requestGroupJoin(group._id, currentUser.uid)
        if (result.success) {
          setHasPendingRequest(true)
          if (onJoin) onJoin()
        }
      }
    } else {
      // Public group: join immediately
      const result = await joinGroup(group._id, currentUser.uid)
      if (result.success) {
        setIsMember(true)
        if (onJoin) onJoin()
      }
    }

    setLoading(false)
  }

  if (!group) return null

  const memberCount = group.memberCount !== undefined 
    ? group.memberCount 
    : (group.members ? Object.keys(group.members).length : 0)
  
  // Determine button text and state
  let buttonText = 'Join'
  let buttonDisabled = loading
  
  if (isMember) {
    buttonText = 'Leave'
  } else if (group.privacy === 'private') {
    if (hasPendingRequest) {
      buttonText = 'Cancel Request'
    } else {
      buttonText = 'Request to Join'
    }
  }

  return (
    <Link to={`/group/${group._id}`} className="group-card-link">
      <div className='group-card' onClick={(e) => {
        // Don't navigate if clicking on buttons
        if (e.target.closest('button')) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}>
        <img 
          src={group.banner || group.bannerUrl || '/default-banner.jpg'} 
          className="group-card-banner" 
          alt={group.name}
        />
        <img 
          src={group.icon || group.profileUrl || '/default-icon.png'} 
          className="group-card-icon" 
          alt={group.name}
        />
        <div className="group-card-title">{group.name || 'Unnamed Group'}</div>
        <div className="group-card-meta">
          {memberCount} {memberCount === 1 ? 'member' : 'members'} • {group.category || 'Others'} • {group.privacy || 'public'}
        </div>
        <div className="group-card-desc">{group.description || 'No description'}</div>
        {currentUser && (
          <div className="group-card-actions">
            {isMember ? (
              <>
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleJoinLeave()
                  }}
                  disabled={buttonDisabled}
                  className="group-card-button leave-button"
                >
                  {loading ? '...' : 'Leave'}
                </button>
                <Link 
                  to={`/group/${group._id}`}
                  className="group-card-button view-button"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Group
                </Link>
              </>
            ) : (
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleJoinLeave()
                }}
                disabled={buttonDisabled || hasPendingRequest}
                className="group-card-button join-button"
              >
                {loading 
                  ? '...' 
                  : hasPendingRequest 
                    ? 'Request Pending' 
                    : group.privacy === 'private' 
                      ? 'Request' 
                      : 'Join'}
              </button>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

export default Grp