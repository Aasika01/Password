const crypto = require('crypto');

class OTPService {
  constructor() {
    // In-memory storage for demo purposes
    // In production, use Redis or database
    this.otpStore = new Map();
    this.expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
  }

  generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[crypto.randomInt(0, digits.length)];
    }
    
    return otp;
  }

  storeOTP(email, otp, purpose = 'password_reset') {
    const key = `${email}:${purpose}`;
    const expiryTime = Date.now() + (this.expiryMinutes * 60 * 1000);
    
    this.otpStore.set(key, {
      otp,
      expiryTime,
      attempts: 0,
      maxAttempts: 3,
      created: Date.now()
    });

    // Auto cleanup expired OTPs
    setTimeout(() => {
      this.otpStore.delete(key);
    }, this.expiryMinutes * 60 * 1000);

    console.log(`OTP stored for ${email}: ${otp} (expires in ${this.expiryMinutes} minutes)`);
  }

  verifyOTP(email, providedOTP, purpose = 'password_reset') {
    const key = `${email}:${purpose}`;
    const storedData = this.otpStore.get(key);

    if (!storedData) {
      return {
        valid: false,
        error: 'OTP not found or expired',
        errorCode: 'OTP_NOT_FOUND'
      };
    }

    // Check if OTP has expired
    if (Date.now() > storedData.expiryTime) {
      this.otpStore.delete(key);
      return {
        valid: false,
        error: 'OTP has expired',
        errorCode: 'OTP_EXPIRED'
      };
    }

    // Check max attempts
    if (storedData.attempts >= storedData.maxAttempts) {
      this.otpStore.delete(key);
      return {
        valid: false,
        error: 'Maximum attempts exceeded',
        errorCode: 'MAX_ATTEMPTS_EXCEEDED'
      };
    }

    // Increment attempts
    storedData.attempts++;

    // Verify OTP
    if (storedData.otp === providedOTP) {
      // OTP is valid, remove it from store
      this.otpStore.delete(key);
      return {
        valid: true,
        message: 'OTP verified successfully'
      };
    } else {
      // Update attempts in store
      this.otpStore.set(key, storedData);
      return {
        valid: false,
        error: `Invalid OTP. ${storedData.maxAttempts - storedData.attempts} attempts remaining`,
        errorCode: 'INVALID_OTP',
        attemptsRemaining: storedData.maxAttempts - storedData.attempts
      };
    }
  }

  generateResetToken(email) {
    // Generate a secure reset token
    const token = crypto.randomBytes(32).toString('hex');
    const key = `reset_token:${email}`;
    const expiryTime = Date.now() + (30 * 60 * 1000); // 30 minutes

    this.otpStore.set(key, {
      token,
      expiryTime,
      email,
      used: false
    });

    // Auto cleanup
    setTimeout(() => {
      this.otpStore.delete(key);
    }, 30 * 60 * 1000);

    return token;
  }

  verifyResetToken(token) {
    for (const [key, data] of this.otpStore.entries()) {
      if (key.startsWith('reset_token:') && data.token === token) {
        if (Date.now() > data.expiryTime) {
          this.otpStore.delete(key);
          return {
            valid: false,
            error: 'Reset token has expired',
            errorCode: 'TOKEN_EXPIRED'
          };
        }

        if (data.used) {
          this.otpStore.delete(key);
          return {
            valid: false,
            error: 'Reset token has already been used',
            errorCode: 'TOKEN_USED'
          };
        }

        return {
          valid: true,
          email: data.email,
          token: data.token
        };
      }
    }

    return {
      valid: false,
      error: 'Invalid reset token',
      errorCode: 'INVALID_TOKEN'
    };
  }

  markTokenAsUsed(token) {
    for (const [key, data] of this.otpStore.entries()) {
      if (key.startsWith('reset_token:') && data.token === token) {
        data.used = true;
        this.otpStore.set(key, data);
        break;
      }
    }
  }

  cleanupExpiredOTPs() {
    const now = Date.now();
    for (const [key, data] of this.otpStore.entries()) {
      if (data.expiryTime && now > data.expiryTime) {
        this.otpStore.delete(key);
      }
    }
  }

  // Get OTP info for debugging (remove in production)
  getOTPInfo(email, purpose = 'password_reset') {
    const key = `${email}:${purpose}`;
    const data = this.otpStore.get(key);
    
    if (!data) return null;
    
    return {
      hasOTP: true,
      expiresIn: Math.max(0, data.expiryTime - Date.now()),
      attempts: data.attempts,
      maxAttempts: data.maxAttempts
    };
  }
}

module.exports = new OTPService();