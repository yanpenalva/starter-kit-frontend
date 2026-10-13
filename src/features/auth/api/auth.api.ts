import {
  authRegister,
  passwordEmail,
  passwordUpdate,
  verificationSend,
  verificationVerify,
} from "@/lib/api/generated";
import type {
  ChangeMyPasswordRequest,
  ChangeMyPasswordResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UpdateMyProfileRequest,
  UpdateMyProfileResponse,
  VerificationNotificationResponse,
} from "./auth.types";
import { transportApi } from "@/lib/http/orval-mutator";

export const updateMyProfile = (
  payload: UpdateMyProfileRequest,
): Promise<UpdateMyProfileResponse> => {
  return transportApi<UpdateMyProfileResponse>({
    url: "/api/v1/auth/my-profile",
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    data: payload,
  });
};

export const changeMyPassword = (
  payload: ChangeMyPasswordRequest,
): Promise<ChangeMyPasswordResponse> => {
  return transportApi<ChangeMyPasswordResponse>({
    url: "/api/v1/auth/password",
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    data: payload,
  });
};

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
    expires: link.expires,
    signature: link.signature,
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
