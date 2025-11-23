import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import CreateModal from '../feed/CreateModal'
import { useAuth } from '../../context/AuthContext'

const Nav = ({icon}) => {
  const { currentUser, userData } = useAuth()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const cudetails = currentUser ? {
    _id: currentUser.uid,
    username: userData?.profile?.username || userData?.username || currentUser.displayName || '',
    email: userData?.email || currentUser.email || ''
  } : null

  const openCreateModal = () => {
    if (!currentUser) return
    setIsCreateOpen(true)
  }

  const handlePostCreated = () => {
    setIsCreateOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className='nav'>
        <ul >
          <Link className='icon' to='/home'><FontAwesomeIcon icon="fa-solid fa-house" size='2xl'  /></Link>
          <Link className='icon'to='/Group'><FontAwesomeIcon icon="fa-solid fa-people-group" size='2xl' /></Link>
          <button className='icon nav-create-btn' onClick={openCreateModal} aria-label="Create Post">
            <FontAwesomeIcon icon="fa-solid fa-circle-plus" size='2xl' />
          </button>
          <Link className='icon' to='/chat'><FontAwesomeIcon icon="fa-solid fa-comments" size='2xl' /></Link>
          <Link className='icon'to='/notification'><FontAwesomeIcon icon="fa-solid fa-bell" size='2xl' /></Link>
        </ul>
      </div>
      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPostCreated={handlePostCreated}
        cudetails={cudetails}
        tabsOverride={['question', 'blog', 'quiz']}
        initialTabOverride="question"
      />
    </>
  )
}

export default Nav