import React, { useEffect, useState } from 'react'
import Header from '../components/login/Header'
import Content from '../components/login/Content'
import { useNavigate } from 'react-router-dom'

const Login = ({handlelogin,username,setusername,passcode,setpasscode,auth}) => {
     
  return (
    <div className='loginpage'>
        <Content handlelogin={handlelogin}
                 username={username}
                 setusername={setusername}
                 passcode={passcode}
                 setpasscode={setpasscode}
                 auth={auth}
                 />
    </div>
  )
}

export default Login