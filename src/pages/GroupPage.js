import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/common/Header'
import GroupDetailsPanel from '../components/group/GroupDetailsPanel'
import GroupFeed from '../components/group/GroupFeed'
import TrendingGroups from '../components/dash/TrendingGroups'
import { getGroup } from '../services/db'
import LoadingSpinner from '../components/common/LoadingSpinner'
import '../style/group/grouppage.css'

const GroupPage = () => {
  const { id: groupId } = useParams()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const loadGroup = async () => {
    if (!groupId) {
      setError('Group ID is required')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await getGroup(groupId)
      if (result.success) {
        setGroup(result.data)
      } else {
        setError(result.error || 'Group not found')
      }
    } catch (err) {
      setError('Failed to load group')
      console.error('Error loading group:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, refreshKey])

  const handleGroupUpdated = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="group-page">
        <Header />
        <div className="group-page-loading">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="group-page">
        <Header />
        <div className="group-page-error">
          <p>{error || 'Group not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="group-page">
      <Header />
      <div className="group-page-container">
        <GroupDetailsPanel group={group} onGroupUpdated={handleGroupUpdated} />
        <GroupFeed groupId={groupId} />
        <TrendingGroups />
      </div>
    </div>
  )
}

export default GroupPage

