const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const emailService = require('./services/emailService');
const otpService = require('./services/otpService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 'Please wait before making another request'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to password reset endpoints
app.use('/api/auth/forgot-password', limiter);
app.use('/api/auth/verify-otp', limiter);
app.use('/api/auth/reset-password', limiter);

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation helper
const isValidPassword = (password) => {
  // At least 8 characters, with letters and numbers
  return password && password.length >= 8;
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Forgot Password - Send OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Generate OTP
    const otp = otpService.generateOTP();
    
    // Store OTP
    otpService.storeOTP(email, otp, 'password_reset');

    // Send OTP via email
    await emailService.sendOTP(email, otp, 'password reset');

    console.log(`Password reset OTP sent to ${email}: ${otp}`); // For demo purposes

    res.json({
      success: true,
      message: 'OTP sent to your email address',
      email: email,
      // For demo purposes, include OTP in response (remove in production)
      debug: process.env.NODE_ENV === 'development' ? { otp } : undefined
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send reset code. Please try again later.'
    });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Verify OTP
    const verification = otpService.verifyOTP(email, otp, 'password_reset');

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        error: verification.error,
        errorCode: verification.errorCode,
        attemptsRemaining: verification.attemptsRemaining
      });
    }

    // Generate reset token
    const resetToken = otpService.generateResetToken(email);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken: resetToken
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP. Please try again.'
    });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Reset token, new password, and confirmation are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Verify reset token
    const tokenVerification = otpService.verifyResetToken(resetToken);

    if (!tokenVerification.valid) {
      return res.status(400).json({
        success: false,
        error: tokenVerification.error,
        errorCode: tokenVerification.errorCode
      });
    }

    // Mark token as used
    otpService.markTokenAsUsed(resetToken);

    // Here you would typically:
    // 1. Hash the new password
    // 2. Update the user's password in your database
    // 3. Optionally send a confirmation email

    console.log(`Password reset completed for: ${tokenVerification.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully',
      email: tokenVerification.email
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password. Please try again.'
    });
  }
});

// Change Password (for authenticated users)
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password, new password, and confirmation are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'New passwords do not match'
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Here you would typically:
    // 1. Verify the current password
    // 2. Hash the new password
    // 3. Update the user's password in your database
    // 4. Optionally send a confirmation email

    // For demo purposes, we'll simulate success
    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password. Please try again.'
    });
  }
});

// Resend OTP
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Generate new OTP
    const otp = otpService.generateOTP();
    
    // Store new OTP (this will overwrite the previous one)
    otpService.storeOTP(email, otp, 'password_reset');

    // Send OTP via email
    await emailService.sendOTP(email, otp, 'password reset');

    console.log(`New OTP sent to ${email}: ${otp}`); // For demo purposes

    res.json({
      success: true,
      message: 'New OTP sent to your email address',
      debug: process.env.NODE_ENV === 'development' ? { otp } : undefined
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend OTP. Please try again later.'
    });
  }
});

// Debug endpoint (remove in production)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/otp/:email', (req, res) => {
    const { email } = req.params;
    const info = otpService.getOTPInfo(email);
    res.json({ email, otpInfo: info });
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Verify email configuration
  const emailConfigValid = await emailService.verifyEmailConfig();
  if (emailConfigValid) {
    console.log('✅ Email service configured successfully');
  } else {
    console.log('⚠️  Email service configuration issue - check your .env file');
  }

  // Cleanup expired OTPs every 5 minutes
  setInterval(() => {
    otpService.cleanupExpiredOTPs();
  }, 5 * 60 * 1000);
});

module.exports = app;