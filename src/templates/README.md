# Email Templates for Qconnect

This directory contains HTML email templates for Qconnect's EmailJS integration.

## Templates

1. **Email Verification Template** - For account verification OTP emails
2. **Notification Template** - For all types of notification emails (group posts, quiz completions, join requests, etc.)

## Email Verification Template

### File: `emailVerificationTemplate.html`

A modern, attractive email template for account verification OTP emails.

### Features:
- ✅ Modern, responsive design
- ✅ Qconnect branding with theme colors
- ✅ Prominent OTP code display
- ✅ Security reminders
- ✅ Clear instructions
- ✅ Mobile-friendly layout
- ✅ Professional footer

### Template Variables:

The template uses the following variables that should be replaced when sending:
- `{{passcode}}` - The 6-digit OTP code
- `{{time}}` - Expiry time (e.g., "Nov 23, 2024 8:45 PM")
- `{{to_name}}` - Recipient name (optional, can be removed if not used)
- `{{company_name}}` - Company name (defaults to "Qconnect")
- `{{website_link}}` - Website URL for links

### EmailJS Setup Instructions:

1. **Sign up for EmailJS** (https://www.emailjs.com/)

2. **Create an Email Service**
   - Go to Email Services in EmailJS dashboard
   - Choose your email provider (Gmail, Outlook, etc.)
   - Follow the setup instructions

3. **Create an Email Template**
   - Go to Email Templates in EmailJS dashboard
   - Click "Create New Template"
   - Copy the content from `emailVerificationTemplate.html`
   - Paste it into the EmailJS template editor
   - Set up the template variables:
     - `{{passcode}}` → OTP code
     - `{{time}}` → Expiry time
     - Add any other variables as needed

4. **Get Your Credentials**
   - Service ID: Found in Email Services section
   - Template ID: Found in Email Templates section
   - Public Key: Found in Account → API Keys

5. **Add to Environment Variables**
   ```env
   REACT_APP_EMAILJS_SERVICE_ID=your_service_id
   REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id
   REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key
   REACT_APP_WEBSITE_URL=https://yourwebsite.com
   ```

6. **Install EmailJS Package**
   ```bash
   npm install @emailjs/browser
   ```

### Usage Example:

```javascript
import { sendVerificationEmail, generateOTP, generateExpiryTime } from '../utils/emailService';

// Generate OTP and expiry time
const otp = generateOTP();
const expiryTime = generateExpiryTime();

// Send verification email
const result = await sendVerificationEmail(
  'user@example.com',
  otp,
  expiryTime,
  'John Doe' // optional name
);

if (result.success) {
  console.log('Verification email sent!');
  // Store OTP in database/session for verification
} else {
  console.error('Failed to send email:', result.error);
}
```

### Customization:

You can customize the template by:
- Changing colors to match your brand
- Modifying the logo/branding section
- Adding/removing sections
- Adjusting styling for different email clients
- Adding images (use absolute URLs or embedded base64)

### Email Client Compatibility:

This template is tested and compatible with:
- ✅ Gmail
- ✅ Outlook
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ Most modern email clients

### Notes:

- Use inline CSS for maximum compatibility
- Test emails before sending to production
- Keep images small or use external URLs
- Avoid complex CSS features (flexbox, grid) - use tables for layout
- Test on multiple email clients

## Notification Email Template

### File: `notificationEmailTemplate.html`

A reusable, responsive email template for all notification types (group posts, quiz completions, join requests, follow posts).

### Features:
- ✅ Reusable template for multiple notification types
- ✅ Modern, responsive design
- ✅ Qconnect branding with theme colors
- ✅ Dynamic content based on notification type
- ✅ Support for post previews, quiz scores, user info
- ✅ Action buttons with redirect links
- ✅ Mobile-friendly layout

### Notification Types Supported:
1. **Group Post** (`group_post`) - New posts in groups you're a member of
2. **Follow Post** (`follow_post`) - Posts from users you follow
3. **Group Request** (`group_request`) - Join requests for groups you admin
4. **Quiz Complete** (`quiz_complete`) - When someone completes your quiz

### Documentation:
See `NOTIFICATION_TEMPLATE_README.md` for detailed setup instructions and usage examples.

### Usage:
```javascript
import { sendNotificationEmail } from '../utils/notificationEmailService';

await sendNotificationEmail(userEmail, {
  type: 'group_post',
  memberName: 'John Doe',
  groupName: 'Tech Group',
  postTitle: 'New Post Title',
  actionLink: 'https://qconnect.com/home/post123'
});
```

For complete documentation, see `NOTIFICATION_TEMPLATE_README.md`.

