import { Permission } from './permission.enum';
import { UserRole } from './role.enum';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_SMTP,
    Permission.VIEW_TENANT_LOGS,
    Permission.VIEW_ALL_TENANT_JOBS,
    Permission.QUEUE_EMAIL,
    Permission.VIEW_OWN_JOBS,
    Permission.VIEW_OWN_PROFILE,
  ],
  [UserRole.USER]: [
    Permission.QUEUE_EMAIL,
    Permission.VIEW_OWN_JOBS,
    Permission.VIEW_OWN_PROFILE,
  ],
};
