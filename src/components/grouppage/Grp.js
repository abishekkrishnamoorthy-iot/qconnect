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
    <div className='grp'>
      <div className="userprofile">
        <div className="img">
          <FontAwesomeIcon icon="fa-solid fa-users" size='xl' className='user'/>
        </div> 
        <div className="userdetials">
          <h5>{group.name}</h5>
          <h6>Created by {creator?.username || 'Unknown'}</h6>
          <h6>{memberCount} {memberCount === 1 ? 'member' : 'members'} • {group.category} • {group.privacy}</h6>
        </div>
        {currentUser && (
          <div className="followbtn">
            <button onClick={handleJoinLeave} disabled={loading}>
              {loading ? '...' : isMember ? 'Leave' : 'Join'}
            </button>
          </div>
        )}
      </div>

      <div className="postcontent">
        <p>{group.description}</p>
        <Link to={`/group/${group._id}`} style={{ color: 'blue', textDecoration: 'underline' }}>
          View Group
        </Link>
      </div>
    </div>
  )
}

export default Grp