import {
  createHash,
  timingSafeEqual as cryptoTimingSafeEqual,
} from "node:crypto";

export interface TechnicianCredentials {
  email: string;
  password: string;
}

export interface AuthService {
  authenticate(email: string, password: string): boolean;
}

export function createAuthService(
  credentials: TechnicianCredentials,
): AuthService {
  return {
    authenticate(email: string, password: string): boolean {
      return (
        timingSafeEqual(email, credentials.email) &&
        timingSafeEqual(password, credentials.password)
      );
    },
  };
}

// Compara via SHA-256 de comprimento fixo.
function timingSafeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return cryptoTimingSafeEqual(ha, hb);
}
