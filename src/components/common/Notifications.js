import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../context/AuthContext'
import { getNotifications, markNotificationAsRead, subscribeToNotifications } from '../../services/db'
import Popup from 'reactjs-popup'

const Notifications = () => {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return

    // Subscribe to notifications for real-time updates
    const unsubscribe = subscribeToNotifications(currentUser.uid, (notifs) => {
      setNotifications(notifs)
      const unread = notifs.filter(n => !n.read).length
      setUnreadCount(unread)
      setLoading(false)
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

  if (!currentUser) return null

  return (
    <Popup
      trigger={
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <FontAwesomeIcon icon="fa-solid fa-bell" size='lg' />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: 'red',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      }
      position="bottom right"
      on="click"
      closeOnDocumentClick
    >
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        minWidth: '300px',
        maxWidth: '400px',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
          borderBottom: '1px solid #eee',
          paddingBottom: '10px'
        }}>
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                background: 'blue',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No notifications yet
          </div>
        ) : (
          <div>
            {notifications.map(notif => (
              <div
                key={notif._id}
                onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                style={{
                  padding: '10px',
                  marginBottom: '10px',
                  background: notif.read ? '#f9f9f9' : '#e3f2fd',
                  borderRadius: '4px',
                  cursor: notif.read ? 'default' : 'pointer',
                  borderLeft: notif.read ? 'none' : '3px solid blue'
                }}
              >
                <div style={{ fontWeight: notif.read ? 'normal' : 'bold' }}>
                  {notif.message}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {new Date(notif.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Popup>
  )
}

export default Notifications

