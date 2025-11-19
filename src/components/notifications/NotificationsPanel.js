import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  markNotificationAsRead, 
  subscribeToNotifications,
  approveMemberRequest,
  rejectMemberRequest,
  getUser
} from '../../services/db'
import '../../style/notifications/notificationsPanel.css'

const NotificationsPanel = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processingNotificationId, setProcessingNotificationId] = useState(null)
  const [notificationUserData, setNotificationUserData] = useState({}) // Cache user data for all notification types

  useEffect(() => {
    if (!currentUser) return

    // Subscribe to notifications for real-time updates
    const unsubscribe = subscribeToNotifications(currentUser.uid, async (notifs) => {
      setNotifications(notifs)
      const unread = notifs.filter(n => !n.read).length
      setUnreadCount(unread)
      setLoading(false)
      
      // Fetch user data for notifications that need it (group_request, follow, group_post)
      const notificationsNeedingUserData = notifs.filter(n => 
        (n.type === 'group_request' || n.type === 'follow' || n.type === 'group_post') && n.fromUserId
      )
      const userFetchPromises = notificationsNeedingUserData.map(async (notif) => {
        // Use functional update to avoid stale closure
        setNotificationUserData(prev => {
          // Check if we already have this user's data
          if (prev[notif.fromUserId]) {
            return prev
          }
          
          // Fetch user data asynchronously
          getUser(notif.fromUserId).then(userResult => {
            if (userResult.success) {
              setNotificationUserData(currentPrev => {
                // Double-check in case state updated during fetch
                if (currentPrev[notif.fromUserId]) return currentPrev
                return {
                  ...currentPrev,
                  [notif.fromUserId]: userResult.data
                }
              })
            }
          })
          
          return prev
        })
      })
      
      await Promise.all(userFetchPromises)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [currentUser])

  const handleMarkAsRead = async (notificationId) => {
    if (!currentUser) return
    
    const result = await markNotificationAsRead(currentUser.uid, notificationId)
    if (result.success) {
      // Notification will update automatically via subscription
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return
    
    const unreadNotifications = notifications.filter(n => !n.read)
    for (const notif of unreadNotifications) {
      await markNotificationAsRead(currentUser.uid, notif._id)
    }
  }

  const handleApproveRequest = async (notif) => {
    if (!currentUser || processingNotificationId) return
    
    setProcessingNotificationId(notif._id)
    
    try {
      const result = await approveMemberRequest(notif.groupId, notif.requestId, notif.fromUserId)
      if (result.success) {
        // Mark notification as read
        await markNotificationAsRead(currentUser.uid, notif._id)
      }
    } catch (error) {
      console.error('Error approving request:', error)
    } finally {
      setProcessingNotificationId(null)
    }
  }

  const handleRejectRequest = async (notif) => {
    if (!currentUser || processingNotificationId) return
    
    setProcessingNotificationId(notif._id)
    
    try {
      const result = await rejectMemberRequest(notif.groupId, notif.requestId, notif.fromUserId)
      if (result.success) {
        // Mark notification as read
        await markNotificationAsRead(currentUser.uid, notif._id)
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
    } finally {
      setProcessingNotificationId(null)
    }
  }

  const handleNotificationClick = async (notif) => {
    if (!currentUser) return
    
    // Mark as read if unread
    if (!notif.read) {
      await handleMarkAsRead(notif._id)
    }
    
    // Navigate based on notification type
    if (notif.type === 'group_post' && notif.postId) {
      // Navigate to the post
      navigate(`/home/${notif.postId}`)
    } else if (notif.type === 'group_post' && notif.groupId) {
      // Fallback to group page if postId not available
      navigate(`/group/${notif.groupId}`)
    }
  }

  if (!currentUser) {
    return (
      <div className="notifications-panel">
        <div className="notifications-empty">
          Please log in to view notifications
        </div>
      </div>
    )
  }

  return (
    <div className="notifications-panel">
      <div className="notifications-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="mark-all-read-btn"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="notifications-content">
        {loading ? (
          <div className="notifications-loading">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            No notifications yet
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(notif => {
              const isGroupRequest = notif.type === 'group_request'
              const isFollow = notif.type === 'follow'
              const isGroupPost = notif.type === 'group_post'
              const showUserInfo = isGroupRequest || isFollow || isGroupPost
              
              const userData = notificationUserData[notif.fromUserId]
              const username = userData 
                ? (userData.profile?.username || userData.username || 'User')
                : 'User'
              const userPic = userData?.profile?.profilePic || userData?.profilePic
              const isProcessing = processingNotificationId === notif._id
              
              // Determine click handler
              const handleClick = () => {
                if (isGroupRequest) {
                  // Group requests handled by action buttons
                  return
                }
                if (isGroupPost) {
                  handleNotificationClick(notif)
                } else if (!notif.read) {
                  handleMarkAsRead(notif._id)
                }
              }
              
              return (
                <div
                  key={notif._id}
                  className={`notification-item ${notif.read ? 'read' : 'unread'} ${isGroupPost ? 'clickable' : ''}`}
                  onClick={handleClick}
                  style={{ cursor: isGroupPost ? 'pointer' : isGroupRequest ? 'default' : 'pointer' }}
                >
                  {showUserInfo && userData && (
                    <div className="notification-requester">
                      {userPic ? (
                        <img 
                          src={userPic} 
                          alt={username}
                          className="requester-avatar"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            const iconElement = e.target.parentElement.querySelector('.requester-avatar-icon')
                            if (iconElement) {
                              iconElement.style.display = 'flex'
                            }
                          }}
                        />
                      ) : null}
                      {!userPic && (
                        <div className="requester-avatar-icon">
                          <FontAwesomeIcon icon="fa-solid fa-user" />
                        </div>
                      )}
                      <div className="requester-info">
                        <div className="requester-username">
                          {username}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="notification-message">
                    {notif.message}
                  </div>
                  
                  <div className="notification-time">
                    {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  {isGroupRequest && !notif.read && (
                    <div className="notification-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApproveRequest(notif)
                        }}
                        disabled={isProcessing}
                        className="approve-btn"
                      >
                        {isProcessing ? '...' : 'Accept'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRejectRequest(notif)
                        }}
                        disabled={isProcessing}
                        className="reject-btn"
                      >
                        {isProcessing ? '...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPanel

