const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendOTP(email, otp, purpose = 'password reset') {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Your OTP Code for ${purpose}`,
      html: this.getOTPEmailTemplate(otp, purpose),
      text: `Your OTP code is: ${otp}. This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('OTP email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  getOTPEmailTemplate(otp, purpose = 'password reset') {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your OTP Code</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .logo svg {
                width: 40px;
                height: 40px;
                fill: white;
            }
            h1 {
                color: #2c3e50;
                margin: 0;
                font-size: 24px;
            }
            .otp-code {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-size: 32px;
                font-weight: bold;
                padding: 20px;
                text-align: center;
                border-radius: 8px;
                margin: 20px 0;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
            }
            .security-tips {
                background-color: #f8f9fa;
                padding: 15px;
                border-left: 4px solid #007bff;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <h1>Security Verification</h1>
            </div>
            
            <p>Hello,</p>
            <p>You have requested a ${purpose}. Please use the following One-Time Password (OTP) to verify your identity:</p>
            
            <div class="otp-code">${otp}</div>
            
            <div class="warning">
                <strong>⚠️ Important:</strong> This code will expire in <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>. 
                Please do not share this code with anyone.
            </div>
            
            <div class="security-tips">
                <strong>🔐 Security Tips:</strong>
                <ul>
                    <li>Never share your OTP with anyone</li>
                    <li>We will never ask for your OTP over the phone</li>
                    <li>If you didn't request this, please ignore this email</li>
                    <li>For security, this code can only be used once</li>
                </ul>
            </div>
            
            <p>If you did not request this ${purpose}, please ignore this email. Your account remains secure.</p>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} Password Reset App. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async verifyEmailConfig() {
    try {
      await this.transporter.verify();
      console.log('Email configuration is valid');
      return true;
    } catch (error) {
      console.error('Email configuration error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();