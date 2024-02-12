import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
const Grp = ({user}) => {
  return (
    <div className='grp'>

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

export default Grp