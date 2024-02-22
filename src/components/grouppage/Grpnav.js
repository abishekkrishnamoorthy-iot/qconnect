import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Grpnav = () => {
    const { pathname } = useLocation();
  return (
    <div className='grpnav'>
      <ul>
      <Link to="/group/id" className={pathname === "/group/id" ? 'active text' : 'text'}>
        My Group
      </Link>
      <Link to="/followedgrp/id"className={pathname === "/followedgrp/id" ? 'active text' : 'text'}>Group Followed</Link>
      </ul>
    </div>
    
  )
}

export default Grpnav