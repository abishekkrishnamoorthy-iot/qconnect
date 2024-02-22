import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/login/loginpage.css'
const Login = ({setauth,setcudetails}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:3500/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
  
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken); 
        setauth(true); // Store access token in local storage
        
        // Fetch user details after successful login
        const userResponse = await fetch(`http://localhost:3500/currentuser/${username}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          localStorage.setItem('cudetails', JSON.stringify(userData));
          navigate('/home');
        } else {
          throw new Error('Failed to fetch user details');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message); // Display error message from backend
      }
    } catch (error) {
      console.error('Login failed:', error.message);
    }
  };
  

  return (
    <div className='loginpage'>
      <div className="loginpanel">
      <h2>Qconnect</h2>
      <form onSubmit={handleLogin}>
        <div>
          <input type='text' id='username' value={username} onChange={(e) => setUsername(e.target.value)} required  placeholder='Username'/>
        </div>
        <div>
          <input type='password' id='password' value={password} onChange={(e) => setPassword(e.target.value)} required  placeholder='Passcode'/>
        </div>
        <button type='submit'>Login</button>
      </form>
      </div>
    </div>
  );
};

export default Login;
