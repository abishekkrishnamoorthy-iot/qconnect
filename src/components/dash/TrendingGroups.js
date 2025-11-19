import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getGroups, joinGroup, leaveGroup, requestGroupJoin, cancelGroupRequest, getGroup } from '../../services/db'
import '../../style/group/grouppage.css'

const TrendingGroups = () => {
  const { currentUser } = useAuth()
  const [trendingGroups, setTrendingGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [joiningGroupId, setJoiningGroupId] = useState(null)
  const [pendingRequests, setPendingRequests] = useState({})

  useEffect(() => {
    loadTrendingGroups()
  }, [])

  useEffect(() => {
    if (currentUser && trendingGroups.length > 0) {
      // Check for pending requests in private groups
      trendingGroups.forEach(group => {
        if (group.privacy === 'private' && !group.members?.[currentUser.uid]) {
          checkPendingRequest(group._id)
        }
      })
    }
  }, [trendingGroups, currentUser])

  const checkPendingRequest = async (groupId) => {
    if (!groupId || !currentUser) return
    
    try {
      const groupResult = await getGroup(groupId)
      if (groupResult.success && groupResult.data.requests) {
        const request = groupResult.data.requests[currentUser.uid]
        if (request && (request.status === 'pending' || !request.status)) {
          setPendingRequests(prev => ({ ...prev, [groupId]: true }))
        } else {
          setPendingRequests(prev => ({ ...prev, [groupId]: false }))
        }
      }
    } catch (error) {
      console.error('Error checking pending request:', error)
    }
  }

  const loadTrendingGroups = async () => {
    setLoading(true)
    const result = await getGroups({ privacy: 'public' })
    
    if (result.success) {
      // Sort by member count (descending) and take top 4
      const sorted = result.data
        .map(group => ({
          ...group,
          memberCount: group.memberCount !== undefined 
            ? group.memberCount 
            : (group.members ? Object.keys(group.members).length : 0)
        }))
        .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
        .slice(0, 4)
      
      setTrendingGroups(sorted)
    }
    
    setLoading(false)
  }

  const handleJoinToggle = async (groupId, group) => {
    if (!currentUser || joiningGroupId === groupId) return

    setJoiningGroupId(groupId)

    const isMember = group.members?.[currentUser.uid]
    const hasPending = pendingRequests[groupId]

    if (isMember) {
      // Leave group
      const result = await leaveGroup(groupId, currentUser.uid)
      if (result.success) {
        loadTrendingGroups()
      }
    } else if (group.privacy === 'private') {
      // Private group: handle request flow
      if (hasPending) {
        // Cancel pending request
        const result = await cancelGroupRequest(groupId, currentUser.uid, currentUser.uid)
        if (result.success) {
          setPendingRequests(prev => ({ ...prev, [groupId]: false }))
          loadTrendingGroups()
        }
      } else {
        // Request to join
        const result = await requestGroupJoin(groupId, currentUser.uid)
        if (result.success) {
          setPendingRequests(prev => ({ ...prev, [groupId]: true }))
          loadTrendingGroups()
        }
      }
    } else {
      // Public group: join immediately
      const result = await joinGroup(groupId, currentUser.uid)
      if (result.success) {
        loadTrendingGroups()
      }
    }

    setJoiningGroupId(null)
  }

  return (
    <div className='trending-groups'>
      <div className="trending-header">
        <FontAwesomeIcon icon="fa-solid fa-fire" size='lg' />
        <h1>Trending Groups</h1>
      </div>
      <div className="trending-list">
        {loading ? (
          <div style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
            Loading...
          </div>
        ) : trendingGroups.length === 0 ? (
          <div style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
            No groups yet
          </div>
        ) : (
          trendingGroups.map(group => {
            const isMember = currentUser && group.members?.[currentUser.uid]
            const hasPending = pendingRequests[group._id] || false
            const memberCount = group.memberCount !== undefined 
              ? group.memberCount 
              : (group.members ? Object.keys(group.members).length : 0)
            
            // Determine button text
            let buttonText = 'Join'
            if (isMember) {
              buttonText = 'Leave'
            } else if (group.privacy === 'private') {
              buttonText = hasPending ? 'Cancel Request' : 'Request to Join'
            }
            
            return (
              <div key={group._id} className="group-card">
                <Link 
                  to={`/group/${group._id}`} 
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
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
                  <div className="group-card-title">{group.name || 'Unnamed Group'}</div>
                  <div className="group-card-meta">
                    {memberCount} {memberCount === 1 ? 'member' : 'members'} • {group.category || 'Others'} • {group.privacy || 'public'}
                  </div>
                  <div className="group-card-desc">{group.description || 'No description'}</div>
                </Link>
                {currentUser && (
                  <>
                    {isMember && (
                      <div style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: '8px', marginBottom: '4px' }}>
                        Member
                      </div>
                    )}
                    <button
                      className="group-card-join-button"
                      onClick={(e) => {
                        e.preventDefault()
                        handleJoinToggle(group._id, group)
                      }}
                      disabled={joiningGroupId === group._id}
                    >
                      {joiningGroupId === group._id ? '...' : buttonText}
                    </button>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default TrendingGroups

