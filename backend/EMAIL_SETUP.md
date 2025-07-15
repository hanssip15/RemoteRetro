# Email Configuration Setup

## Overview
This application can send action items to all participants via email when a retrospective is completed.

## Setup Instructions

### 1. Environment Variables
Add the following variables to your `.env` file:

```env
# Email Configuration (for Gmail)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
```

### 2. Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to Google Account > Security
   - Under "2-Step Verification", click "App passwords"
   - Generate a new app password for "Mail"
   - Use this password in your `EMAIL_PASSWORD` environment variable

3. **Alternative: Use Less Secure Apps (Not Recommended)**
   - Only works if you don't have 2FA enabled
   - Go to Google Account > Security
   - Enable "Less secure app access"

### 3. Other Email Services

You can modify the email service configuration in `src/services/email.service.ts`:

```typescript
this.transporter = nodemailer.createTransporter({
  service: 'outlook', // or 'yahoo', 'hotmail', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

### 4. Production Recommendations

For production, consider using dedicated email services:

- **SendGrid**: `npm install @sendgrid/mail`
- **AWS SES**: `npm install @aws-sdk/client-ses`
- **Mailgun**: `npm install mailgun.js`

### 5. Testing Email Configuration

You can test your email configuration by calling:

```bash
curl -X POST http://localhost:3001/email/test-connection
```

### 6. Security Notes

- Never commit your email credentials to version control
- Use environment variables for all sensitive data
- Consider using OAuth2 for production email services
- Implement rate limiting for email sending

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check your email and password
   - Ensure 2FA is enabled and app password is used (for Gmail)
   - Verify "Less secure app access" is enabled (if not using 2FA)

2. **Connection Timeout**
   - Check your internet connection
   - Verify firewall settings
   - Try different email service

3. **Rate Limiting**
   - Gmail has daily sending limits
   - Consider using dedicated email services for high volume

### Debug Mode

To enable detailed logging, add this to your email service:

```typescript
this.transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: true, // Enable debug output
  logger: true, // Log to console
});
``` 