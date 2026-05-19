const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// ── Helper: sign JWT ──
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const isStrongPassword = (password) => (
  typeof password === 'string' &&
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /\d/.test(password)
);

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  householdSize: user.householdSize,
  is2FAEnabled: user.is2FAEnabled,
  listingVisibility: user.listingVisibility,
  showFullName: user.showFullName,
  showLocation: user.showLocation,
  expiryAlerts: user.expiryAlerts,
  donationUpdates: user.donationUpdates,
  mealReminders: user.mealReminders,
  accountAlerts: user.accountAlerts,
});

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
    const { name, email, password, householdSize } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include one uppercase letter and one number.' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'User already exists and is verified.' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (user) {
      user.password = password;
      user.name = name;
      if (householdSize) user.householdSize = householdSize;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        householdSize: householdSize || 1,
        otp,
        otpExpires,
      });
    }

    const plainText = `Your SavePlate verification code is: ${otp}. It will expire in 10 minutes.`;
    await sendEmail({
      email: user.email,
      subject: 'SavePlate - Email Verification Code',
      message: plainText,
      html: buildOtpEmailHtml(otp, user.name),
    });

    console.log(`OTP sent to ${user.email}`);
    res.status(201).json({ message: 'User registered. Verification email sent.', email: user.email });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Login user (2FA-aware)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // ── 2FA check ──
    if (user.is2FAEnabled) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendEmail({
        email: user.email,
        subject: 'SavePlate - Login Verification Code',
        message: `Your SavePlate login code is: ${otp}. It expires in 10 minutes.`,
        html: buildOtpEmailHtml(otp, user.name),
      });

      return res.status(200).json({
        message: '2FA code sent to your email.',
        requires2FA: true,
        email: user.email,
      });
    }

    const token = signToken(user);
    res.status(200).json({
      message: 'Login successful.',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Complete 2FA login
exports.login2FA = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ message: 'Email and OTP code are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Code has expired. Please log in again.' });
    }
    if (user.otp !== otpCode) {
      return res.status(400).json({ message: 'Invalid code. Please try again.' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signToken(user);
    res.status(200).json({
      message: 'Login successful.',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('2FA login error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(publicUser(user));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      householdSize,
      is2FAEnabled,
      listingVisibility,
      showFullName,
      showLocation,
      expiryAlerts,
      donationUpdates,
      mealReminders,
      accountAlerts,
    } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (householdSize !== undefined) user.householdSize = householdSize;
    if (is2FAEnabled !== undefined) user.is2FAEnabled = is2FAEnabled;
    if (listingVisibility !== undefined) user.listingVisibility = listingVisibility;
    if (showFullName !== undefined) user.showFullName = showFullName;
    if (showLocation !== undefined) user.showLocation = showLocation;
    if (expiryAlerts !== undefined) user.expiryAlerts = expiryAlerts;
    if (donationUpdates !== undefined) user.donationUpdates = donationUpdates;
    if (mealReminders !== undefined) user.mealReminders = mealReminders;
    if (accountAlerts !== undefined) user.accountAlerts = accountAlerts;
    await user.save();

    res.json({
      message: 'Profile updated.',
      user: publicUser(user),
    });
  } catch (error) {
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
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const plainText = `Your new SavePlate verification code is: ${otp}. It will expire in 10 minutes.`;
    await sendEmail({
      email: user.email,
      subject: 'SavePlate - New Verification Code',
      message: plainText,
      html: buildOtpEmailHtml(otp, user.name),
    });

    console.log(`OTP resent to ${user.email}`);
    res.status(200).json({ message: 'Verification code sent successfully.' });
  } catch (error) {
    console.error('Send OTP error:', error);
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

    if (!user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    if (user.otp !== otpCode) {
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Auto-login after verification — return JWT
    const token = signToken(user);

    console.log(`Email verified for ${user.email}`);
    res.status(200).json({
      message: 'Email verified successfully! Account activated.',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required.' });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters and include one uppercase letter and one number.',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
