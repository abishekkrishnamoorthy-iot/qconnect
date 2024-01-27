import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'

const Nav = ({icon}) => {
  return (
    <div className='nav'>
      <ul >
        <li className='icon'><FontAwesomeIcon icon="fa-solid fa-house" size='2xl'  /></li>
        <li className='icon'><FontAwesomeIcon icon="fa-solid fa-people-group" size='2xl' /></li>
        <li className='icon'><FontAwesomeIcon icon="fa-solid fa-circle-plus" size='2xl' /></li>
        <li className='icon'><FontAwesomeIcon icon="fa-solid fa-bell" size='2xl' /></li>
      </ul>
    </div>
  )
}

export default Nav