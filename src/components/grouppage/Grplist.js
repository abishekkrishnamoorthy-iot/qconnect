import React, { useState, useEffect } from 'react'
import Grp from './Grp'
import { getGroups } from '../../services/db'

const Grplist = ({ refreshTrigger }) => {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGroups()
  }, [refreshTrigger])

  const loadGroups = async () => {
    setLoading(true)
    setError('')
    
    const result = await getGroups({ privacy: 'public' })
    
    if (result.success) {
      setGroups(result.data)
    } else {
      setError(result.error || 'Failed to load groups')
    }
    
    setLoading(false)
  }

  if (loading) {
    return <div>Loading groups...</div>
  }

  if (error) {
    return <div style={{color: 'red'}}>{error}</div>
  }

  if (groups.length === 0) {
    return <div>No groups found. Be the first to create one!</div>
  }

  return (
    <div>
      {groups.map(group => (
        <Grp key={group._id} group={group} onJoin={loadGroups} />
      ))}
    </div>
  )
}

export default Grplist