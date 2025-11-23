import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { getGroups } from '../../services/db'
import '../../style/dash/groupsModal.css'

const GroupsModal = ({ onClose }) => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentUser) {
      loadUserGroups()
    }
  }, [currentUser])

  const loadUserGroups = async () => {
    if (!currentUser) return
    setLoading(true)
    const result = await getGroups()
    if (result.success) {
      // Filter groups where user is a member
      const userGroups = result.data.filter(group => {
        return group.members && group.members[currentUser.uid]
      })
      setGroups(userGroups)
    }
    setLoading(false)
  }

  const handleViewGroup = (groupId) => {
    navigate(`/group/${groupId}`)
    onClose()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="groups-modal-overlay" onClick={handleOverlayClick}>
      <div className="groups-modal-content">
        <div className="groups-modal-header">
          <h2>Your Groups</h2>
          <button className="groups-modal-close" onClick={onClose}>
            <FontAwesomeIcon icon="fa-solid fa-times" />
          </button>
        </div>

        <div className="groups-modal-body">
          {loading ? (
            <div className="groups-modal-loading">
              <FontAwesomeIcon icon="fa-solid fa-spinner" spin />
              <span>Loading groups...</span>
            </div>
          ) : groups.length === 0 ? (
            <div className="groups-modal-empty">
              <FontAwesomeIcon icon="fa-solid fa-people-group" />
              <p>Not a member of any groups yet</p>
            </div>
          ) : (
            <div className="groups-modal-list">
              {groups.map((group) => {
                const memberCount = group.members ? Object.keys(group.members).length : 0
                return (
                  <div key={group._id} className="group-modal-item">
                    <div className="group-modal-banner">
                      {group.banner || group.bannerUrl ? (
                        <img 
                          src={group.banner || group.bannerUrl} 
                          alt={group.name}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="group-modal-banner-placeholder">
                          <FontAwesomeIcon icon="fa-solid fa-people-group" />
                        </div>
                      )}
                    </div>
                    <div className="group-modal-icon">
                      {group.icon || group.profileUrl ? (
                        <img 
                          src={group.icon || group.profileUrl} 
                          alt={group.name}
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className="group-modal-icon-placeholder" style={{ display: (group.icon || group.profileUrl) ? 'none' : 'flex' }}>
                        <FontAwesomeIcon icon="fa-solid fa-users" />
                      </div>
                    </div>
                    <div className="group-modal-info">
                      <h3>{group.name || 'Unnamed Group'}</h3>
                      <div className="group-modal-meta">
                        <span className="group-modal-privacy">{group.privacy || 'public'}</span>
                        <span className="group-modal-members">{memberCount} members</span>
                      </div>
                    </div>
                    <button 
                      className="group-modal-view-btn"
                      onClick={() => handleViewGroup(group._id)}
                    >
                      View Group
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GroupsModal

