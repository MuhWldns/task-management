import crypto from 'crypto';

/**
 * Generate a random verification token
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash verification token using SHA256
 */
export const hashVerificationToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate verification token expiry (10 minutes from now)
 */
export const generateTokenExpiry = (): Date => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

/**
 * Check if verification token is expired
 */
export const isTokenExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};