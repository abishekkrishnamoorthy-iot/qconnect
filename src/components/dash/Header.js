import React from 'react'
import Nav from './Nav'
import Search from './Search'

const Header = () => {
  return (
    <div className='headerdash'>
      <div className="logo">
         <h1>LOGO</h1>
      </div>
      <Nav/>
      <Search/>
    </div>
  )
}

export default Header