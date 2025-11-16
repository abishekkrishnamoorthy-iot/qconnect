import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/login/loginpage.css'

const Login = ({setauth}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (username && password) {
      setauth(true);
      navigate('/home');
    }
  };

  return (
    <div className='loginpage'>
      <div className="loginpanel">
        <h2>Qconnect</h2>
        <form onSubmit={handleLogin}>
          <div>
            <input
              type='text'
              id='username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder='Username'
            />
          </div>
          <div>
            <input
              type='password'
              id='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder='Passcode'
            />
          </div>
          <button type='submit'>Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
