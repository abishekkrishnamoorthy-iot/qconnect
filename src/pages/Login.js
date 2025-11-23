import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../style/login/loginpage.css';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login, signInWithGoogle } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/home');
    } else {
      setError(result.error || 'Failed to login. Please check your credentials.');
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
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
    <div className='loginpage'>
      <div className="loginpanel">
        <div className="login-panel-header">
          <div className="login-logo">
            <span className="login-logo-q">Q</span>
            <span className="login-logo-text">connect</span>
          </div>
          <h2>Welcome back</h2>
          <p>Sign in to continue to your account</p>
        </div>

        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <input
              type='text'
              id='username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder=' '
              disabled={loading || googleLoading}
            />
            <label htmlFor='username'>Username or Email</label>
          </div>
          
          <div className="form-group">
            <input
              type='password'
              id='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=' '
              disabled={loading || googleLoading}
            />
            <label htmlFor='password'>Password</label>
          </div>
          
          <button type='submit' className="login-submit-btn" disabled={loading || googleLoading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-divider">
          <span>OR</span>
        </div>
        
        <div className="google-login-container">
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="google-login-button"
          >
            {googleLoading ? (
              'Signing in...'
            ) : (
              <>
                <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        <div className="login-footer">
          <p>Don't have an account? <Link to="/signup" className="signup-link">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
