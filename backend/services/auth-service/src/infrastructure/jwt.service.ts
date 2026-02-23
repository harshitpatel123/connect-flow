import jwt from 'jsonwebtoken';
import { AuthPayload } from '../domain/types.js';

export class JwtService {
  private readonly secret: string;
  private readonly expiresIn = '7d';

  constructor() {
    this.secret = process.env.JWT_SECRET || 'default_secret';
    if (this.secret === 'default_secret') {
      console.warn('⚠️  Using default JWT secret. Set JWT_SECRET in production!');
    }
  }

  generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verifyToken(token: string): AuthPayload {
    return jwt.verify(token, this.secret) as AuthPayload;
  }
}
