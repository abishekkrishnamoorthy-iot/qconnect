import React from 'react'
import '../../style/dash/defaultpost.css'
import '../../style/dash/post.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
const Defaultpost = ({user}) => {
  return (
    <div className='defaultpost'>
        <div className="userprofile">
         <div className="img">
           <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
         </div> 
         <div className="userdetials">
          <h5>abishek</h5>
          <h6>Qconnect user</h6>
         </div>  
       </div>
      <div className="question">
          <form >
            <input type="text"
                   id="question"
                   placeholder='What is ur Question?'
                    />
            <button className='postbtn'>post</button>
          </form>
      </div>
    </div>
  )
}

export default Defaultpost