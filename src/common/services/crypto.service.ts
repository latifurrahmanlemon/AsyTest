import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';

  encrypt(value: string): string {
    const key = this.getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
  }

  decrypt(payload: string): string {
    const [ivRaw, authTagRaw, encryptedRaw] = payload.split(':');
    const key = this.getKey();
    const decipher = createDecipheriv(this.algorithm, key, Buffer.from(ivRaw, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagRaw, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  hashToken(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private getKey(): Buffer {
    const seed = process.env.APP_ENCRYPTION_KEY ?? 'change-me-in-production';
    return createHash('sha256').update(seed).digest();
  }
}
