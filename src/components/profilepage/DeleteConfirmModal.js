import React from 'react'
import '../../style/profile/deleteConfirmModal.css'

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, postTitle }) => {
  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="delete-confirm-overlay" onClick={handleOverlayClick}>
      <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-confirm-header">
          <h2>Delete Post</h2>
        </div>
        <div className="delete-confirm-body">
          <p className="delete-confirm-message">
            Are you sure? This post will be permanently deleted.
          </p>
          {postTitle && (
            <p className="delete-confirm-title">
              <strong>"{postTitle}"</strong>
            </p>
          )}
        </div>
        <div className="delete-confirm-footer">
          <button className="delete-confirm-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="delete-confirm-delete" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal

