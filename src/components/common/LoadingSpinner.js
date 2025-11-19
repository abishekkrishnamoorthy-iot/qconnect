import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../../style/common/loading.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner">
        <FontAwesomeIcon icon="fa-solid fa-spinner" spin size="2x" />
      </div>
      <p className="loading-text">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;

