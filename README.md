# Password Reset App with Email OTP

A complete password reset application with email OTP verification, built with React frontend and Node.js backend.

## Features

🔐 **Secure Password Reset Flow**
- Email-based OTP verification
- Token-based reset system
- Password strength validation
- Rate limiting protection

📧 **Email Integration**
- Professional HTML email templates
- SMTP support (Gmail, etc.)
- OTP delivery and resending
- Security tips in emails

🎨 **Modern UI/UX**
- Beautiful, responsive design
- Real-time password strength indicator
- Loading states and error handling
- Professional email templates

🛡️ **Security Features**
- Rate limiting
- OTP expiration (10 minutes)
- Secure token generation
- Attempt limiting (3 tries)
- CORS protection

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Configure Email Service

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your email credentials:
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=5000
NODE_ENV=development

# OTP Configuration
OTP_EXPIRY_MINUTES=10
```

### 3. Gmail Setup (Recommended)

For Gmail, you'll need an **App Password**:

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account Settings → Security → App passwords
3. Generate an app password for "Mail"
4. Use this app password in the `EMAIL_PASS` field

### 4. Run the Application

```bash
# Development mode (both frontend and backend)
npm run dev

# Or run separately:
# Backend only
npm run server

# Frontend only (in another terminal)
npm run client
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## How It Works

### Password Reset Flow

1. **Forgot Password**: User enters email address
2. **OTP Generation**: System generates 6-digit code and sends via email
3. **Email Delivery**: Professional HTML email with OTP and security tips
4. **OTP Verification**: User enters code (3 attempts, 10-minute expiry)
5. **Reset Token**: Valid OTP generates secure reset token
6. **New Password**: User sets new password with strength validation

### Email Template Features

- **Professional Design**: Modern, responsive HTML email
- **Security Branding**: Trust indicators and security tips
- **Clear OTP Display**: Large, easy-to-read code format
- **Expiration Warning**: Clear timing information
- **Security Guidelines**: Best practices for users

### API Endpoints

```
POST /api/auth/forgot-password
POST /api/auth/verify-otp
POST /api/auth/reset-password
POST /api/auth/change-password
POST /api/auth/resend-otp
GET  /api/health
```

## Email Template Preview

The OTP email includes:
- Professional header with security icon
- Clear OTP code display
- Expiration timer (10 minutes)
- Security tips and warnings
- Responsive design for all devices

## Security Features

### Rate Limiting
- 5 requests per 15 minutes per IP
- Applied to all authentication endpoints

### OTP Security
- 6-digit random codes
- 10-minute expiration
- Maximum 3 attempts
- Auto-cleanup of expired codes

### Token Security
- Cryptographically secure reset tokens
- 30-minute expiration
- Single-use tokens
- Automatic cleanup

## Customization

### Email Templates
Edit `services/emailService.js` to customize:
- Email styling
- Company branding
- Security messages
- Template layout

### OTP Configuration
Modify `services/otpService.js` for:
- OTP length (default: 6 digits)
- Expiration time
- Maximum attempts
- Cleanup intervals

### UI Styling
Update `client/src/App.js` for:
- Color schemes
- Component styling
- Layout changes
- Responsive design

## Production Deployment

### Environment Setup
```env
NODE_ENV=production
EMAIL_SECURE=true  # For production SMTP
# Remove debug options
```

### Security Considerations
1. Use environment variables for all secrets
2. Enable HTTPS
3. Configure proper CORS origins
4. Use Redis for OTP storage (replace in-memory)
5. Add database integration
6. Implement proper logging
7. Add monitoring and alerts

### Database Integration
For production, replace in-memory storage:

```javascript
// Replace Map storage with Redis or database
const redis = require('redis');
const client = redis.createClient();

// Store OTP in Redis with TTL
await client.setex(`otp:${email}`, 600, otp);
```

## Troubleshooting

### Email Not Sending
1. Check email credentials in `.env`
2. Verify app password for Gmail
3. Check spam folder
4. Ensure SMTP settings are correct

### Common Issues
- **CORS errors**: Check API_BASE_URL in frontend
- **Port conflicts**: Change PORT in `.env`
- **Email blocked**: Use app passwords, not regular passwords

## Development

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   └── index.js       # React entry point
│   └── package.json
├── services/
│   ├── emailService.js    # Email sending logic
│   └── otpService.js      # OTP generation/validation
├── server.js              # Express server
├── package.json           # Backend dependencies
└── .env                   # Environment configuration
```

### Adding Features
- **SMS OTP**: Add Twilio integration
- **Social Login**: Integrate OAuth providers
- **User Management**: Add user database
- **Audit Logs**: Track password reset attempts
- **Multi-language**: Add i18n support

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review email configuration
3. Verify all dependencies are installed
4. Check server logs for detailed errors

---

Made with ❤️ for secure password management