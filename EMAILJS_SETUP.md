# EmailJS Setup Instructions

## Important: EmailJS Service Configuration

The error "The recipients address is empty" means your EmailJS service is not configured to use the email from template parameters.

### Step 1: Configure EmailJS Service

1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/admin)
2. Navigate to **Email Services** → Select your service (`service_otkxmfa`)
3. Click on the service to edit it
4. In the **Service Settings**, find the **To Email** field
5. **IMPORTANT**: Set it to use a template variable:
   - Enter: `{{to_email}}` OR `{{email}}`
   - This tells EmailJS to use the email from template parameters

### Step 2: Verify Template Configuration

1. Go to **Email Templates** → Select template `template_bj3yv9s`
2. Verify the template uses these variables:
   - `{{to_email}}` or `{{email}}` - Recipient email
   - `{{to_name}}` or `{{user_name}}` - User name
   - `{{passcode}}` or `{{otp}}` - OTP code
   - `{{time}}` - Expiry time
   - `{{company_name}}` - Company name

### Step 3: Test the Configuration

After configuring:
1. Restart your React app
2. Try signing up again
3. Check browser console for EmailJS logs
4. Check EmailJS dashboard → Email Logs for delivery status

## Common Issues

### Issue: "The recipients address is empty"
**Solution**: The EmailJS service must have `{{to_email}}` or `{{email}}` in the "To Email" field, not a static email address.

### Issue: Email not sending
**Check**:
- Service ID is correct: `service_otkxmfa`
- Template ID is correct: `template_bj3yv9s`
- Public Key is correct: `DHhO0l-r54h2-P1JF`
- Service is active in EmailJS dashboard
- Email service (Gmail/Outlook) is properly connected

### Issue: Template variables not working
**Solution**: Make sure template variables match exactly:
- Template uses `{{to_email}}` → Service should use `{{to_email}}`
- Case-sensitive: `{{to_email}}` ≠ `{{To_Email}}`

## Quick Fix

If you want to quickly test, you can temporarily set a static email in the EmailJS service "To Email" field to verify the service works, then change it back to `{{to_email}}`.

