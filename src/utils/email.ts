import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetEmail(to: string, resetToken: string) {
  const resetUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  // Dev mode: log the reset link to console if SMTP is not configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('\n========== PASSWORD RESET ==========');
    console.log(`Email: ${to}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('====================================\n');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"MindCare" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Reset Your Password — MindCare',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>You requested a password reset. Click the link below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #0D9488; color: white; text-decoration: none; border-radius: 8px;">
            Reset Password
          </a>
          <p style="margin-top: 16px; color: #666;">This link expires in 1 hour.</p>
          <p style="color: #999;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send reset email:', error);
    // Don't throw — we don't want to reveal whether the email exists
  }
}
