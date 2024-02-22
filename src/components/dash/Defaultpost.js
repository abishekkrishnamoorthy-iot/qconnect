import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../../style/dash/defaultpost.css';
import '../../style/dash/post.css';

const Defaultpost = ({ cudetails }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('Default post');
  const userdetails=localStorage.getItem('cudetails')
  const userid=JSON.stringify(userdetails)
  console.log()
  const handlePostQuestion = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const postData = {
        user: cudetails._id, // Example user ID
        title: title,
        text: 'hello'
      };
  
      const response = await fetch('http://localhost:3500/qpost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(postData)
      });
  
      if (response.ok) {
        console.log('Question posted successfully');
      } else {
        console.error('Failed to post question');
      }
    } catch (error) {
      console.error('Error posting question:', error.message);
    }
  };
  

  return (
    <div className='defaultpost'>
      <div className="userprofile">
        <div className="img">
          <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
        </div>
        <div className="userdetials">
          <h5>{cudetails?.username}</h5>
          <h6>Qconnect user</h6>
        </div>
      </div>
      <div className="question">
        <form onSubmit={handlePostQuestion}>
          <input
            type="text"
            id="question"
            placeholder='What is your question?'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit" className='postbtn'>Post</button>
        </form>
      </div>
    </div>
  );
};

export default Defaultpost;
