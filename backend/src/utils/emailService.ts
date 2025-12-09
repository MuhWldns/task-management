import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send verification email with link
 */
export const sendVerificationEmail = async (email: string, verificationToken: string): Promise<boolean> => {
  try {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const { data, error } = await resend.emails.send({
      from: "support <support@muhwldns.me>",
      to: [email],
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Hi there,</p>
          <p>Thank you for registering! Please click the link below to verify your email address:</p>
          <a href="${verificationLink}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Verify Email Address
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationLink}</p>
          <p><strong>Note:</strong> This link will expire in 10 minutes.</p>
          <p>If you didn't request this verification, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">Best regards,<br>Task Management Team</p>
        </div>
      `,
    });

    if (error) {
      console.error("Email send error:", error);
      return false;
    }

    console.log("Verification email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

/**
 * Send welcome email after successful verification
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || "onboarding@resend.dev",
      to: [email],
      subject: "Welcome to Task Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome, ${name}!</h2>
          <p>Your email has been successfully verified.</p>
          <p>You can now start using the Task Management System.</p>
          <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Go to Login
          </a>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">Best regards,<br>Task Management Team</p>
        </div>
      `,
    });

    if (error) {
      console.error("Welcome email send error:", error);
      return false;
    }

    console.log("Welcome email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};

/**
 * Send password reset email with link
 */
export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<boolean> => {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const { data, error } = await resend.emails.send({
      from: "support<support@muhwldns.me>",
      to: [email],
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hi there,</p>
          <p>We received a request to reset your password for your Task Management account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p><strong>Note:</strong> This link will expire in 10 minutes.</p>
          <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Task Management System. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Password reset email error:", error);
      return false;
    }

    console.log("Password reset email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};
