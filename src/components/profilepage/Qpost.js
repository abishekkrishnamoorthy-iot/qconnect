import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { deletePost } from '../../services/db'
import PostManageMenu from './PostManageMenu'
import EditPostModal from './EditPostModal'
import DeleteConfirmModal from './DeleteConfirmModal'

const Qpost = ({ post, onPostUpdated, onPostDeleted, cudetails }) => {
  const { currentUser } = useAuth()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwner = currentUser && post && (post.userId === currentUser.uid || post.createdBy === currentUser.uid)

  const handleEdit = () => {
    setShowEditModal(true)
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!post) return

    setDeleting(true)
    try {
      const result = await deletePost(post._id || post.postId)
      if (result.success) {
        if (onPostDeleted) {
          onPostDeleted(post._id || post.postId)
        }
        setShowDeleteModal(false)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = () => {
    if (onPostUpdated) {
      onPostUpdated(post._id || post.postId)
    }
  }

  return (
    <>
      <div className='post'>
        <div className="userprofile">
          <div className="userprofile-left">
            <div className="img">
              {post?.userProfilePic ? (
                <img 
                  src={post.userProfilePic} 
                  alt={post?.user?.username || 'User'} 
                  className="user-profile-pic"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const iconElement = e.target.parentElement.querySelector('.user');
                    if (iconElement) {
                      iconElement.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <FontAwesomeIcon 
                icon="fa-solid fa-user" 
                size='xl' 
                className='user'
                style={{ display: post?.userProfilePic ? 'none' : 'flex' }}
              />
            </div> 
            <div className="userdetials">
              <h5>{post?.user?.username || post?.username || 'Unknown'}</h5>
              <h6>Qconnect user</h6>
            </div>
          </div>
          {isOwner && (
            <div className="deletebtn">
              <PostManageMenu
                post={post}
                postType="question"
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>

        <div className="postcontent">
          <h3>{post?.title}</h3>
          <div className="post-actions-row">
            <Link to={`/home/${post._id}`} className='lenans'>
              {!post.answers || post.answers.length === 0 ? "No Answers" : `${post.answers.length} Answers `}
            </Link>
            <button className="ansbtn">
              <FontAwesomeIcon icon="fa-regular fa-feather" size='lg' /> Answer
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditPostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          post={post}
          postType="question"
          onSave={handleSave}
          cudetails={cudetails}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          postTitle={post?.title}
        />
      )}
    </>
  )
}

export default Qpost