export interface TechnicianCredentials {
  email: string;
  password: string;
}

export interface AuthService {
  authenticate(email: string, password: string): boolean;
}

export function createAuthService(credentials: TechnicianCredentials): AuthService {
  return {
    authenticate(email: string, password: string): boolean {
      return timingSafeEqual(email, credentials.email) && timingSafeEqual(password, credentials.password);
    },
  };
}
function timingSafeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < max; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}
