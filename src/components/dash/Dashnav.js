import React from 'react'
import { Link } from 'react-router-dom'
import '../../style/dash/dashnav.css'
const Dashnav = () => {
  return (
    <div className='dashnav'>
      <ul>
      <Link to="/home/qpost" className='text'>Q&A</Link>  
      <Link to="/home/quiz" className='text'>quiz</Link>
      </ul>
    </div>
  )
}

export default Dashnav