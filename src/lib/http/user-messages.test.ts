import { describe, expect, it } from "vitest";
import { buildHttpError } from "./errors";
import {
  describeHttpError,
  firstValidationMessage,
  rateLimitedMessage,
  UNKNOWN_ERROR_MESSAGE,
} from "./user-messages";
import { SAFE_MESSAGES } from "./error-constants";
import { isValidationHttpError } from "./error-guards";

const validationError = (errors: Record<string, unknown>) => {
  const error = buildHttpError({
    kind: "validation",
    body: { errors },
  });
  if (!isValidationHttpError(error)) {
    throw new Error("expected a validation error");
  }
  return error;
};

describe("user-facing error messages", () => {
  it("explains what happened and what to do for every safe message", () => {
    Object.values(SAFE_MESSAGES).forEach((message) => {
      expect(message.length).toBeGreaterThan(20);
      expect(message).not.toMatch(
        /[A-Za-z]{4,}\s[A-Za-z]{4,}\s[A-Za-z]{4,}e[a-z]*\s(the|and|with)/i,
      );
    });
  });

  it("keeps every safe message free of technical keys and stack traces", () => {
    Object.values(SAFE_MESSAGES).forEach((message) => {
      expect(message).not.toMatch(/stack|Error:|undefined|null|\b[45]\d{2}\b/);
    });
  });

  it("returns the mapped safe message for transport and status errors", () => {
    expect(describeHttpError(buildHttpError({ kind: "unauthorized" }))).toBe(
      SAFE_MESSAGES.unauthorized,
    );
    expect(describeHttpError(buildHttpError({ kind: "network" }))).toBe(
      SAFE_MESSAGES.network,
    );
    expect(describeHttpError(buildHttpError({ kind: "server_error" }))).toBe(
      SAFE_MESSAGES.server_error,
    );
  });

  it("surfaces the API validation message so the user knows which field failed", () => {
    const error = validationError({ email: ["Informe um e-mail válido."] });

    expect(firstValidationMessage(error)).toBe("Informe um e-mail válido.");
    expect(describeHttpError(error)).toBe("Informe um e-mail válido.");
  });

  it("falls back to the generic validation message when no field message exists", () => {
    expect(describeHttpError(validationError({}))).toBe(
      SAFE_MESSAGES.validation,
    );
    expect(firstValidationMessage(validationError({}))).toBeNull();
  });

  it("adds the waiting time when the API reports a retry delay", () => {
    const error = buildHttpError({
      kind: "rate_limited",
      retryAfterHeader: "30",
    });

    expect(rateLimitedMessage(30)).toContain("30 segundos");
    expect(describeHttpError(error)).toContain("30 segundos");
  });

  it("uses the generic throttling message when no delay is reported", () => {
    const error = buildHttpError({ kind: "rate_limited" });

    expect(describeHttpError(error)).toBe(SAFE_MESSAGES.rate_limited);
  });

  it("never leaks an unknown throwable and always answers in pt-BR", () => {
    expect(describeHttpError(new Error("ECONNREFUSED 127.0.0.1:8000"))).toBe(
      UNKNOWN_ERROR_MESSAGE,
    );
    expect(describeHttpError(undefined)).toBe(UNKNOWN_ERROR_MESSAGE);
    expect(describeHttpError("boom")).toBe(UNKNOWN_ERROR_MESSAGE);
  });
});
