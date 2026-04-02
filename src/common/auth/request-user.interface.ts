import { UserRole } from './role.enum';

export interface RequestUser {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
}
