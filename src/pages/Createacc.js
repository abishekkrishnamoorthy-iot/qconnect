import React, { useState } from 'react'
import Content from '../components/Createacc/Content'
import { useNavigate } from 'react-router-dom'

const Createacc = () => {
  const [username, setusername] = useState('')
  const [email, setemail] = useState('')
  const [passcode, setpasscode] = useState('')
  const [conpass, setconpass] = useState('')
  const navigate = useNavigate()

  const handlesignup = (e) => {
    e.preventDefault();

    if (passcode !== conpass) {
      alert("Passwords do not match");
      return;
    }

    if (username && email && passcode) {
      navigate('/login');
    }
  };

  return (
    <div className='signuppage'>
      <Content
        username={username}
        setusername={setusername}
        passcode={passcode}
        setpasscode={setpasscode}
        email={email}
        setemail={setemail}
        conpass={conpass}
        setconpass={setconpass}
        handlesignup={handlesignup}
      />
    </div>
  )
}

export default Createacc
