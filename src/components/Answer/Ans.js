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
        {ans.media && Array.isArray(ans.media) && ans.media.length > 0 && (
          <div className="answer-media-grid">
            {ans.media.map((item, index) => (
              item.type === 'image' ? (
                <img key={index} src={item.url} alt={`Answer media ${index + 1}`} />
              ) : null
            ))}
          </div>
        )}
        <div className="btn"> 
        <button><FontAwesomeIcon icon="fa-regular fa-thumbs-up" bounce /> no likes</button>
        </div>
       </div>
    </div>
  )
}

export default Ans