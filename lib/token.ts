import "server-only"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"

/**
 * Generate a cryptographically secure activation token
 * Returns both the plain token (to send in email) and its hash (to store in DB)
 */
export async function generateActivationToken(): Promise<{
  token: string
  tokenHash: string
}> {
  // Generate 32 bytes of random data and encode as base64url
  const token = randomBytes(32).toString("base64url")

  // Hash the token using bcrypt (10 rounds)
  const tokenHash = await bcrypt.hash(token, 10)

  return { token, tokenHash }
}

/**
 * Verify if a plain token matches a stored hash
 */
export async function verifyActivationToken(token: string, tokenHash: string): Promise<boolean> {
  return bcrypt.compare(token, tokenHash)
}

/**
 * Get first 8 characters of token hash for logging (never log full token or hash)
 */
export function getTokenHashPrefix(tokenHash: string): string {
  return tokenHash.substring(0, 8)
}
