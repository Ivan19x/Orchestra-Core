import { randomBytes } from 'crypto';

export function generateLicenseKey() {
  const hex = randomBytes(12).toString('hex').toUpperCase();
  return `OC-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 24)}`;
}
// Example: OC-A1B2C3D4-E5F6-G7H8-I9J0-K1L2
