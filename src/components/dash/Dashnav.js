import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../../style/dash/dashnav.css'

const Dashnav = () => {
  const location = useLocation()
  const path = location.pathname

  const isActive = (route) => {
    if (route === '/home/all') {
      return path === '/home/all' || path === '/home'
    }
    return path === route
  }

  return (
    <div className='dashnav'>
      <ul>
        <Link 
          to="/home/all" 
          className={`text ${isActive('/home/all') ? 'active' : ''}`}
        >
          All
        </Link>
        <Link 
          to="/home/qpost" 
          className={`text ${isActive('/home/qpost') ? 'active' : ''}`}
        >
          Q&A
        </Link>
        <Link 
          to="/home/quiz" 
          className={`text ${isActive('/home/quiz') ? 'active' : ''}`}
        >
          Quiz
        </Link>
      </ul>
    </div>
  )
}

export default Dashnav