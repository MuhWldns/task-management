import crypto from 'crypto';

/**
 * Generate a random password reset token
 */
export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash password reset token using SHA256
 */
export const hashPasswordResetToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate password reset token expiry (10 minutes from now)
 */
export const generatePasswordResetExpiry = (): Date => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

/**
 * Check if password reset token is expired
 */
export const isPasswordResetTokenExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};

/**
 * Verify password reset token against hashed token
 */
export const verifyPasswordResetToken = (token: string, hashedToken: string): boolean => {
  const hashedInput = hashPasswordResetToken(token);
  return hashedInput === hashedToken;
};