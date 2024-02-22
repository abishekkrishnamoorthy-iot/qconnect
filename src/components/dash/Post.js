import React, { useState } from 'react'
import '../../style/dash/post.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { Link } from 'react-router-dom'
const Post = ({post,postid,len}) => {
  return (
    <div className='post'>
       <div className="userprofile">
         <div className="img">
           <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
         </div> 
         <div className="userdetials">
          <h5>{post.username}</h5>
          <h6>Qconnect user</h6>
         </div>
         <div className="followbtn">
          <button>follow</button>
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

export default Post