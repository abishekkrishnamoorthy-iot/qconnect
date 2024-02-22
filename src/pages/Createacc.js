import React, { useEffect, useState } from 'react'
import Content from '../components/Createacc/Content'
import Api_req from '../Api_req'
import {  useNavigate } from 'react-router-dom'

const Createacc = ({user,setuser}) => {
       const [username,setusername]=useState('')
       const [email,setemail]=useState('')
       const [passcode,setpasscode]=useState('')
       const [conpass,setconpass]=useState('')
       const url='http://localhost:3500/users'
       const navigate=useNavigate()
       const handlesignup = async (e) => {
        e.preventDefault();
        
        // Validate passwords
        if (passcode !== conpass) {
          console.log("Passwords do not match");
          return;
        }
      
        const newuser = { username: username, password: passcode, email: email, roles: ["user"] };
      
        try {
          // Post the new user data to the backend
          const postOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newuser)
          };
      
          const response = await fetch('http://localhost:3500/users', postOptions);
          if (!response.ok) {
            throw new Error('Failed to create user');
          }
      
          // Fetch updated user data from the backend
          const fetchData = async () => {
            try {
              const res = await fetch('http://localhost:3500/users');
              if (!res.ok) throw Error("Error fetching data");
              const users = await res.json();
              setuser(users);
              console.log(users);
              navigate('/login');
            } catch (error) {
              console.error('Error fetching data:', error.message);
            }
          };
          
          fetchData();
        } catch (error) {
          console.error('Error creating user:', error.message);
        }
      };
      
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