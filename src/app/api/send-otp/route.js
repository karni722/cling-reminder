
import { sendOtp } from "../../../../backend/controller/sendOtpControllers";

const OTP_TTL_MIN = 10; 
const RATE_LIMIT_MIN = 1; 

async function sendEmail(to, subject, text, html) {
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

function generateOtp() {
 
  return (Math.floor(100000 + Math.random() * 900000)).toString();
}

export async function POST(req) {
  return await sendOtp(req);
}
