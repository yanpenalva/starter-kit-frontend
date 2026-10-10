import {
  authRegister,
  passwordEmail,
  passwordUpdate,
  verificationSend,
  verificationVerify,
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
export interface VerifyEmailLink {
  id: string;
  hash: string;
  expires: string;
  signature: string;
}
export const confirmEmailVerification = (
  link: VerifyEmailLink,
): Promise<unknown> => {
  return verificationVerify(link.id, link.hash, {
    params: { expires: link.expires, signature: link.signature },
  });
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
