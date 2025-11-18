import React from 'react';

const Grpnav = ({ activeTab, setActiveTab }) => {
  return (
    <div className="grpnav">
      <ul>
        <button
          className={activeTab === 'explore' ? 'text active' : 'text'}
          onClick={() => setActiveTab('explore')}
        >
          Explore Groups
        </button>
        <button
          className={activeTab === 'followed' ? 'text active' : 'text'}
          onClick={() => setActiveTab('followed')}
        >
          Group Followed
        </button>
      </ul>
    </div>
  );
};

export default Grpnav;