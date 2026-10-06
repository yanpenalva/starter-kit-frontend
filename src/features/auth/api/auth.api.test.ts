import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  makeCorsHeaders,
  TEST_API_BASE,
  TEST_CSRF_TOKEN,
} from "@/test/http-handlers";
import { CSRF_COOKIE_NAME } from "@/lib/http/config";
import {
  registerUser,
  requestPasswordReset,
  resetPassword,
  sendVerificationNotification,
} from "./auth.api";

const REGISTER_URL = `${TEST_API_BASE}/api/v1/register`;
const VERIFICATION_NOTIFICATION_URL = `${TEST_API_BASE}/api/v1/email/verification-notification`;
const FORGOT_PASSWORD_URL = `${TEST_API_BASE}/api/v1/forgot-password`;
const RESET_PASSWORD_URL = `${TEST_API_BASE}/api/v1/reset-password`;
const CSRF_COOKIE_URL = `${TEST_API_BASE}/sanctum/csrf-cookie`;

describe("auth.api", () => {
  beforeEach(() => {
    server.use(
      http.options(
        "*",
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request),
          }),
      ),
      http.get(
        CSRF_COOKIE_URL,
        ({ request }) =>
          new HttpResponse(null, {
            status: 204,
            headers: makeCorsHeaders(request, {
              "Set-Cookie": `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}; Path=/`,
            }),
          }),
      ),
    );
  });

  afterEach(() => {
    document.cookie = `${CSRF_COOKIE_NAME}=; Max-Age=0; path=/`;
  });

  it("registerUser sends POST /api/v1/register and returns 201 response", async () => {
    let capturedBody: unknown = null;
    server.use(
      http.post(REGISTER_URL, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          {
            id: 10,
            name: "Novo Usuário",
            email: "novo@example.com",
            email_verified_at: null,
          },
          { status: 201, headers: makeCorsHeaders(request) },
        );
      }),
    );

    const result = await registerUser({
      name: "Novo Usuário",
      email: "novo@example.com",
      password: "password12345",
      password_confirmation: "password12345",
      cpf: "52998224725",
    });

    expect(result).toEqual({
      id: 10,
      name: "Novo Usuário",
      email: "novo@example.com",
      email_verified_at: null,
    });
    expect(capturedBody).toEqual({
      name: "Novo Usuário",
      email: "novo@example.com",
      password: "password12345",
      password_confirmation: "password12345",
      cpf: "52998224725",
    });
  });

  it("sendVerificationNotification sends POST /api/v1/email/verification-notification", async () => {
    server.use(
      http.post(VERIFICATION_NOTIFICATION_URL, ({ request }) => {
        return HttpResponse.json(
          { message: "Link de verificação reenviado." },
          { status: 202, headers: makeCorsHeaders(request) },
        );
      }),
    );

    const result = await sendVerificationNotification();
    expect(result).toEqual({ message: "Link de verificação reenviado." });
  });

  it("requestPasswordReset sends POST /api/v1/forgot-password with email", async () => {
    let capturedBody: unknown = null;
    server.use(
      http.post(FORGOT_PASSWORD_URL, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          { message: "Se o email existir, enviamos o link." },
          { status: 202, headers: makeCorsHeaders(request) },
        );
      }),
    );

    const result = await requestPasswordReset({ email: "user@example.com" });
    expect(result).toEqual({
      message: "Se o email existir, enviamos o link.",
    });
    expect(capturedBody).toEqual({ email: "user@example.com" });
  });

  it("resetPassword sends POST /api/v1/reset-password", async () => {
    let capturedBody: unknown = null;
    server.use(
      http.post(RESET_PASSWORD_URL, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          { message: "Sua senha foi redefinida com sucesso." },
          { status: 200, headers: makeCorsHeaders(request) },
        );
      }),
    );

    const result = await resetPassword({
      token: "secret-token",
      email: "user@example.com",
      password: "newPassword12345",
      password_confirmation: "newPassword12345",
    });

    expect(result).toEqual({
      message: "Sua senha foi redefinida com sucesso.",
    });
    expect(capturedBody).toEqual({
      token: "secret-token",
      email: "user@example.com",
      password: "newPassword12345",
      password_confirmation: "newPassword12345",
    });
  });
});
