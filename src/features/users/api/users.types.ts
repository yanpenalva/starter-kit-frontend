import type { UserStatus } from "@/shared/types/contract";
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  deactivated_at: string | null;
  roles: string[];
  cpf?: string;
}
export interface UserFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: UserStatus;
  role?: string;
}
export interface UpdateUserPayload {
  name?: string;
  email?: string;
  cpf?: string | null;
}
export interface SetUserStatusPayload {
  status: UserStatus;
}
export interface AssignUserRolesPayload {
  roles: string[];
}
export const userStatusOf = (user: AdminUser): UserStatus => {
  return user.deactivated_at === null ? "active" : "deactivated";
};
