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
        <Grouppanel/>
        <NotificationsPanel/>
        <TrendingGroups/>
      </div>
    </div>
  )
}

export default NotificationsPage

