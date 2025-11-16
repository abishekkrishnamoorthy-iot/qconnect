import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Popup from 'reactjs-popup'

const Profile = () => {
  const { currentUser, userData, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const result = await signOut()
    if (result.success) {
      navigate('/login')
    }
  }

  return (
    <Popup
      trigger={
        <div className='profile' style={{ cursor: 'pointer' }}>
          <div className="proimg">
            <FontAwesomeIcon icon="fa-solid fa-user" size='2xl' />
          </div>
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
        minWidth: '200px'
      }}>
        <div style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <div style={{ fontWeight: 'bold' }}>{userData?.username || 'User'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{userData?.email || currentUser?.email}</div>
        </div>
        <div>
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              background: 'blue',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            View Profile
          </button>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              background: 'red',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </Popup>
  )
}

export default Profile