/**
 * EmailJS Service for Qconnect
 * Handles sending verification emails using EmailJS
 */
import emailjs from '@emailjs/browser';

// EmailJS Configuration - All values must be set in .env file
const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
  throw new Error(
    'Missing required EmailJS environment variables. Please set REACT_APP_EMAILJS_SERVICE_ID, ' +
    'REACT_APP_EMAILJS_TEMPLATE_ID, and REACT_APP_EMAILJS_PUBLIC_KEY in your .env file. ' +
    'See .env.example for reference.'
  );
}

// Initialize EmailJS (call this once in your app, typically in index.js or App.js)
export const initEmailJS = () => {
  try {
    emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize EmailJS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send account verification OTP email via EmailJS
 * @param {string} userEmail - Recipient email address
 * @param {string} otpCode - One-Time Password code (6 digits)
 * @param {string} expiryTime - Expiry time in readable format (e.g., "Nov 23, 2024 8:45 PM")
 * @param {string} userName - Optional user name for personalization
 * @returns {Promise<Object>} - Response from EmailJS
 */
export const sendVerificationEmail = async (userEmail, otpCode, expiryTime, userName = 'there') => {
  try {
    // Validate email
    if (!userEmail || !userEmail.trim()) {
      console.error('Email is empty or invalid:', userEmail);
      return { 
        success: false, 
        error: 'Email address is required' 
      };
    }

    // Ensure EmailJS is initialized
    initEmailJS();
    
    // Template parameters that match the EmailJS template
    // Note: EmailJS service must be configured to use 'to_email' or 'email' as recipient
    const templateParams = {
      to_email: userEmail,
      email: userEmail, // Alternative parameter name
      to_name: userName || 'there',
      user_name: userName || 'there', // Alternative parameter name
      passcode: otpCode,
      otp: otpCode, // Alternative key for template compatibility
      time: expiryTime,
      company_name: 'Qconnect',
      website_link: process.env.REACT_APP_WEBSITE_URL || process.env.REACT_APP_WEBSITE_LINK || 'https://qconnect.com'
    };
    
    console.log('Sending verification email to:', userEmail);
    console.log('Using service ID:', EMAILJS_SERVICE_ID);
    console.log('Using template ID:', EMAILJS_TEMPLATE_ID);
    
    // Send email using EmailJS send method
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    
    console.log('Verification email sent successfully:', response);
    return { success: true, response };
    
  } catch (error) {
    console.error('Failed to send verification email:', error);
    console.error('Error details:', {
      text: error.text,
      message: error.message,
      status: error.status
    });
    
    // Handle specific error cases
    let errorMessage = 'Failed to send verification email';
    if (error.text) {
      errorMessage = error.text;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Check for specific EmailJS errors
    if (errorMessage.includes('recipient') || errorMessage.includes('address is empty')) {
      errorMessage = 'Email address is required. Please check your EmailJS service configuration.';
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

/**
 * Generate expiry time string (10 minutes from now for OTP validity)
 * @param {number} minutes - Number of minutes from now (default: 10)
 * @returns {string} - Formatted expiry time
 */
export const generateExpiryTime = (minutes = 10) => {
  const now = new Date();
  const expiry = new Date(now.getTime() + minutes * 60 * 1000);
  
  return expiry.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get expiry timestamp (10 minutes from now)
 * @param {number} minutes - Number of minutes from now (default: 10)
 * @returns {number} - Unix timestamp
 */
export const getExpiryTimestamp = (minutes = 10) => {
  const now = new Date();
  return now.getTime() + minutes * 60 * 1000;
};

/**
 * Generate a random 6-digit OTP
 * @returns {string} - 6-digit OTP code
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Example usage:
 * 
 * import { sendVerificationEmail, generateOTP, generateExpiryTime } from '../utils/emailService';
 * 
 * const otp = generateOTP();
 * const expiryTime = generateExpiryTime();
 * 
 * const result = await sendVerificationEmail(
 *   'user@example.com',
 *   otp,
 *   expiryTime,
 *   'John Doe'
 * );
 * 
 * if (result.success) {
 *   console.log('Email sent!');
 * } else {
 *   console.error('Error:', result.error);
 * }
 */

