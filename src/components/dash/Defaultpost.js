import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../../style/dash/defaultpost.css';
import '../../style/dash/post.css';
import { useAuth } from '../../context/AuthContext';
import { createPost } from '../../services/db';

const Defaultpost = ({ cudetails, onPostCreated }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePostQuestion = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a question title');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to post');
      return;
    }

    setLoading(true);

    const result = await createPost({
      userId: currentUser.uid,
      username: cudetails?.username || 'Unknown',
      title: title.trim(),
      text: text.trim() || '',
      groupId: null // Can be set if posting to a group
    });

    if (result.success) {
      setTitle('');
      setText('');
      if (onPostCreated) {
        onPostCreated();
      }
    } else {
      setError(result.error || 'Failed to create post');
    }

    setLoading(false);
  };

  return (
    <div className='defaultpost'>
      <div className="userprofile">
        <div className="img">
          <FontAwesomeIcon icon="fa-solid fa-user" size='xl' className='user'/>
        </div>
        <div className="userdetials">
          <h5>{cudetails?.username || 'User'}</h5>
          <h6>Qconnect Professional</h6>
        </div>
      </div>
      <div className="question">
        {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
        <form onSubmit={handlePostQuestion}>
          <input
            type="text"
            id="question"
            placeholder='What is your question?'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            required
          />
          <textarea
            placeholder='Add more details (optional)'
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            rows="2"
            style={{ width: '100%', marginTop: '10px', padding: '8px' }}
          />
          <button type="submit" className='postbtn' disabled={loading}>
            {loading ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Defaultpost;
