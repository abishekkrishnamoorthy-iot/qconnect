import React from 'react'

const Question = ({ post, onWriteAnswer }) => {
  const questionTitle = post?.title || post?.qpost?.title || 'Question'

  return (
    <div className='questionpanel'>
      <div className="question-header">
        <span className="question-topic">{post?.topic || 'Qconnect question'}</span>
      </div>
      <h1>{questionTitle}</h1>
      {post?.text && (
        <p className="question-body">
          {post.text}
        </p>
      )}

      {post?.media && Array.isArray(post.media) && post.media.length > 0 && (
        <div className="question-media">
          {post.media.map((mediaItem, index) => (
            mediaItem.type === 'image' ? (
              <img key={index} src={mediaItem.url} alt={`Question media ${index + 1}`} />
            ) : null
          ))}
        </div>
      )}

      <div className="question-actions">
        <button className='ansbtn' onClick={onWriteAnswer}>
          Write Answer
        </button>
      </div>
    </div>
  )
}

export default Question
