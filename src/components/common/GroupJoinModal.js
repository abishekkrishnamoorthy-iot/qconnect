import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { getUser, getGroup, joinGroup, requestGroupJoin } from '../../services/db'
import { useNavigate } from 'react-router-dom'

const GroupJoinModal = ({ group, onClose, onJoinSuccess }) => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [isMember, setIsMember] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [loading, setLoading] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => {
    if (group && currentUser) {
      checkMembership()
      fetchAdminInfo()
      updateMemberCount()
    }
  }, [group, currentUser])

  const checkMembership = async () => {
    if (!group?._id || !currentUser) return

    try {
      const groupResult = await getGroup(group._id)
      if (groupResult.success) {
        const members = groupResult.data.members || {}
        setIsMember(!!members[currentUser.uid])

        // Check for pending request if not a member and group is private
        if (!members[currentUser.uid] && groupResult.data.privacy === 'private') {
          const requests = groupResult.data.requests || {}
          const request = requests[currentUser.uid]
          if (request && (request.status === 'pending' || !request.status)) {
            setHasPendingRequest(true)
          } else {
            setHasPendingRequest(false)
          }
        }
      }
    } catch (error) {
      console.error('Error checking membership:', error)
    }
  }

  const fetchAdminInfo = async () => {
    if (!group) return

    const adminUserId = group.creatorId || (group.admins && Object.keys(group.admins)[0]) || group.admin
    if (adminUserId) {
      const userResult = await getUser(adminUserId)
      if (userResult.success) {
        setAdminUser(userResult.data)
      }
    }
  }

  const updateMemberCount = () => {
    if (!group) return
    const members = group.members || {}
    setMemberCount(group.memberCount !== undefined ? group.memberCount : Object.keys(members).length)
  }

  const handleJoin = async () => {
    if (!currentUser || !group) return

    setLoading(true)
    try {
      if (group.privacy === 'private') {
        const result = await requestGroupJoin(group._id, currentUser.uid)
        if (result.success) {
          setHasPendingRequest(true)
        } else {
          alert(result.error || 'Failed to request join')
        }
      } else {
        const result = await joinGroup(group._id, currentUser.uid)
        if (result.success) {
          setIsMember(true)
          if (onJoinSuccess) {
            onJoinSuccess()
          }
          // Close modal and navigate after a short delay
          setTimeout(() => {
            onClose()
            navigate(`/group/${group._id}`)
          }, 500)
        } else {
          alert(result.error || 'Failed to join group')
        }
      }
    } catch (error) {
      console.error('Error joining group:', error)
      alert('An error occurred while joining the group')
    } finally {
      setLoading(false)
    }
  }

  const handleViewGroup = () => {
    onClose()
    navigate(`/group/${group._id}`)
  }

  if (!group) return null

  const adminName = adminUser
    ? (adminUser.profile?.username || adminUser.username || 'Unknown')
    : 'Unknown'

  return (
    <div className="group-join-modal-overlay" onClick={onClose}>
      <div className="group-join-modal" onClick={(e) => e.stopPropagation()}>
        <button className="group-join-modal-close" onClick={onClose}>
          <FontAwesomeIcon icon="fa-solid fa-times" />
        </button>

        {/* Banner */}
        <div className="group-join-modal-banner">
          <img
            src={group.banner || group.bannerUrl || '/default-banner.jpg'}
            alt={group.name}
          />
        </div>

        {/* Profile Picture */}
        <div className="group-join-modal-icon">
          <img
            src={group.icon || group.profileUrl || '/default-icon.png'}
            alt={group.name}
          />
        </div>

        {/* Group Info */}
        <div className="group-join-modal-info">
          <h2 className="group-join-modal-name">{group.name || 'Unnamed Group'}</h2>
          <p className="group-join-modal-description">{group.description || 'No description'}</p>

          <div className="group-join-modal-meta">
            <span className="group-join-modal-category">{group.category || 'General'}</span>
            <span className="group-join-modal-privacy">{group.privacy || 'public'}</span>
          </div>

          <div className="group-join-modal-details">
            <div className="group-join-modal-detail-item">
              <strong>Admin:</strong> {adminName}
            </div>
            <div className="group-join-modal-detail-item">
              <strong>{memberCount}</strong> {memberCount === 1 ? 'member' : 'members'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {currentUser && (
          <div className="group-join-modal-actions">
            {isMember ? (
              <button
                className="group-join-modal-btn view-btn"
                onClick={handleViewGroup}
              >
                View Group
              </button>
            ) : (
              <button
                className="group-join-modal-btn join-btn"
                onClick={handleJoin}
                disabled={loading || hasPendingRequest}
              >
                {loading
                  ? 'Processing...'
                  : hasPendingRequest
                    ? 'Request Pending'
                    : group.privacy === 'private'
                      ? 'Request to Join'
                      : 'Join Group'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupJoinModal

