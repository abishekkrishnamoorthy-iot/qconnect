import React, { useState, useEffect } from 'react'
import Header from '../common/Header'
import Grpnav from './Grpnav'
import Grp from './Grp'
import { useAuth } from '../../context/AuthContext'
import { getGroups } from '../../services/db'

const Followedgrp = () => {
  const { currentUser } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadJoinedGroups()
  }, [currentUser])

  const loadJoinedGroups = async () => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    setLoading(true)
    const result = await getGroups()
    
    if (result.success) {
      // Filter groups where user is a member
      const joinedGroups = result.data.filter(group => {
        const members = group.members || {}
        return !!members[currentUser.uid]
      })
      setGroups(joinedGroups)
    }
    
    setLoading(false)
  }

  return (
    <div className='fgrp'>
        <Header/>
        <div className='fgrpcon'>
            <Grpnav/>
            {loading ? (
              <div>Loading your groups...</div>
            ) : groups.length === 0 ? (
              <div>You haven't joined any groups yet.</div>
            ) : (
              <div>
                {groups.map(group => (
                  <Grp key={group._id} group={group} onJoin={loadJoinedGroups} />
                ))}
              </div>
            )}
        </div>
    </div>
  )
}

export default Followedgrp