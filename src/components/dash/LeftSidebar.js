import React from 'react'
import UserProfileCard from './UserProfileCard'
import UserStatsCard from './UserStatsCard'
import '../../style/dash/leftSidebar.css'

const LeftSidebar = () => {
  return (
    <div className="left-sidebar">
      <UserProfileCard />
      <UserStatsCard />
    </div>
  )
}

export default LeftSidebar

