export type Role = 'ADMIN' | 'CLIENTE';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  cpf: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface DecodedAccessToken {
  sub: string;
  userId: string;
  role: Role;
  iat: number;
  exp: number;
}
