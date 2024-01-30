import React from 'react'
import '../../style/dash/post.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
const Post = ({user}) => {
  return (
    <div className='post'>

       <div className="userprofile">
         <div className="img">
           <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
         </div> 
         <div className="userdetials">
          <h5>{user}</h5>
          <h6>Qconnect user</h6>
         </div>
         <div className="followbtn">
          <button>follow</button>
         </div>  
       </div>

       <div className="postcontent">

       </div>
    </div>
  )
}

export default Post