import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getUser, getUserGroups, getGroup } from '../../services/db'
import GroupManagementModal from './GroupManagementModal'
import { joinGroup, leaveGroup, requestGroupJoin } from '../../services/db'
import '../../style/group/grouppage.css'

const GroupDetailsPanel = ({ group, onGroupUpdated }) => {
  const { currentUser } = useAuth()
  const [isMember, setIsMember] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)

  // Helper function to get admin user ID
  const getAdminUserId = (group) => {
    if (group.admin) {
      return group.admin
    }
    if (group.admins && Object.keys(group.admins).length > 0) {
      return Object.keys(group.admins)[0]
    }
    if (group.creatorId) {
      return group.creatorId
    }
    return null
  }

  useEffect(() => {
    if (group && currentUser) {
      // Check membership
      const members = group.members || {}
      setIsMember(!!members[currentUser.uid])

      // Check admin status
      const adminUserId = getAdminUserId(group)
      setIsAdmin(adminUserId === currentUser.uid || (group.admins && group.admins[currentUser.uid]))

      // Get member count
      setMemberCount(group.memberCount !== undefined 
        ? group.memberCount 
        : (members ? Object.keys(members).length : 0))

      // Fetch admin user info
      if (adminUserId) {
        getUser(adminUserId).then(result => {
          if (result.success) {
            setAdminUser(result.data)
          }
        })
      }

      // Check for pending request if not a member and group is private
      if (!members[currentUser.uid] && group.privacy === 'private') {
        checkPendingRequest()
      }
    }
  }, [group, currentUser])

  const checkPendingRequest = async () => {
    if (!group?._id || !currentUser) return
    
    try {
      const groupResult = await getGroup(group._id)
      if (groupResult.success) {
        // Check both old and new schema
        const requests = groupResult.data.requests || {}
        const request = requests[currentUser.uid]
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

  const handleJoin = async () => {
    if (!currentUser || !group) return

    setLoading(true)
    try {
      if (group.privacy === 'private') {
        // Request to join
        const result = await requestGroupJoin(group._id, currentUser.uid)
        if (result.success) {
          setHasPendingRequest(true)
        }
      } else {
        // Join immediately
        const result = await joinGroup(group._id, currentUser.uid)
        if (result.success) {
          setIsMember(true)
          // Refresh group data
          if (onGroupUpdated) {
            onGroupUpdated()
          }
        }
      }
    } catch (error) {
      console.error('Error joining group:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!currentUser || !group) return

    setLoading(true)
    try {
      const result = await leaveGroup(group._id, currentUser.uid)
      if (result.success) {
        setIsMember(false)
        // Refresh group data
        if (onGroupUpdated) {
          onGroupUpdated()
        }
      }
    } catch (error) {
      console.error('Error leaving group:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGroupUpdatedFromModal = async () => {
    // Refresh group data after management modal updates
    if (onGroupUpdated) {
      onGroupUpdated()
    }
  }

  if (!group) return null

  const adminName = adminUser 
    ? (adminUser.profile?.username || adminUser.username || 'Unknown')
    : 'Unknown'

  return (
    <div className="group-details-panel">
      {/* Banner */}
      <div className="group-banner">
        <img 
          src={group.banner || group.bannerUrl || '/default-banner.jpg'} 
          alt={group.name}
        />
      </div>

      {/* Profile Picture */}
      <div className="group-profile-pic">
        <img 
          src={group.icon || group.profileUrl || '/default-icon.png'} 
          alt={group.name}
        />
      </div>

      {/* Group Info */}
      <div className="group-info">
        <h2 className="group-name">{group.name || 'Unnamed Group'}</h2>
        <p className="group-description">{group.description || 'No description'}</p>
        
        <div className="group-meta">
          <span className="group-category">{group.category || 'General'}</span>
          <span className="group-privacy">{group.privacy || 'public'}</span>
        </div>

        <div className="group-admin">
          <strong>Admin:</strong> {adminName}
        </div>

        <div className="group-members">
          <strong>{memberCount}</strong> {memberCount === 1 ? 'member' : 'members'}
        </div>
      </div>

      {/* Action Buttons */}
      {currentUser && (
        <div className="group-actions">
          {isAdmin ? (
            <button 
              className="group-action-btn manage-btn"
              onClick={() => setIsManagementModalOpen(true)}
            >
              Manage Group
            </button>
          ) : isMember ? (
            <button 
              className="group-action-btn leave-btn"
              onClick={handleLeave}
              disabled={loading}
            >
              {loading ? 'Leaving...' : 'Leave Group'}
            </button>
          ) : (
            <button 
              className="group-action-btn join-btn"
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

      {/* Management Modal */}
      {isManagementModalOpen && (
        <GroupManagementModal
          group={group}
          onClose={() => setIsManagementModalOpen(false)}
          onGroupUpdated={handleGroupUpdatedFromModal}
        />
      )}
    </div>
  )
}

export default GroupDetailsPanel

