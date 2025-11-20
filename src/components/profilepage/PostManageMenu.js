import React, { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '../../style/profile/postManageMenu.css'

const PostManageMenu = ({ post, postType, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleEdit = () => {
    setIsOpen(false)
    if (onEdit) {
      onEdit()
    }
  }

  const handleDelete = () => {
    setIsOpen(false)
    if (onDelete) {
      onDelete()
    }
  }

  return (
    <div className="post-manage-menu" ref={menuRef}>
      <button
        className="post-manage-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Manage post"
      >
        <FontAwesomeIcon icon="fa-solid fa-ellipsis-vertical" />
      </button>
      
      {isOpen && (
        <div className="post-manage-dropdown">
          <button className="post-manage-item" onClick={handleEdit}>
            <FontAwesomeIcon icon="fa-solid fa-pen" />
            <span>Edit Title</span>
          </button>
          <button className="post-manage-item" onClick={handleEdit}>
            <FontAwesomeIcon icon="fa-solid fa-file-text" />
            <span>Edit Description</span>
          </button>
          {postType === 'question' && (
            <button className="post-manage-item" onClick={handleEdit}>
              <FontAwesomeIcon icon="fa-solid fa-tag" />
              <span>Edit Topic</span>
            </button>
          )}
          {postType === 'quiz' && (
            <button className="post-manage-item" onClick={handleEdit}>
              <FontAwesomeIcon icon="fa-solid fa-image" />
              <span>Edit Banner</span>
            </button>
          )}
          <div className="post-manage-divider"></div>
          <button className="post-manage-item post-manage-item-danger" onClick={handleDelete}>
            <FontAwesomeIcon icon="fa-solid fa-trash" />
            <span>Delete Post</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default PostManageMenu

