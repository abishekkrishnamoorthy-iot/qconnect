import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { Link } from 'react-router-dom'

const Nav = ({icon}) => {
  return (
    <div className='nav'>
      <ul >
        <Link className='icon' to='/home'><FontAwesomeIcon icon="fa-solid fa-house" size='2xl'  /></Link>
        <Link className='icon'to='/Group'><FontAwesomeIcon icon="fa-solid fa-people-group" size='2xl' /></Link>
        <Link className='icon'><FontAwesomeIcon icon="fa-solid fa-circle-plus" size='2xl' /></Link>
        <Link className='icon'to='/notification'><FontAwesomeIcon icon="fa-solid fa-bell" size='2xl' /></Link>
      </ul>
    </div>
  )
}

export default Nav