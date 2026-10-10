import { describe, expect, it } from "vitest";
import {
  signedLinkErrorMessage,
  signedLinkFromQuery,
} from "./verify-email-link";
import { buildHttpError } from "@/lib/http";

describe("signedLinkFromQuery", () => {
  it("builds a link from complete query params", () => {
    expect(
      signedLinkFromQuery({
        id: "7",
        hash: "abc123",
        expires: "9999999999",
        signature: "sig",
      }),
    ).toEqual({
      id: "7",
      hash: "abc123",
      expires: "9999999999",
      signature: "sig",
    });
  });

  it("returns null when any param is missing, empty, or repeated", () => {
    expect(signedLinkFromQuery({})).toBeNull();
    expect(
      signedLinkFromQuery({
        id: "7",
        hash: "abc",
        expires: "1",
        signature: "",
      }),
    ).toBeNull();
    expect(
      signedLinkFromQuery({
        id: ["7", "8"],
        hash: "abc",
        expires: "1",
        signature: "s",
      }),
    ).toBeNull();
  });
});

describe("signedLinkErrorMessage", () => {
  it("guides login when the session expired", () => {
    expect(
      signedLinkErrorMessage(
        buildHttpError({ kind: "unauthorized", status: 401 }),
      ),
    ).toContain("sessão expirou");
  });

  it("flags invalid links as expired", () => {
    expect(
      signedLinkErrorMessage(
        buildHttpError({ kind: "forbidden", status: 403 }),
      ),
    ).toContain("inválido ou expirou");
  });
});
