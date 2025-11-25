import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  markNotificationAsRead, 
  subscribeToNotifications,
  approveMemberRequest,
  rejectMemberRequest,
  getUser,
  getGroup,
  getPost,
  getGroupMemberRequests
} from '../../services/db'
import { ref, onValue, off, get } from 'firebase/database'
import { database } from '../../firebase/config'
import '../../style/notifications/notificationsPanel.css'

// Function to play notification beep sound
const playNotificationSound = () => {
  try {
    // Create audio context for beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Beep sound properties - pleasant notification sound
    oscillator.frequency.value = 800 // Frequency in Hz
    oscillator.type = 'sine'
    
    // Volume envelope (quick fade in/out for a short beep)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15)
    
    // Play beep (150ms duration)
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)
  } catch (error) {
    console.warn('Could not play notification sound:', error)
    // Silent fail if audio cannot play
  }
}

const NotificationsPanel = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processingNotificationId, setProcessingNotificationId] = useState(null)
  const [notificationUserData, setNotificationUserData] = useState({}) // Cache user data for all notification types
  const [notificationGroupData, setNotificationGroupData] = useState({}) // Cache group data
  const [notificationPostData, setNotificationPostData] = useState({}) // Cache post data
  const [requestStatuses, setRequestStatuses] = useState({}) // Track request statuses from database

  useEffect(() => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    console.log('Setting up notification subscription for user:', currentUser.uid)

    // Track previous unread count to detect new notifications
    let previousUnreadCount = 0
    let isInitialLoad = true

    // Subscribe to notifications for real-time updates
    const unsubscribe = subscribeToNotifications(currentUser.uid, async (notifs) => {
      console.log('📬 Notifications received:', notifs.length, 'notifications')
      console.log('📋 Notifications data:', notifs)
      
      const unread = notifs.filter(n => !n.read).length
      
      // Play beep sound if new unread notifications arrive (not on initial load)
      if (!isInitialLoad && unread > previousUnreadCount) {
        const newNotificationsCount = unread - previousUnreadCount
        console.log(`🔔 ${newNotificationsCount} new notification(s) received - playing sound`)
        playNotificationSound()
      }
      
      // Update previous count and mark initial load as complete
      if (isInitialLoad) {
        isInitialLoad = false
      }
      previousUnreadCount = unread
      
      setNotifications(notifs)
      setUnreadCount(unread)
      setLoading(false)
      
      // Debug: Log notification types
      if (notifs.length > 0) {
        console.log('📌 Notification types:', notifs.map(n => ({ type: n.type, id: n._id, read: n.read })))
        const groupRequests = notifs.filter(n => n.type === 'group_request')
        if (groupRequests.length > 0) {
          console.log('🔔 Group request notifications found:', groupRequests.length, groupRequests)
        }
      } else {
        console.log('⚠️ No notifications found for user:', currentUser.uid)
      }
      
      // Fetch user data for notifications that need it
      const notificationsNeedingUserData = notifs.filter(n => 
        (n.type === 'group_request' || n.type === 'follow' || n.type === 'group_post' || n.type === 'quiz_complete' || n.type === 'follow_post' || n.type === 'group_request_response') && n.fromUserId
      )
      
      // Fetch group data for group notifications
      const notificationsNeedingGroupData = notifs.filter(n => 
        (n.type === 'group_post' || n.type === 'group_request' || n.type === 'group_request_response') && n.groupId
      )
      
      // Fetch post data for post notifications
      const notificationsNeedingPostData = notifs.filter(n => 
        (n.type === 'group_post' || n.type === 'follow_post') && n.postId
      )
      
      const userFetchPromises = notificationsNeedingUserData.map(async (notif) => {
        if (notificationUserData[notif.fromUserId]) return
        const userResult = await getUser(notif.fromUserId)
        if (userResult.success) {
          setNotificationUserData(prev => ({
            ...prev,
            [notif.fromUserId]: userResult.data
          }))
        }
      })
      
      const groupFetchPromises = notificationsNeedingGroupData.map(async (notif) => {
        if (notificationGroupData[notif.groupId]) return
        const groupResult = await getGroup(notif.groupId)
        if (groupResult.success) {
          setNotificationGroupData(prev => ({
            ...prev,
            [notif.groupId]: groupResult.data
          }))
        }
      })
      
      const postFetchPromises = notificationsNeedingPostData.map(async (notif) => {
        if (notificationPostData[notif.postId]) return
        const postResult = await getPost(notif.postId)
        if (postResult.success) {
          setNotificationPostData(prev => ({
            ...prev,
            [notif.postId]: postResult.data
          }))
        }
      })
      
      await Promise.all([...userFetchPromises, ...groupFetchPromises, ...postFetchPromises])
      
      // Load initial request statuses from database for all group request notifications
      const groupRequestNotifs = notifs.filter(n => n.type === 'group_request' && n.groupId && n.fromUserId)
      const groupIds = [...new Set(groupRequestNotifs.map(n => n.groupId))]
      
      console.log('📋 Group request notifications found:', groupRequestNotifs.length, 'for groups:', groupIds)
      
      // Load initial request statuses for all groups
      const initialStatusPromises = groupIds.map(async (groupId) => {
        try {
          // Get all requests (including processed ones) to check status
          const requestsRef = ref(database, `groups/${groupId}/requests`)
          const requestsSnapshot = await get(requestsRef)
          
          if (requestsSnapshot.exists()) {
            const requests = requestsSnapshot.val()
            const statuses = {}
            Object.keys(requests).forEach(userId => {
              const requestData = requests[userId]
              const key = `${groupId}_${userId}`
              statuses[key] = requestData.status || 'pending'
            })
            setRequestStatuses(prev => ({ ...prev, ...statuses }))
            console.log(`✓ Loaded request statuses for group ${groupId}:`, statuses)
          } else {
            console.log(`⚠ No requests found for group ${groupId}`)
          }
        } catch (error) {
          console.error(`Error loading initial request statuses for group ${groupId}:`, error)
        }
      })
      await Promise.all(initialStatusPromises)
    })

    return () => {
      if (unsubscribe) {
        console.log('Cleaning up notification subscription')
        unsubscribe()
      }
    }
  }, [currentUser])

  // Separate effect for real-time request status updates
  useEffect(() => {
    if (!currentUser || notifications.length === 0) return

    const groupRequestNotifs = notifications.filter(n => n.type === 'group_request' && n.groupId)
    const groupIds = [...new Set(groupRequestNotifs.map(n => n.groupId))]
    
    if (groupIds.length === 0) return

    console.log('Setting up real-time subscriptions for group requests:', groupIds)

    // Subscribe to each group's requests for real-time updates
    const requestSubscriptions = groupIds.map(groupId => {
      const requestsRef = ref(database, `groups/${groupId}/requests`)
      const unsubscribeRequests = onValue(requestsRef, (snapshot) => {
        if (snapshot.exists()) {
          const requests = snapshot.val()
          // Update request statuses for this group
          setRequestStatuses(prev => {
            const updated = { ...prev }
            Object.keys(requests).forEach(userId => {
              const key = `${groupId}_${userId}`
              updated[key] = requests[userId].status || 'pending'
            })
            return updated
          })
          console.log(`📥 Real-time update: Request statuses for group ${groupId}:`, requests)
        }
      }, (error) => {
        console.error(`Error subscribing to requests for group ${groupId}:`, error)
      })
      return { groupId, unsubscribe: unsubscribeRequests }
    })
    
    // Cleanup subscriptions
    return () => {
      requestSubscriptions.forEach(sub => {
        if (sub.unsubscribe) {
          sub.unsubscribe()
        }
      })
    }
  }, [currentUser, notifications])

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
      navigate(`/home/${notif.postId}`)
    } else if (notif.type === 'group_post' && notif.groupId) {
      navigate(`/group/${notif.groupId}`)
    } else if (notif.type === 'follow_post' && notif.postId) {
      navigate(`/home/${notif.postId}`)
    } else if (notif.type === 'follow_post' && notif.fromUserId) {
      navigate(`/profile/${notif.fromUserId}`)
    } else if (notif.type === 'quiz_complete' && notif.postId) {
      navigate(`/home/${notif.postId}`)
    } else if (notif.type === 'group_request' && notif.groupId) {
      navigate(`/group/${notif.groupId}`)
    } else if (notif.type === 'group_request_response' && notif.groupId) {
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
              const isGroupRequestResponse = notif.type === 'group_request_response'
              const isFollow = notif.type === 'follow'
              const isGroupPost = notif.type === 'group_post'
              const isFollowPost = notif.type === 'follow_post'
              const isQuizComplete = notif.type === 'quiz_complete'
              // group_request_response doesn't need user info, it shows system message
              const showUserInfo = isGroupRequest || isFollow || isGroupPost || isFollowPost || isQuizComplete
              
              const userData = notificationUserData[notif.fromUserId]
              const username = userData 
                ? (userData.profile?.username || userData.username || 'User')
                : 'User'
              const userPic = userData?.profile?.profilePic || userData?.profilePic
              
              const groupData = notificationGroupData[notif.groupId]
              const groupName = groupData?.name || notif.groupName || 'Group'
              
              const postData = notificationPostData[notif.postId]
              const postTitle = postData?.title || notif.postTitle || ''
              const postContent = postData?.content || notif.postContent || ''
              
              const quizPercentage = notif.quizPercentage || notif.score || null
              
              // Check request status from database (real-time)
              // For group requests, show buttons by default unless we know the request is processed
              const requestKey = notif.groupId && notif.fromUserId ? `${notif.groupId}_${notif.fromUserId}` : null
              const requestStatus = requestKey ? requestStatuses[requestKey] : null
              // Show buttons if status is pending, null (not loaded yet), or undefined
              // Only hide buttons if status is explicitly 'accepted' or 'rejected'
              const isRequestPending = isGroupRequest && requestStatus !== 'accepted' && requestStatus !== 'rejected'
              
              const isProcessing = processingNotificationId === notif._id
              
              // Determine click handler
              const handleClick = () => {
                if (isGroupRequest) {
                  // Group requests handled by action buttons
                  return
                }
                if (isGroupPost || isFollowPost || isQuizComplete || isGroupRequestResponse) {
                  handleNotificationClick(notif)
                } else if (!notif.read) {
                  handleMarkAsRead(notif._id)
                }
              }
              
              return (
                <div
                  key={notif._id}
                  className={`notification-item ${notif.read ? 'read' : 'unread'} ${(isGroupPost || isFollowPost || isQuizComplete || isGroupRequestResponse) ? 'clickable' : ''}`}
                  onClick={handleClick}
                  style={{ cursor: (isGroupPost || isFollowPost || isQuizComplete || isGroupRequestResponse) ? 'pointer' : isGroupRequest ? 'default' : 'pointer' }}
                >
                  {showUserInfo && (
                    <div className="notification-requester">
                      {userData && userPic ? (
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
                      ) : (
                        <div className="requester-avatar-icon">
                          <FontAwesomeIcon icon="fa-solid fa-user" />
                        </div>
                      )}
                      <div className="requester-info">
                        <div className="requester-username">
                          {userData ? username : 'Loading...'}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="notification-message">
                    {isGroupRequestResponse ? (
                      // group_request_response notifications always have a message
                      <div className="notification-message-content">
                        {notif.message || `Your request to join ${groupName} was processed`}
                      </div>
                    ) : notif.message ? (
                      // For other notifications, show message if it exists
                      <div>{notif.message}</div>
                    ) : (
                      // Fallback for notifications without messages
                      <>
                        {isGroupPost && (
                          <>
                            <strong>{username}</strong> posted in <strong>{groupName}</strong>
                            {postTitle && <div className="notification-post-preview">{postTitle}</div>}
                          </>
                        )}
                        {isFollowPost && (
                          <>
                            <strong>{username}</strong> shared a new post
                            {postTitle && <div className="notification-post-preview">{postTitle}</div>}
                          </>
                        )}
                        {isGroupRequest && (
                          <>
                            <strong>{username}</strong> wants to join <strong>{groupName}</strong>
                          </>
                        )}
                        {isQuizComplete && (
                          <>
                            <strong>{username}</strong> completed your quiz
                            {quizPercentage !== null && (
                              <div className="notification-quiz-score">Score: {Math.round(quizPercentage)}%</div>
                            )}
                          </>
                        )}
                        {isFollow && (
                          <>
                            <strong>{username}</strong> started following you
                          </>
                        )}
                      </>
                    )}
                  </div>
                  
                  {(postTitle || postContent) && !notif.message && (
                    <div className="notification-post-details">
                      {postTitle && <div className="notification-post-title">{postTitle}</div>}
                      {postContent && postContent.length > 100 ? (
                        <div className="notification-post-content">{postContent.substring(0, 100)}...</div>
                      ) : (
                        postContent && <div className="notification-post-content">{postContent}</div>
                      )}
                    </div>
                  )}
                  
                  <div className="notification-time">
                    {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  {isGroupRequest && (
                    <div className="notification-actions">
                      {isRequestPending ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApproveRequest(notif)
                            }}
                            disabled={isProcessing}
                            className="approve-btn"
                            title="Accept Request"
                          >
                            {isProcessing ? (
                              <FontAwesomeIcon icon="fa-solid fa-spinner" spin />
                            ) : (
                              <FontAwesomeIcon icon="fa-solid fa-check" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRejectRequest(notif)
                            }}
                            disabled={isProcessing}
                            className="reject-btn"
                            title="Reject Request"
                          >
                            {isProcessing ? (
                              <FontAwesomeIcon icon="fa-solid fa-spinner" spin />
                            ) : (
                              <FontAwesomeIcon icon="fa-solid fa-times" />
                            )}
                          </button>
                        </>
                      ) : (
                        <span className="notification-status-badge">
                          {requestStatus === 'accepted' ? '✓ Accepted' : requestStatus === 'rejected' ? '✗ Rejected' : 'Processed'}
                        </span>
                      )}
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

