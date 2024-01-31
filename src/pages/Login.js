import React, { useEffect, useState } from 'react'
import Header from '../components/login/Header'
import Content from '../components/login/Content'
import { useNavigate } from 'react-router-dom'

const Login = ({auth,setauth,user,setuser,curuser,setcuruser}) => {
    const url="http://localhost:5000/user"
    const [username,setusername]=useState('')
     const [passcode, setpasscode]=useState("")
     const navigate=useNavigate()
      const handlelogin= async(e)=>{
        e.preventDefault()
        const getuser= user.filter(i=>i.username === username && i.passcode===passcode)
        const bool=()=>{
          if(getuser.length){
            return true
          }else{
            return false
          }
        }
        bool()? navigate('/dash'):navigate('/login')
        setauth(bool)
      }
  return (
    <div className='loginpage'>
        <Content handlelogin={handlelogin}
                 username={username}
                 setusername={setusername}
                 passcode={passcode}
                 setpasscode={setpasscode}
                 />
    </div>
  )
}

export default Login