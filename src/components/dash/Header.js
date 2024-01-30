import React from 'react'
import Nav from './Nav'
import Search from './Search'
import Profile from './Profile'

const Header = () => {
  return (
    <div className='headerdash'>
      <div className="logo">
         <h1>LOGO</h1>
      </div>
      <Nav/>
      <Search/>
      <Profile/>
    </div>
  )
}

export default Header