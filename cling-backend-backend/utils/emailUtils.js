import nodemailer from 'nodemailer';

// Constants for OTP configuration
export const OTP_TTL_MIN = 10;
export const RATE_LIMIT_MIN = 1;

/**
 * Sends an email using nodemailer
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content
 */
export async function sendEmail(to, subject, text, html) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    text,
    html
  });
}

/**
 * Generates a 6-digit OTP
 * @returns {string} The generated OTP
 */
export function generateOtp() {
  return (Math.floor(100000 + Math.random() * 900000)).toString();
}