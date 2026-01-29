import jwt from "jsonwebtoken";
import { AuthPayload } from "../domain/auth.types";

export class JwtService {
  generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "15d" // Token valid for 15 days, change it to 1h for 1 hour
    });
  }

  verifyToken(token: string): AuthPayload {
    return jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
  }
}
