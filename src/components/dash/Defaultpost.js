import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../../style/dash/defaultpost.css';
import '../../style/dash/post.css';

const Defaultpost = ({ cudetails }) => {
  const [title, setTitle] = useState('');

  const handlePostQuestion = (e) => {
    e.preventDefault();
    if (title.trim()) {
      alert('Question posted successfully!');
      setTitle('');
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
          <h6>Qconnect Professional</h6>
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
