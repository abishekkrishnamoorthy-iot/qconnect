import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { deletePost } from '../../services/db'
import PostManageMenu from './PostManageMenu'
import EditPostModal from './EditPostModal'
import DeleteConfirmModal from './DeleteConfirmModal'

const Qzpost = ({ post, onPostUpdated, onPostDeleted, cudetails }) => {
  const { currentUser } = useAuth()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const questionCount = post?.questions ? (Array.isArray(post.questions) ? post.questions.length : Object.keys(post.questions).length) : 0
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
      console.error('Error deleting quiz:', error)
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
                  alt={post.createdByName || post.username || 'User'} 
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
              <h5>{post?.createdByName || post?.username || post?.user?.username || 'Unknown'}</h5>
              <h6>Qconnect user</h6>
            </div>
          </div>
          {isOwner && (
            <div className="deletebtn">
              <PostManageMenu
                post={post}
                postType="quiz"
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>

        {post?.banner && (
          <div className="quiz-banner">
            <img src={post.banner} alt={post.title || 'Quiz banner'} />
          </div>
        )}

        <div className="postcontent">
          <h3>{post?.title || 'Untitled Quiz'}</h3>
          {post?.description && (
            <p className="quiz-description">{post.description}</p>
          )}
          <div className="quiz-meta">
            <span>{questionCount} {questionCount === 1 ? 'Question' : 'Questions'}</span>
          </div>
          <div className="post-actions-row">
            <Link to={`/home/quiz`} className='lenans'>View Quiz</Link>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditPostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          post={post}
          postType="quiz"
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

export default Qzpost
