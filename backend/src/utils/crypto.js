const crypto = require('crypto');
const env = require('../config/env');

const ALGORITHM = 'aes-256-cbc';

// Derive a 32-byte key from the JWT_SECRET
const getEncryptionKey = () => {
  return crypto.createHash('sha256').update(env.JWT_SECRET).digest();
};

/**
 * Encrypt plain text using AES-256-CBC
 */
const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt cipher text using AES-256-CBC
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length < 2) return null;
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = parts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null;
  }
};

module.exports = {
  encrypt,
  decrypt
};
