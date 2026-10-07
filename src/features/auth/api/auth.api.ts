import { transportApi } from "@/lib/http/orval-mutator";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerificationNotificationResponse,
} from "./auth.types";
export const registerUser = (
  payload: RegisterRequest,
): Promise<RegisterResponse> => {
  return transportApi<RegisterResponse>({
    url: "/api/v1/register",
    method: "POST",
    data: payload,
  });
};
export const sendVerificationNotification =
  (): Promise<VerificationNotificationResponse> => {
    return transportApi<VerificationNotificationResponse>({
      url: "/api/v1/email/verification-notification",
      method: "POST",
    });
  };
export const requestPasswordReset = (
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> => {
  return transportApi<ForgotPasswordResponse>({
    url: "/api/v1/forgot-password",
    method: "POST",
    data: payload,
  });
};
export const resetPassword = (
  payload: ResetPasswordRequest,
): Promise<ResetPasswordResponse> => {
  return transportApi<ResetPasswordResponse>({
    url: "/api/v1/reset-password",
    method: "POST",
    data: payload,
  });
};
