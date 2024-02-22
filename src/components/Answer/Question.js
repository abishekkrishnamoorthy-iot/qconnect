import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Popup from 'reactjs-popup'
const Question = ({post, id ,userdetails}) => {
  const userid=userdetails?._id
  const [rply,setrply]=useState('')
  console.log(rply)
  const handlerply = async (e) => {
    e.preventDefault();
    // Retrieve access token from local storage
    const accessToken = localStorage.getItem('accessToken');

    try {
        const response = await fetch(`http://localhost:3500/answers/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                user: userid,
                answer: rply
            })
        });

        if (response.ok) {
            console.log('Answer posted successfully');
            setrply('')
        } else {
            console.error('Failed to post answer:', response.statusText);
        }
    } catch (error) {
        console.error('Error posting answer:', error.message);
    }
};
useEffect(()=>{
},[handlerply])

  
  return (
    <div className='questionpanel'>
       <div className="userprofile">
         <div className="img">
           <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
         </div> 
         <div className="userdetials">
          <h5>{post?.user?.username}</h5>
          <h6>Qconnect user</h6>
         </div>
         <div className="followbtn">
          <button>follow</button>
         </div>  
       </div>
       <h1>{post?.qpost?.title}</h1>
      <Popup trigger={<button className='ansbtn'>Write answer</button>} position={'left center'} >
        <div className='write'>
          <div className="title">
          <h1>{post?.qpost?.title}</h1>
          </div>
            <form onSubmit={handlerply}>
            <textarea
            className='textarea'
            placeholder='write your answer'
            id='answer'
            name='ans'
            value={rply}
            onChange={(e) => setrply(e.target.value)}
        />
            <button onClick={()=> CloseEvent}>post</button>
            </form>
        </div>
      </Popup>
    </div>
  )
}

export default Question