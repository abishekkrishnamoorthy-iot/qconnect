import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { Link } from 'react-router-dom'

const Qpost = ({post}) => {
    console.log(post)
  return (
    <div className='post'>
    <div className="userprofile">
      <div className="img">
        <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
      </div> 
      <div className="userdetials">
       <h5>{post?.user.username}</h5>
       <h6>Qconnect user</h6>
      </div>
      <div className="deletebtn">
      <FontAwesomeIcon icon="fa-solid fa-ban" size='2xl' />
      </div>  
    </div>

    <div className="postcontent">
        <h3>{post.title}</h3>
        <Link to={`/home/${post._id}`} className='lenans'>{post.answers.length === 0 ? "No Answers" : `${post.answers.length} Answers `}</Link>
        <button className="ansbtn"><FontAwesomeIcon icon="fa-regular fa-feather" size='lg' /> Answer</button>
    </div>
 </div>
  )
}

export default Qpost