import { UserRole } from '../../common/auth/role.enum';

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    tenantId: string;
    tenantName: string;
    fullName: string;
    email: string;
    role: UserRole;
  };
}

export interface SignupResponse {
  message: string;
  requiresVerification: true;
  previewOtp?: string;
}

export interface AccessTokenPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: UserRole;
}
