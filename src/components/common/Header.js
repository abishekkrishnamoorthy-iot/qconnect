import React from 'react'
import Nav from './Nav'
import Search from './Search'
import Profile from './Profile'
import Notifications from './Notifications'

const Header = () => {
  return (
    <div className='headerdash'>
      <div className="logo">
         <h1><span style={{color:"#ee930b"}}>Q</span>connect</h1>
      </div>
      <Nav/>
      <Search/>
      <Notifications/>
      <Profile/>
    </div>
  )
}

export default Header