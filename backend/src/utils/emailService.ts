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
