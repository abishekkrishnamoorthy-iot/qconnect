import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getGroups, joinGroup, leaveGroup } from '../../services/db'

const TrendingGroups = () => {
  const { currentUser } = useAuth()
  const [trendingGroups, setTrendingGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [joiningGroupId, setJoiningGroupId] = useState(null)

  useEffect(() => {
    loadTrendingGroups()
  }, [])

  const loadTrendingGroups = async () => {
    setLoading(true)
    const result = await getGroups({ privacy: 'public' })
    
    if (result.success) {
      // Sort by member count (descending) and take top 6
      const sorted = result.data
        .map(group => ({
          ...group,
          memberCount: group.members ? Object.keys(group.members).length : 0
        }))
        .sort((a, b) => b.memberCount - a.memberCount)
        .slice(0, 6)
      
      setTrendingGroups(sorted)
    }
    
    setLoading(false)
  }

  const handleJoinToggle = async (groupId, isMember) => {
    if (!currentUser || joiningGroupId) return

    setJoiningGroupId(groupId)

    if (isMember) {
      const result = await leaveGroup(groupId, currentUser.uid)
      if (result.success) {
        loadTrendingGroups()
      }
    } else {
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
            
            return (
              <div key={group._id} className="trending-item">
                <Link 
                  to={`/group/${group._id}`} 
                  className="trending-item-link"
                  style={{ textDecoration: 'none', flex: 1 }}
                >
                  <div className="trending-item-content">
                    <div className="trending-icon">
                      <FontAwesomeIcon icon="fa-solid fa-users" />
                    </div>
                    <div className="trending-details">
                      <h4>{group.name}</h4>
                      <p>{group.memberCount} members</p>
                    </div>
                  </div>
                </Link>
                {currentUser && (
                  <button
                    className={`join-btn ${isMember ? 'joined' : ''}`}
                    onClick={() => handleJoinToggle(group._id, isMember)}
                    disabled={joiningGroupId === group._id}
                  >
                    {joiningGroupId === group._id ? '...' : isMember ? 'Joined' : 'Join'}
                  </button>
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

