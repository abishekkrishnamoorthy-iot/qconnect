import React from 'react';
import '../../style/dash/defaultpost.css';

const Defaultpost = ({ onOpenModal }) => {
  const handleClick = () => {
    if (onOpenModal) {
      onOpenModal();
    }
  };

  return (
    <div className='defaultpost'>
      <div className="question">
        <input
          type="text"
          id="question"
          placeholder='What is your question?'
          onClick={handleClick}
          readOnly
          className="ask-bar-input"
        />
      </div>
    </div>
  );
};

export default Defaultpost;
