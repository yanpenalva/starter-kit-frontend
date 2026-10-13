import type { MyProfileResource } from "@/lib/api/generated/models";

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  cpf?: string | null;
}

export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerificationNotificationResponse {
  message: string;
}

export interface UpdateMyProfileRequest {
  name: string;
}

export interface UpdateMyProfileResponse {
  data: MyProfileResource;
}

export interface ChangeMyPasswordRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface ChangeMyPasswordResponse {
  message: string;
}
