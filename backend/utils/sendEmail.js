const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter using Brevo SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT) || 587,
    secure: false, // false for port 587 (STARTTLS)
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certs (dev convenience)
    },
  });

  // Define the email options
  const mailOptions = {
    from: process.env.FROM_EMAIL || '"SavePlate" <noreply@saveplate.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || undefined,
  };

  // Send the email
  const info = await transporter.sendMail(mailOptions);
  console.log('📧 Email sent:', info.messageId);
  return info;
};

module.exports = sendEmail;
