import React, { useState, useEffect } from 'react'
import '../../style/dash/post.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { deletePost, followUser, unfollowUser, isFollowing } from '../../services/db'

const Post = ({ post, postid, onDelete }) => {
  const { currentUser } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    if (currentUser && post.userId && post.userId !== currentUser.uid) {
      checkFollowStatus()
    }
  }, [currentUser, post.userId])

  const checkFollowStatus = async () => {
    const result = await isFollowing(currentUser.uid, post.userId)
    if (result.success) {
      setFollowing(result.isFollowing)
    }
  }

  const handleFollow = async () => {
    if (!currentUser || !post.userId || post.userId === currentUser.uid) return

    setFollowLoading(true)
    
    if (following) {
      const result = await unfollowUser(currentUser.uid, post.userId)
      if (result.success) {
        setFollowing(false)
      }
    } else {
      const result = await followUser(currentUser.uid, post.userId)
      if (result.success) {
        setFollowing(true)
      }
    }
    
    setFollowLoading(false)
  }

  // Count answers - answers can be an object or array
  const answerCount = post.answers 
    ? (Array.isArray(post.answers) ? post.answers.length : Object.keys(post.answers).length)
    : 0

  const isOwner = currentUser && post.userId === currentUser.uid

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return
    }

    setDeleting(true)
    const result = await deletePost(post._id)
    
    if (result.success && onDelete) {
      onDelete()
    }
    
    setDeleting(false)
  }

  return (
    <div className='post'>
       <div className="userprofile">
         <div className="img">
           <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
         </div> 
         <div className="userdetials">
          <h5>{post.username || 'Unknown'}</h5>
          <h6>Qconnect user</h6>
         </div>
         <div className="followbtn">
          {isOwner ? (
            <button onClick={handleDelete} disabled={deleting} style={{ background: 'red', color: 'white' }}>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          ) : currentUser && post.userId !== currentUser.uid ? (
            <button onClick={handleFollow} disabled={followLoading}>
              {followLoading ? '...' : following ? 'Unfollow' : 'Follow'}
            </button>
          ) : null}
         </div>  
       </div>

       <div className="postcontent">
           <h3>{post.title}</h3>
           {post.text && <p style={{ marginTop: '10px', color: '#666' }}>{post.text}</p>}
           <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
             <Link to={`/home/${post._id}`} className='lenans'>
               {answerCount === 0 ? "No Answers" : `${answerCount} ${answerCount === 1 ? 'Answer' : 'Answers'}`}
             </Link>
             <Link to={`/home/${post._id}`}>
               <button className="ansbtn">
                 <FontAwesomeIcon icon="fa-regular fa-feather" size='lg' /> Answer
               </button>
             </Link>
           </div>
       </div>
    </div>
  )
}

export default Post