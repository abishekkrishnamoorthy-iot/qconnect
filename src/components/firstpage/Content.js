import React from 'react'
import google from './google.png'
import { Link } from 'react-router-dom'
const Content = () => {
  return (
    <div className='con'>
         <div className="heading">
         <h1>Where question <br /> connect us all</h1>
         </div>
        <h3>Join now</h3>
        <div className="signupsection">
        <li><span><img src={google} alt='' className='google'/></span>  <span>signup with google</span></li>
        <Link to='/signup' className='signup'>create account</Link>
        </div>
        <div className="login">
          <h2>Already have an account?</h2>
          <Link to="/login" className='loginbtn'>Login</Link>
        </div>
        
    </div>
  )
}

export default Content