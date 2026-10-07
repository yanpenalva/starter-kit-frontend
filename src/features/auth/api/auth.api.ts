import {
  authRegister,
  passwordEmail,
  passwordUpdate,
  verificationSend,
} from "@/lib/api/generated";
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
  return authRegister(payload);
};
export const sendVerificationNotification =
  (): Promise<VerificationNotificationResponse> => {
    return verificationSend();
  };
export const requestPasswordReset = (
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> => {
  return passwordEmail(payload);
};
export const resetPassword = (
  payload: ResetPasswordRequest,
): Promise<ResetPasswordResponse> => {
  return passwordUpdate(payload);
};
