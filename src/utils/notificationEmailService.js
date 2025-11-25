import emailjs from '@emailjs/browser';

// EmailJS Configuration - All values must be set in .env file
const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_NOTIFICATION_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
const WEBSITE_LINK = process.env.REACT_APP_WEBSITE_LINK || process.env.REACT_APP_WEBSITE_URL || 'https://qconnect.com';

if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
  throw new Error(
    'Missing required EmailJS environment variables. Please set REACT_APP_EMAILJS_SERVICE_ID, ' +
    'REACT_APP_EMAILJS_NOTIFICATION_TEMPLATE_ID, and REACT_APP_EMAILJS_PUBLIC_KEY in your .env file. ' +
    'See .env.example for reference.'
  );
}

/**
 * Initialize EmailJS with public key
 */
export const initNotificationEmailJS = () => {
  if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
};

/**
 * Send notification email via EmailJS
 * @param {string} userEmail - Recipient email address
 * @param {object} notificationData - Notification data object
 * @param {string} notificationData.type - Notification type: 'group_post', 'follow_post', 'group_request', 'quiz_complete'
 * @param {string} notificationData.memberName - Name of the member/user (optional)
 * @param {string} notificationData.groupName - Name of the group (optional)
 * @param {string} notificationData.postTitle - Post title (optional)
 * @param {string} notificationData.postContent - Post content preview (optional)
 * @param {number} notificationData.quizPercentage - Quiz completion percentage (optional)
 * @param {string} notificationData.actionLink - Link to view details (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendNotificationEmail = async (userEmail, notificationData) => {
  try {
    if (!userEmail || !userEmail.trim()) {
      console.error('Notification email error: Email address is required');
      return { success: false, error: 'Email address is required' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      console.error('Notification email error: Invalid email format');
      return { success: false, error: 'Invalid email format' };
    }

    // Prepare notification content based on type
    let notificationTitle = 'New Notification';
    let notificationGreeting = 'You have a new notification from Qconnect.';
    let cardTitle = '';
    let cardContent = '';
    let notificationIcon = '🔔';

    const {
      type,
      memberName = '',
      groupName = '',
      postTitle = '',
      postContent = '',
      quizPercentage = null,
      actionLink = ''
    } = notificationData;

    // Determine notification content based on type
    switch (type) {
      case 'group_post':
        notificationTitle = 'New Post in Group';
        notificationGreeting = `There's a new post in one of your groups!`;
        cardTitle = 'New Group Post';
        cardContent = memberName 
          ? `${memberName} posted in ${groupName || 'a group'}.`
          : `A new post was shared in ${groupName || 'a group'}.`;
        notificationIcon = '📝';
        break;

      case 'follow_post':
        notificationTitle = 'New Post from Following';
        notificationGreeting = `Someone you follow just posted something new!`;
        cardTitle = 'New Post';
        cardContent = memberName 
          ? `${memberName} shared a new post.`
          : 'A new post is available.';
        notificationIcon = '👥';
        break;

      case 'group_request':
        notificationTitle = 'New Group Join Request';
        notificationGreeting = `Someone wants to join your group!`;
        cardTitle = 'Join Request';
        cardContent = memberName 
          ? `${memberName} wants to join ${groupName || 'your group'}.`
          : 'A new join request is pending approval.';
        notificationIcon = '✋';
        break;

      case 'quiz_complete':
        notificationTitle = 'Quiz Completed';
        notificationGreeting = `Someone completed your quiz!`;
        cardTitle = 'Quiz Completion';
        cardContent = memberName 
          ? `${memberName} completed your quiz${quizPercentage !== null ? ` with a score of ${quizPercentage}%` : ''}.`
          : 'Your quiz was completed.';
        notificationIcon = '✅';
        break;

      default:
        notificationTitle = 'New Notification';
        notificationGreeting = 'You have a new notification.';
        cardTitle = 'Notification';
        cardContent = notificationData.message || 'You have a new notification.';
    }

    // Truncate post content if too long
    let truncatedPostContent = postContent;
    if (postContent && postContent.length > 150) {
      truncatedPostContent = postContent.substring(0, 147) + '...';
    }

    // Truncate post title if too long
    let truncatedPostTitle = postTitle;
    if (postTitle && postTitle.length > 60) {
      truncatedPostTitle = postTitle.substring(0, 57) + '...';
    }

    // Build HTML snippets for conditional sections
    let memberInfoHtml = '';
    if (memberName) {
      memberInfoHtml = `<div class="user-info"><p class="user-name">👤 ${memberName}</p></div>`;
    }
    
    let groupInfoHtml = '';
    if (groupName) {
      groupInfoHtml = `<div class="group-info"><p class="group-name">👥 ${groupName}</p></div>`;
    }
    
    let postPreviewHtml = '';
    if (truncatedPostTitle) {
      postPreviewHtml = `<div class="post-preview"><h4 class="post-title">${truncatedPostTitle}</h4>`;
      if (truncatedPostContent) {
        postPreviewHtml += `<p class="post-content">${truncatedPostContent}</p>`;
      }
      postPreviewHtml += `</div>`;
    }
    
    let quizScoreHtml = '';
    if (quizPercentage !== null) {
      const percentage = Math.round(quizPercentage);
      quizScoreHtml = `<div class="quiz-score"><p class="quiz-score-value">${percentage}%</p><p class="quiz-score-label">Quiz Completed</p></div>`;
    }
    
    let actionButtonHtml = '';
    const finalActionLink = actionLink || `${WEBSITE_LINK}/notification`;
    if (finalActionLink) {
      actionButtonHtml = `<div style="text-align: center;"><a href="${finalActionLink}" class="action-button">View Details</a></div>`;
    }

    // Prepare template parameters for EmailJS (all as strings, no conditionals)
    const templateParams = {
      to_email: userEmail,
      email: userEmail, // Alternative parameter name for compatibility
      notification_title: notificationTitle,
      notification_greeting: notificationGreeting,
      notification_icon: notificationIcon,
      card_title: cardTitle,
      card_content: cardContent,
      member_info_html: memberInfoHtml,
      group_info_html: groupInfoHtml,
      post_preview_html: postPreviewHtml,
      quiz_score_html: quizScoreHtml,
      action_button_html: actionButtonHtml,
      website_link: WEBSITE_LINK
    };

    console.log('Sending notification email:', {
      to: userEmail,
      type: type,
      service: EMAILJS_SERVICE_ID,
      template: EMAILJS_TEMPLATE_ID
    });

    // Initialize EmailJS if not already initialized
    if (typeof emailjs !== 'undefined' && !emailjs.init) {
      initNotificationEmailJS();
    }

    // Send email via EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      console.log('✓ Notification email sent successfully:', response.text);
      return { success: true };
    } else {
      console.error('✗ Notification email failed:', response);
      return { success: false, error: 'Failed to send email' };
    }
  } catch (error) {
    console.error('✗ Notification email error:', error);
    
    // Provide helpful error messages
    if (error.text && error.text.includes('recipients address is empty')) {
      return { 
        success: false, 
        error: 'The recipients address is empty. Please ensure your EmailJS service is configured to use {{to_email}} or {{email}} as the recipient.' 
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to send notification email' 
    };
  }
};

/**
 * Format post content for email preview
 * @param {string} content - Post content
 * @param {number} maxLength - Maximum length (default: 150)
 * @returns {string} Formatted content
 */
export const formatPostContentForEmail = (content, maxLength = 150) => {
  if (!content) return '';
  
  // Remove HTML tags if any
  const plainText = content.replace(/<[^>]*>/g, '').trim();
  
  // Truncate if too long
  if (plainText.length > maxLength) {
    return plainText.substring(0, maxLength - 3) + '...';
  }
  
  return plainText;
};

