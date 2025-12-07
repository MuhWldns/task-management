import { prisma } from "../../db/prisma";
import { generateVerificationToken, hashVerificationToken, generateTokenExpiry, isTokenExpired } from "../utils/verificationToken";
import { sendVerificationEmail } from "../utils/emailService";

/**
 * Send verification email to user
 */
export const sendVerificationEmailService = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.isVerified) {
      return { success: false, message: "Email is already verified" };
    }

    // Check if there's an existing unexpired token
    if (user.verificationToken && user.verificationTokenExpires) {
      if (!isTokenExpired(user.verificationTokenExpires)) {
        return { success: false, message: "Verification email already sent. Please check your email or wait for the previous link to expire." };
      }
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const hashedToken = hashVerificationToken(verificationToken);
    const tokenExpiry = generateTokenExpiry();

    // Update user with verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: hashedToken,
        verificationTokenExpires: tokenExpiry,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken);

    if (!emailSent) {
      return { success: false, message: "Failed to send verification email. Please try again." };
    }

    return { success: true, message: "Verification email sent successfully. Please check your inbox." };
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return { success: false, message: "Internal server error" };
  }
};

/**
 * Verify email using token from query params
 */
export const verifyEmailWithToken = async (token: string): Promise<{ success: boolean; message: string; user?: any }> => {
  try {
    if (!token) {
      return { success: false, message: "Verification token is required" };
    }

    // Hash the token to compare with database
    const hashedToken = hashVerificationToken(token);

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: hashedToken,
        deletedAt: null,
      },
    });

    if (!user) {
      return { success: false, message: "Invalid verification token" };
    }

    // Check if token is expired
    if (!user.verificationTokenExpires || isTokenExpired(user.verificationTokenExpires)) {
      return { success: false, message: "Verification token has expired. Please request a new one." };
    }

    // Check if already verified
    if (user.isVerified) {
      return { success: false, message: "Email is already verified" };
    }

    // Update user as verified and clear token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    const { passwordHash, verificationToken, verificationTokenExpires, ...userWithoutSensitiveData } = updatedUser;

    return { 
      success: true, 
      message: "Email verified successfully! You can now login.", 
      user: userWithoutSensitiveData 
    };
  } catch (error: any) {
    console.error("Error verifying email:", error);
    return { success: false, message: "Internal server error" };
  }
};