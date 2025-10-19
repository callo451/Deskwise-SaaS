import crypto from 'crypto'

/**
 * Email Encryption Utility
 *
 * Encrypts/decrypts email credentials (AWS SES or SMTP) before storing in database.
 * Uses AES-256-GCM encryption with a secret key from environment variables.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Derives encryption key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512')
}

/**
 * Gets the encryption secret from environment variable
 */
function getEncryptionSecret(): string {
  const secret = process.env.EMAIL_ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET

  if (!secret) {
    throw new Error('EMAIL_ENCRYPTION_SECRET or NEXTAUTH_SECRET must be set in environment variables')
  }

  if (secret.length < 32) {
    throw new Error('EMAIL_ENCRYPTION_SECRET must be at least 32 characters long')
  }

  return secret
}

/**
 * Encrypts a string value (e.g., AWS credentials)
 *
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: salt:iv:authTag:encryptedData (hex encoded)
 */
export function encrypt(text: string): string {
  try {
    const secret = getEncryptionSecret()

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Derive key from secret
    const key = deriveKey(secret, salt)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get auth tag
    const authTag = cipher.getAuthTag()

    // Return format: salt:iv:authTag:encryptedData
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypts an encrypted string value
 *
 * @param encryptedText - Encrypted string in format: salt:iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    const secret = getEncryptionSecret()

    // Parse the encrypted data
    const parts = encryptedText.split(':')

    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format')
    }

    const [saltHex, ivHex, authTagHex, encryptedHex] = parts

    const salt = Buffer.from(saltHex, 'hex')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')

    // Derive key from secret
    const key = deriveKey(secret, salt)

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt the data
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Tests if encryption/decryption is working correctly
 */
export function testEncryption(): boolean {
  try {
    const testString = 'test-encryption-' + Date.now()
    const encrypted = encrypt(testString)
    const decrypted = decrypt(encrypted)

    return testString === decrypted
  } catch (error) {
    console.error('Encryption test failed:', error)
    return false
  }
}

/**
 * Encrypts email credentials object (supports both AWS and SMTP)
 */
export function encryptCredentials(credentials: {
  awsAccessKeyId?: string
  awsSecretAccessKey?: string
  smtpPassword?: string
}): {
  awsAccessKeyId?: string
  awsSecretAccessKey?: string
  smtpPassword?: string
} {
  const encrypted: any = {}

  if (credentials.awsAccessKeyId) {
    encrypted.awsAccessKeyId = encrypt(credentials.awsAccessKeyId)
  }

  if (credentials.awsSecretAccessKey) {
    encrypted.awsSecretAccessKey = encrypt(credentials.awsSecretAccessKey)
  }

  if (credentials.smtpPassword) {
    encrypted.smtpPassword = encrypt(credentials.smtpPassword)
  }

  return encrypted
}

/**
 * Decrypts email credentials object (supports both AWS and SMTP)
 */
export function decryptCredentials(encryptedCredentials: {
  awsAccessKeyId?: string
  awsSecretAccessKey?: string
  smtpPassword?: string
}): {
  awsAccessKeyId?: string
  awsSecretAccessKey?: string
  smtpPassword?: string
} {
  const decrypted: any = {}

  if (encryptedCredentials.awsAccessKeyId) {
    decrypted.awsAccessKeyId = decrypt(encryptedCredentials.awsAccessKeyId)
  }

  if (encryptedCredentials.awsSecretAccessKey) {
    decrypted.awsSecretAccessKey = decrypt(encryptedCredentials.awsSecretAccessKey)
  }

  if (encryptedCredentials.smtpPassword) {
    decrypted.smtpPassword = decrypt(encryptedCredentials.smtpPassword)
  }

  return decrypted
}
