import React from 'react'
import google from './google.png'
const Content = () => {
  return (
    <div className='con'>
         <div className="heading">
         <h1>Where question <br /> connect us all</h1>
         </div>
        
        <h3>Join now</h3>
        <div className="signupsection">
        <li><span><img src={google} alt='' className='google'/></span>  <span>signup with google</span></li>
        <li>create account</li>
        </div>
        <div className="login">
          <h2>Already have an account?</h2>
          <li>Login</li>
        </div>
        
    </div>
  )
}

export default Content