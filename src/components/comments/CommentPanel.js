import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../../context/AuthContext';
import useComments from '../../hooks/useComments';
import '../../style/dash/post.css';

const CommentPanel = ({ postId }) => {
  const { currentUser, userData } = useAuth();
  const { comments, loading, error, submitting, addComment } = useComments(postId);
  const [text, setText] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!currentUser || !text.trim()) return;

    await addComment({
      uid: currentUser.uid,
      username: userData?.profile?.username || userData?.username || currentUser.displayName || 'Qconnect user',
      profilePic: userData?.profile?.profilePic || currentUser.photoURL || '',
      text,
    });
    setText('');
  };

  return (
    <div className="comment-panel">
      <div className="comment-panel-header">
        <FontAwesomeIcon icon="fa-regular fa-comments" />
        <span>
          {comments.length === 0
            ? 'No comments yet'
            : `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}`}
        </span>
      </div>

      {loading ? (
        <div className="comment-panel-loading">Loading comments...</div>
      ) : (
        <div className="comment-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                {comment.profilePic ? (
                  <img src={comment.profilePic} alt={comment.username} />
                ) : (
                  <FontAwesomeIcon icon="fa-solid fa-user" />
                )}
              </div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-username">{comment.username}</span>
                  <span className="comment-date">
                    {comment.createdAt
                      ? new Date(comment.createdAt).toLocaleString()
                      : ''}
                  </span>
                </div>
                <p>{comment.text}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && !loading && (
            <div className="comment-empty">Be the first to comment.</div>
          )}
        </div>
      )}

      {error && <div className="comment-error">{error}</div>}

      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          placeholder={
            currentUser ? 'Add a comment...' : 'Login to add a comment'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={(e) => e.target.classList.add('focused')}
          onBlur={(e) => e.target.classList.remove('focused')}
          disabled={!currentUser || submitting}
          maxLength={1000}
        />
        <button type="submit" disabled={!currentUser || submitting || !text.trim()}>
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
};

export default CommentPanel;

