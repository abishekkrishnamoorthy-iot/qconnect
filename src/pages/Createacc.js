import React, { useState } from 'react'
import Content from '../components/Createacc/Content'
import Api_req from '../Api_req'
import {  useNavigate } from 'react-router-dom'

const Createacc = ({user,setuser}) => {
       const [username,setusername]=useState('')
       const [email,setemail]=useState('')
       const [passcode,setpasscode]=useState('')
       const [conpass,setconpass]=useState('')
       const url='http://localhost:5000/user'
       const navigate=useNavigate()
       const handlesignup=async(e)=>{
              e.preventDefault()
              console.log(passvalidation())
              if(passvalidation()===passcode){    
                 const id= user.length ? user[user.length-1].id+1:1
                 const newuser={id,username:username,email:email,passcode:passcode}
                 const newdata={...user,newuser}
                 setuser(newdata)
                 const postoption={
                     method: 'POST',
                     headers: {'Content-Type':'application/json'},
                     body: JSON.stringify(newuser)
                   }
                   const result=await Api_req(url,postoption)
                   console.log(result)
                   navigate('/login')
              }else{console.log("error")
                     navigate("/signup")}
       }
       const passvalidation=()=>{
            if(passcode===conpass){
              return passcode
            }
            else{
              return "wrong"
            }
       }
  return (
    <div className='signuppage'>
        <Content username={username}
                 setusername={setusername}
                 passcode={passcode}
                 setpasscode={setpasscode}
                 email={email}
                 setemail={setemail}
                 conpass={conpass}
                 setconpass={setconpass}
                 handlesignup={handlesignup}/>
    </div>
  )
}

export default Createacc