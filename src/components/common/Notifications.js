import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { subscribeToNotifications } from '../../services/db'

const Notifications = () => {
  const { currentUser } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!currentUser) return

    // Subscribe to notifications only to get unread count (lightweight)
    const unsubscribe = subscribeToNotifications(currentUser.uid, (notifs) => {
      const unread = notifs.filter(n => !n.read).length
      setUnreadCount(unread)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [currentUser])

  if (!currentUser) return null

  return (
    <Link to="/notification" style={{ position: 'relative', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
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
          justifyContent: 'center',
          fontWeight: 'bold'
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

export default Notifications

