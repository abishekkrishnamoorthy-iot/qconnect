import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { 
  updateGroup, 
  approveMemberRequest, 
  rejectMemberRequest,
  removeMember,
  getGroupMemberRequests,
  getGroupRequests,
  getGroup,
  getUser
} from '../../services/db'
import { uploadToCloudinary } from '../../utils/cloudinaryUpload'
import '../../style/group/grouppage.css'

const GroupManagementModal = ({ group, onClose, onGroupUpdated }) => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('info') // 'info', 'requests', 'members'
  
  // Form state
  const [name, setName] = useState(group?.name || '')
  const [description, setDescription] = useState(group?.description || '')
  const [category, setCategory] = useState(group?.category || 'general')
  const [privacy, setPrivacy] = useState(group?.privacy || 'public')
  const [bannerUrl, setBannerUrl] = useState(group?.banner || group?.bannerUrl || '')
  const [profileUrl, setProfileUrl] = useState(group?.icon || group?.profileUrl || '')
  
  // Media upload state
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState('')
  const [iconFile, setIconFile] = useState(null)
  const [iconPreview, setIconPreview] = useState('')
  
  // Member management state
  const [members, setMembers] = useState([])
  const [requests, setRequests] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  
  const bannerInputRef = useRef(null)
  const iconInputRef = useRef(null)

  useEffect(() => {
    if (group?._id) {
      loadMembers()
      loadRequests()
    }
  }, [group?._id])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const loadMembers = async () => {
    if (!group?._id) return
    
    setLoadingMembers(true)
    const groupResult = await getGroup(group._id)
    
    if (groupResult.success && groupResult.data.members) {
      const membersObj = groupResult.data.members
      const memberList = await Promise.all(
        Object.keys(membersObj).map(async (userId) => {
          const userResult = await getUser(userId)
          return {
            userId,
            username: userResult.success 
              ? (userResult.data.profile?.username || userResult.data.username || 'Unknown')
              : 'Unknown',
            role: membersObj[userId].role || 'member',
            joinedAt: membersObj[userId].joinedAt
          }
        })
      )
      setMembers(memberList)
    }
    
    setLoadingMembers(false)
  }

  const loadRequests = async () => {
    if (!group?._id) return
    
    try {
      // Get from both schemas
      const [oldRequestsResult, newRequestsResult] = await Promise.all([
        getGroupMemberRequests(group._id),
        getGroupRequests(group._id)
      ])
      
      const requestsList = []
      
      // Process old schema requests
      if (oldRequestsResult.success && oldRequestsResult.data) {
        for (const [userId, requestData] of Object.entries(oldRequestsResult.data)) {
          if (requestData.status === 'pending' || !requestData.status) {
            const userResult = await getUser(userId)
            requestsList.push({
              userId,
              username: userResult.success 
                ? (userResult.data.profile?.username || userResult.data.username || 'Unknown')
                : 'Unknown',
              createdAt: requestData.createdAt
            })
          }
        }
      }
      
      // Process new schema requests (add if not already in list)
      if (newRequestsResult.success && newRequestsResult.data) {
        for (const userId of Object.keys(newRequestsResult.data)) {
          if (!requestsList.find(r => r.userId === userId)) {
            const userResult = await getUser(userId)
            requestsList.push({
              userId,
              username: userResult.success 
                ? (userResult.data.profile?.username || userResult.data.username || 'Unknown')
                : 'Unknown',
              createdAt: null
            })
          }
        }
      }
      
      setRequests(requestsList)
    } catch (error) {
      console.error('Error loading requests:', error)
    }
  }

  const handleBannerChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setBannerFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleIconChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setIconFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveInfo = async () => {
    if (!group?._id) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const updates = {
        name: name.trim(),
        description: description.trim(),
        category,
        privacy
      }

      // Upload banner if changed
      if (bannerFile) {
        const bannerUrl = await uploadToCloudinary(bannerFile)
        updates.banner = bannerUrl
      }

      // Upload icon if changed
      if (iconFile) {
        const iconUrl = await uploadToCloudinary(iconFile)
        updates.icon = iconUrl
      }

      const result = await updateGroup(group._id, updates)
      if (result.success) {
        setSuccess('Group updated successfully!')
        if (onGroupUpdated) {
          onGroupUpdated()
        }
      } else {
        setError(result.error || 'Failed to update group')
      }
    } catch (err) {
      setError(err.message || 'Failed to update group')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = async (userId) => {
    setLoading(true)
    try {
      const result = await approveMemberRequest(group._id, userId)
      if (result.success) {
        await loadRequests()
        await loadMembers()
        setSuccess('Request approved!')
      } else {
        setError(result.error || 'Failed to approve request')
      }
    } catch (err) {
      setError(err.message || 'Failed to approve request')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectRequest = async (userId) => {
    setLoading(true)
    try {
      const result = await rejectMemberRequest(group._id, userId)
      if (result.success) {
        await loadRequests()
        setSuccess('Request rejected!')
      } else {
        setError(result.error || 'Failed to reject request')
      }
    } catch (err) {
      setError(err.message || 'Failed to reject request')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return

    setLoading(true)
    try {
      const result = await removeMember(group._id, userId)
      if (result.success) {
        await loadMembers()
        setSuccess('Member removed!')
      } else {
        setError(result.error || 'Failed to remove member')
      }
    } catch (err) {
      setError(err.message || 'Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="group-management-modal-overlay" onClick={onClose}>
      <div className="group-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="group-management-modal-header">
          <h2>Manage Group</h2>
          <button className="group-management-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="group-management-error">{error}</div>}
        {success && <div className="group-management-success">{success}</div>}

        <div className="group-management-tabs">
          <button
            className={activeTab === 'info' ? 'active' : ''}
            onClick={() => setActiveTab('info')}
          >
            Group Info
          </button>
          <button
            className={activeTab === 'requests' ? 'active' : ''}
            onClick={() => setActiveTab('requests')}
          >
            Join Requests ({requests.length})
          </button>
          <button
            className={activeTab === 'members' ? 'active' : ''}
            onClick={() => setActiveTab('members')}
          >
            Members ({members.length})
          </button>
        </div>

        <div className="group-management-content">
          {activeTab === 'info' && (
            <div className="group-management-info">
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Group name"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Group description"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="general">General</option>
                  <option value="education">Education</option>
                  <option value="technology">Technology</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Privacy</label>
                <select value={privacy} onChange={(e) => setPrivacy(e.target.value)}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="form-group">
                <label>Banner Image</label>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="upload-btn"
                >
                  Upload Banner
                </button>
                {(bannerPreview || bannerUrl) && (
                  <img
                    src={bannerPreview || bannerUrl}
                    alt="Banner preview"
                    className="preview-image"
                  />
                )}
              </div>

              <div className="form-group">
                <label>Profile Picture</label>
                <input
                  ref={iconInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => iconInputRef.current?.click()}
                  className="upload-btn"
                >
                  Upload Profile Picture
                </button>
                {(iconPreview || profileUrl) && (
                  <img
                    src={iconPreview || profileUrl}
                    alt="Profile preview"
                    className="preview-image small"
                  />
                )}
              </div>

              <button
                className="save-btn"
                onClick={handleSaveInfo}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="group-management-requests">
              {loadingMembers ? (
                <p>Loading requests...</p>
              ) : requests.length === 0 ? (
                <p>No pending requests</p>
              ) : (
                <div className="requests-list">
                  {requests.map((request) => (
                    <div key={request.userId} className="request-item">
                      <div>
                        <strong>{request.username}</strong>
                        {request.createdAt && (
                          <span className="request-date">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="request-actions">
                        <button
                          className="approve-btn"
                          onClick={() => handleApproveRequest(request.userId)}
                          disabled={loading}
                        >
                          Approve
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleRejectRequest(request.userId)}
                          disabled={loading}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="group-management-members">
              {loadingMembers ? (
                <p>Loading members...</p>
              ) : members.length === 0 ? (
                <p>No members</p>
              ) : (
                <div className="members-list">
                  {members.map((member) => (
                    <div key={member.userId} className="member-item">
                      <div>
                        <strong>{member.username}</strong>
                        <span className="member-role">{member.role}</span>
                      </div>
                      {member.role !== 'admin' && (
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveMember(member.userId)}
                          disabled={loading}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GroupManagementModal

