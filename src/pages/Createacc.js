import React, { useState } from 'react'
import Content from '../components/Createacc/Content'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Createacc = () => {
  const [username, setusername] = useState('')
  const [email, setemail] = useState('')
  const [passcode, setpasscode] = useState('')
  const [conpass, setconpass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()
  const { signup, signInWithGoogle } = useAuth()

  const handlesignup = async (e) => {
    e.preventDefault();
    setError('');

    if (passcode !== conpass) {
      setError("Passwords do not match");
      return;
    }

    if (passcode.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!username || !email || !passcode) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    const result = await signup(email, passcode, username);
    
    if (result.success) {
      // Redirect to verification page with tempUserId and email
      navigate('/verify-email', {
        state: {
          tempUserId: result.tempUserId,
          email: result.email,
          emailSent: result.emailSent
        },
        replace: true
      });
    } else {
      setError(result.error || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setGoogleLoading(true);

    const result = await signInWithGoogle();
    
    if (result.success) {
      // Check if onboarding is completed
      const firstLoginCompleted = result.userData?.profile?.firstLoginCompleted || result.userData?.setupComplete === true;
      
      if (firstLoginCompleted) {
        navigate('/home');
      } else {
        navigate('/onboarding');
      }
    } else if (result.error) {
      // Only show error if it's not a popup-closed case
      setError(result.error);
    }
    
    setGoogleLoading(false);
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
        handleGoogleSignup={handleGoogleSignup}
        error={error}
        loading={loading}
        googleLoading={googleLoading}
      />
    </div>
  )
}

export default Createacc
