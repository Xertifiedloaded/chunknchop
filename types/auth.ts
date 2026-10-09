export interface TokenPayload {
  id: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}
