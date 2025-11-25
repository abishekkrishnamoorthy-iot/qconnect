import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../style/auth/verifyEmail.css';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendVerificationEmail } = useAuth();
  
  // Get tempUserId and email from location state or query params
  const tempUserId = location.state?.tempUserId || new URLSearchParams(location.search).get('tempUserId');
  const email = location.state?.email || new URLSearchParams(location.search).get('email');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [success, setSuccess] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  
  const inputRefs = [];

  // Redirect if no tempUserId or email
  useEffect(() => {
    if (!tempUserId || !email) {
      navigate('/signup', { replace: true });
    }
  }, [tempUserId, email, navigate]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs[0]) {
      inputRefs[0].focus();
    }
  }, []);

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');
    setRemainingAttempts(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (i < 6) {
            newOtp[i] = digit;
          }
        });
        setOtp(newOtp);
        setError('');
        // Focus last filled input or last input
        const lastFilledIndex = digits.length - 1;
        inputRefs[Math.min(lastFilledIndex, 5)]?.focus();
      });
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setRemainingAttempts(null);

    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);

    const result = await verifyEmail(tempUserId, otpCode);
    
    if (result.success) {
      setSuccess(true);
      // Redirect to onboarding after a brief delay
      setTimeout(() => {
        navigate('/onboarding', { replace: true });
      }, 1500);
    } else {
      setError(result.error || 'Verification failed. Please try again.');
      setRemainingAttempts(result.remainingAttempts);
      
      if (result.locked || result.expired) {
        // Clear OTP on lock or expiry
        setOtp(['', '', '', '', '', '']);
        if (inputRefs[0]) {
          inputRefs[0].focus();
        }
      }
    }
    
    setLoading(false);
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resendLoading) {
      return;
    }

    setResendLoading(true);
    setError('');

    const result = await resendVerificationEmail(tempUserId);
    
    if (result.success) {
      setResendTimer(60); // 60 seconds cooldown
      setError('');
      setOtp(['', '', '', '', '', '']);
      if (inputRefs[0]) {
        inputRefs[0].focus();
      }
      // Show success message briefly
      const successMsg = document.createElement('div');
      successMsg.textContent = 'Verification code sent!';
      successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4caf50; color: white; padding: 12px 24px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
      document.body.appendChild(successMsg);
      setTimeout(() => {
        document.body.removeChild(successMsg);
      }, 3000);
    } else {
      const errorMsg = result.error || 'Failed to resend code. Please try again.';
      setError(errorMsg);
      
      // Show detailed error message
      console.error('Resend email error:', result.error);
      
      // If it's an email address error, provide helpful message
      if (errorMsg.includes('recipient') || errorMsg.includes('address is empty')) {
        setError('Email configuration error. Please contact support or try again later.');
      }
    }
    
    setResendLoading(false);
  };

  // Show loading or redirect if missing data
  if (!tempUserId || !email) {
    return (
      <div className="verify-email-page">
        <div className="verify-email-container">
          <div className="verify-email-card">
            <div className="verify-email-header">
              <h1>
                <span style={{ color: '#ee930b' }}>Q</span>connect
              </h1>
              <h2>Verification Error</h2>
              <p className="verify-email-subtitle">
                Missing verification information. Redirecting to signup...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        <div className="verify-email-card">
          {/* Header */}
          <div className="verify-email-header">
            <h1>
              <span style={{ color: '#ee930b' }}>Q</span>connect
            </h1>
            <h2>Verify Your Email</h2>
            <p className="verify-email-subtitle">
              We've sent a verification code to<br />
              <strong>{email || 'your email address'}</strong>
            </p>
            {!email && (
              <div className="verify-email-error" style={{ marginTop: '15px' }}>
                Email address not found. Please try signing up again.
              </div>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <div className="verify-email-success">
              <div className="success-icon">✓</div>
              <p>Email verified successfully! Redirecting...</p>
            </div>
          )}

          {/* OTP Input */}
          {!success && (
            <>
              <form onSubmit={handleVerify} className="verify-email-form">
                <div className="otp-input-container">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="otp-input"
                      disabled={loading}
                    />
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="verify-email-error">
                    <strong>Error:</strong> {error}
                    {error.includes('EmailJS') || error.includes('recipient') || error.includes('address is empty') ? (
                      <div style={{ marginTop: '10px', fontSize: '12px', lineHeight: '1.4' }}>
                        💡 Make sure your EmailJS service is configured to use <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>{'{{to_email}}'}</code> or <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>{'{{email}}'}</code> as the recipient address.
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Remaining Attempts */}
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <div className="verify-email-warning">
                    {remainingAttempts} attempt(s) remaining
                  </div>
                )}

                {/* Verify Button */}
                <button
                  type="submit"
                  className="verify-email-button"
                  disabled={loading || otp.join('').length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>

              {/* Resend Section */}
              <div className="verify-email-resend">
                <p>Didn't receive the code?</p>
                <button
                  onClick={handleResend}
                  disabled={resendTimer > 0 || resendLoading}
                  className="resend-button"
                >
                  {resendLoading
                    ? 'Sending...'
                    : resendTimer > 0
                    ? `Resend code (${resendTimer}s)`
                    : 'Resend Code'}
                </button>
              </div>

              {/* Change Email */}
              <div className="verify-email-change-email">
                <p>
                  Wrong email?{' '}
                  <Link to="/signup" className="change-email-link">
                    Change email address
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

