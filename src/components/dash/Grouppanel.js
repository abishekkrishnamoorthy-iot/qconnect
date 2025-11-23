import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getGroups } from '../../services/db'
import Creategrp from '../grouppage/Creategrp'

const Grouppanel = () => {
  const { currentUser } = useAuth()
  const [userGroups, setUserGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (currentUser) {
      loadUserGroups()
    }
  }, [currentUser, refreshTrigger])

  const loadUserGroups = async () => {
    if (!currentUser) return
    
    setLoading(true)
    const result = await getGroups()
    
    if (result.success) {
      // Filter groups where user is the creator (admin groups only)
      const myGroups = result.data.filter(group => {
        return group.creatorId === currentUser.uid
      })
      setUserGroups(myGroups)
    }
    
    setLoading(false)
  }

  const handleGroupCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div className='grppanel'>
     <div className="grppanelheader">
      <div className="header-left">
        <FontAwesomeIcon icon="fa-solid fa-users" size='lg' className='plus' />
        <h1>Your Groups</h1>
      </div>
      <button onClick={handleOpenModal} className="create-group-header-btn" title="Create Group">
        <FontAwesomeIcon icon="fa-solid fa-plus" />
      </button>
     </div>
     <div className="grplist">
      {loading ? (
        <div style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
          Loading...
        </div>
      ) : userGroups.length === 0 ? (
        <div style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
          No groups created yet
        </div>
      ) : (
        userGroups.map(group => {
          const role = 'admin' // User is always admin for groups they created
          const memberCount = group.members ? Object.keys(group.members).length : 0
          
          return (
            <Link 
              key={group._id} 
              to={`/group/${group._id}`} 
              className="group-item"
              style={{ textDecoration: 'none' }}
            >
              <div className="group-item-content">
                <div className="group-icon">
                  <FontAwesomeIcon icon="fa-solid fa-users" />
                </div>
                <div className="group-details">
                  <h4>{group.name}</h4>
                  <p>{memberCount} members • {role}</p>
                </div>
              </div>
            </Link>
          )
        })
      )}
     </div>
     {isModalOpen && (
       <Creategrp 
         onGroupCreated={handleGroupCreated}
         onClose={handleCloseModal}
       />
     )}
    </div>
  )
}

export default Grouppanel