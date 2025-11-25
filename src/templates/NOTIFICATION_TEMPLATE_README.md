# Notification Email Template

This is a reusable HTML/CSS email template for Qconnect notifications that can be used with EmailJS.

## Template Features

The template supports multiple notification types:

1. **Group Post Notifications** (`group_post`)
   - Shows: Group name, member name, post title and preview
   - Icon: 📝

2. **Following Member Post Notifications** (`follow_post`)
   - Shows: Member name, post title and preview
   - Icon: 👥

3. **Group Join Request Notifications** (`group_request`)
   - Shows: Member name, group name
   - Icon: ✋

4. **Quiz Completion Notifications** (`quiz_complete`)
   - Shows: Member name, quiz completion percentage
   - Icon: ✅

## EmailJS Setup

### 1. Create EmailJS Template

1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Navigate to **Email Templates**
3. Click **Create New Template**
4. Copy the HTML from `notificationEmailTemplate.html`
5. Paste into the EmailJS template editor

### 2. Configure Template Variables

The template uses the following variables (must match EmailJS parameter names):

#### Required Variables:
- `{{to_email}}` or `{{email}}` - Recipient email address
- `{{notification_title}}` - Main notification title
- `{{notification_greeting}}` - Greeting message
- `{{notification_icon}}` - Emoji icon for notification type
- `{{card_title}}` - Card title
- `{{card_content}}` - Card content/message

#### Optional Variables (displayed conditionally):
- `{{member_name}}` - Name of the member/user
- `{{group_name}}` - Name of the group
- `{{post_title}}` - Post title (truncated to 60 chars)
- `{{post_content}}` - Post content preview (truncated to 150 chars)
- `{{quiz_percentage}}` - Quiz completion percentage
- `{{action_link}}` - Link to view details
- `{{website_link}}` - Qconnect website URL

### 3. Configure EmailJS Service

1. Go to **Email Services** in EmailJS Dashboard
2. Select your service (or create a new one)
3. Make sure the **To Email** field is set to use:
   - `{{to_email}}` OR `{{email}}` (depending on your service configuration)
4. Save the service configuration

### 4. Environment Variables

Add to your `.env` file:

```env
REACT_APP_EMAILJS_SERVICE_ID=service_xxxxxxx
REACT_APP_EMAILJS_NOTIFICATION_TEMPLATE_ID=template_xxxxxxx
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key
REACT_APP_WEBSITE_LINK=https://yourwebsite.com
```

### 5. Template ID

After creating the template in EmailJS, copy the Template ID and add it to your environment variables.

## Usage

Use the `sendNotificationEmail` function from `src/utils/notificationEmailService.js`:

```javascript
import { sendNotificationEmail } from '../utils/notificationEmailService';

// Example: Group post notification
await sendNotificationEmail(userEmail, {
  type: 'group_post',
  memberName: 'John Doe',
  groupName: 'Tech Enthusiasts',
  postTitle: 'New JavaScript Framework Released',
  postContent: 'Check out the latest features...',
  actionLink: 'https://qconnect.com/home/post123'
});

// Example: Quiz completion notification
await sendNotificationEmail(userEmail, {
  type: 'quiz_complete',
  memberName: 'Jane Smith',
  quizPercentage: 85
});

// Example: Group join request
await sendNotificationEmail(adminEmail, {
  type: 'group_request',
  memberName: 'Bob Johnson',
  groupName: 'Designers Hub',
  actionLink: 'https://qconnect.com/group/123'
});
```

## Template Structure

- **Header Section**: Qconnect branding with logo and tagline
- **Notification Icon**: Dynamic icon based on notification type
- **Content Section**: 
  - Notification title and greeting
  - Notification card with details
  - User/Group info (when applicable)
  - Post preview (for post notifications)
  - Quiz score (for quiz notifications)
  - Action button with link
- **Footer Section**: Company info and links

## Responsive Design

The template is fully responsive and optimized for:
- Desktop email clients
- Mobile devices
- Various email clients (Gmail, Outlook, Apple Mail, etc.)

## Customization

You can customize:
- Colors: Update the CSS color values (Qconnect theme: #F99806, #EE930B, #463804)
- Fonts: Modify font-family in CSS
- Layout: Adjust padding, margins, and structure
- Icons: Change emoji icons for different notification types

## Notes

- The template uses inline CSS for email client compatibility
- All images should be hosted externally (CDN or your server)
- Test the template in multiple email clients before deploying
- EmailJS has a rate limit of 1 request per second

