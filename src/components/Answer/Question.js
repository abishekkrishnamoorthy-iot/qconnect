import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import Popup from 'reactjs-popup'

const Question = ({post, id, userdetails}) => {
  const [rply, setrply] = useState('')

  const handlerply = (e) => {
    e.preventDefault();
    if (rply.trim()) {
      alert('Answer posted successfully!');
      setrply('')
    }
  };

  return (
    <div className='questionpanel'>
      <div className="userprofile">
        <div className="img">
          <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
        </div>
        <div className="userdetials">
          <h5>{post?.user?.username}</h5>
          <h6>Qconnect Professional</h6>
        </div>
        <div className="followbtn">
          <button>Follow</button>
        </div>
      </div>
      <h1>{post?.qpost?.title}</h1>
      <Popup trigger={<button className='ansbtn'>Write Answer</button>} position={'left center'}>
        <div className='write'>
          <div className="title">
            <h1>{post?.qpost?.title}</h1>
          </div>
          <form onSubmit={handlerply}>
            <textarea
              className='textarea'
              placeholder='Write your answer'
              id='answer'
              name='ans'
              value={rply}
              onChange={(e) => setrply(e.target.value)}
            />
            <button type="submit">Post</button>
          </form>
        </div>
      </Popup>
    </div>
  )
}

export default Question
