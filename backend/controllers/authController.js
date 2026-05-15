const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Build a clean, professional HTML email body for the OTP
const buildOtpEmailHtml = (otp, userName) => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
      <div style="margin-bottom: 30px;">
        <h1 style="color: #047857; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">SavePlate</h1>
      </div>
      
      <p style="color: #111827; font-size: 16px; margin-bottom: 16px; font-weight: 500;">Hi ${userName || 'there'},</p>
      
      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
        Your email verification code is below. Enter it in your open browser window to verify your account.
      </p>
      
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 30px;">
        <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 600; letter-spacing: 12px; color: #111827;">${otp}</span>
      </div>
      
      <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin-bottom: 30px;">
        This code will expire in 10 minutes.<br>
        If you didn't request this email, you can safely ignore it.
      </p>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} SavePlate. All rights reserved.
        </p>
      </div>
    </div>
  `;
};

// @desc    Register user & send initial OTP
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'User already exists and is verified.' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (user) {
      // User exists but not verified — update and resend OTP
      user.password = password;
      user.name = name;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        otp,
        otpExpires,
      });
    }

    // Send the verification email
    const plainText = `Your SavePlate verification code is: ${otp}. It will expire in 10 minutes.`;
    await sendEmail({
      email: user.email,
      subject: 'SavePlate - Email Verification Code',
      message: plainText,
      html: buildOtpEmailHtml(otp, user.name),
    });

    console.log(`✅ OTP sent to ${user.email} (OTP: ${otp})`);
    res.status(201).json({ message: 'User registered. Verification email sent.', email: user.email });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Send or Resend OTP
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified. Please login.' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const plainText = `Your new SavePlate verification code is: ${otp}. It will expire in 10 minutes.`;
    await sendEmail({
      email: user.email,
      subject: 'SavePlate - New Verification Code',
      message: plainText,
      html: buildOtpEmailHtml(otp, user.name),
    });

    console.log(`✅ OTP resent to ${user.email} (OTP: ${otp})`);
    res.status(200).json({ message: 'Verification code sent successfully.' });
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ message: 'Email and verification code are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified.' });
    }

    // Check if OTP has expired
    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Check if OTP matches
    if (user.otp !== otpCode) {
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }

    // Success — activate account
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    console.log(`✅ Email verified for ${user.email}`);
    res.status(200).json({ message: 'Email verified successfully! Account activated.' });
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
