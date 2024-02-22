import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import '../../style/dash/ans.css'
const Ans = ({ans}) => {
  return (
    <div className='ans'>
     <div className="userprofile">
         <div className="img">
           <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
         </div> 
         <div className="userdetials">
          <h5>{ans.username}</h5>
          <h6>Qconnect user</h6>
         </div>  
       </div>
       <div className="anscon">
        <p>{ans.answer}</p>
        <div className="btn"> 
        <button><FontAwesomeIcon icon="fa-regular fa-thumbs-up" bounce /> no likes</button>
        </div>
       </div>
    </div>
  )
}

export default Ans