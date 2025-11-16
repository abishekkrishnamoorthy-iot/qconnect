import React, { useState } from 'react'
import Grplist from './Grplist'
import Creategrp from './Creategrp'
import Dashnav from '../dash/Dashnav'
import Grpnav from './Grpnav'

const Grpmain = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleGroupCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className='grpbox'>
      <Grpnav/>
      <Creategrp onGroupCreated={handleGroupCreated} />
      <Grplist refreshTrigger={refreshTrigger} />
    </div>
  )
}

export default Grpmain