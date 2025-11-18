import React, { useState } from 'react';
import Grplist from './Grplist';
import Grpnav from './Grpnav';
import Followedgrp from './Followedgrp';

const Grpmain = () => {
  const [activeTab, setActiveTab] = useState('explore');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleGroupCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="grpbox">
      <Grpnav activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'explore' && <Grplist refreshTrigger={refreshTrigger} />}
      {activeTab === 'followed' && <Followedgrp />}
    </div>
  );
};

export default Grpmain;