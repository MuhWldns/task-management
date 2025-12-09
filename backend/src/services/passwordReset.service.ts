import { prisma } from "../../db/prisma";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  generatePasswordResetExpiry,
  isPasswordResetTokenExpired,
  verifyPasswordResetToken
} from "../utils/passwordResetToken";
import { sendPasswordResetEmail } from "../utils/emailService";
import { hashPassword } from "./auth.service";

/**
 * Request password reset - generate token and send email
 */
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Find user by email (active users only)
    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { success: true, message: "If an account with this email exists, a password reset link has been sent." };
    }

    // Check if there's an existing unexpired token
    if (user.passwordResetToken && user.passwordResetExpires) {
      if (!isPasswordResetTokenExpired(user.passwordResetExpires)) {
        return { success: false, message: "Password reset email already sent. Please check your email or wait for the previous link to expire." };
      }
    }

    // Generate new reset token
    const resetToken = generatePasswordResetToken();
    const hashedToken = hashPasswordResetToken(resetToken);
    const tokenExpiry = generatePasswordResetExpiry();

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: tokenExpiry,
      },
    });

    // Send reset email
    const emailSent = await sendPasswordResetEmail(user.email, resetToken);

    if (!emailSent) {
      return { success: false, message: "Failed to send password reset email. Please try again." };
    }

    return { success: true, message: "Password reset link sent to your email." };
  } catch (error) {
    console.error("Request password reset error:", error);
    return { success: false, message: "Internal server error" };
  }
};

/**
 * Validate password reset token
 */
export const validatePasswordResetToken = async (token: string): Promise<{ valid: boolean; message: string }> => {
  try {
    if (!token) {
      return { valid: false, message: "Reset token is required" };
    }

    // Hash the token to compare with database
    const hashedToken = hashPasswordResetToken(token);

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        deletedAt: null,
      },
    });

    if (!user) {
      return { valid: false, message: "Invalid or expired reset token" };
    }

    // Check if token has expired
    if (!user.passwordResetExpires || isPasswordResetTokenExpired(user.passwordResetExpires)) {
      return { valid: false, message: "Reset token has expired" };
    }

    return { valid: true, message: "Token is valid" };
  } catch (error) {
    console.error("Validate reset token error:", error);
    return { valid: false, message: "Internal server error" };
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (!token || !newPassword) {
      return { success: false, message: "Token and new password are required" };
    }

    if (newPassword.length < 8) {
      return { success: false, message: "Password must be at least 8 characters long" };
    }

    // Hash the token to compare with database
    const hashedToken = hashPasswordResetToken(token);

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        deletedAt: null,
      },
    });

    if (!user) {
      return { success: false, message: "Invalid or expired reset token" };
    }

    // Check if token has expired
    if (!user.passwordResetExpires || isPasswordResetTokenExpired(user.passwordResetExpires)) {
      return { success: false, message: "Reset token has expired" };
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, message: "Internal server error" };
  }
};