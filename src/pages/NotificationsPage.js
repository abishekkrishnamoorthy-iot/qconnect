import React from 'react'
import Header from '../components/common/Header'
import Grouppanel from '../components/dash/Grouppanel'
import TrendingGroups from '../components/dash/TrendingGroups'
import NotificationsPanel from '../components/notifications/NotificationsPanel'

const NotificationsPage = () => {
  return (
    <div className='dash'>
      <Header/>
      <div className='dashcon'>
        <div className="dashcon-left">
          <TrendingGroups/>
          <Grouppanel/>
        </div>
        <NotificationsPanel/>
      </div>
    </div>
  )
}

export default NotificationsPage

