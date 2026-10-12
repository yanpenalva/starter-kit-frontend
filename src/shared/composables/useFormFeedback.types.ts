import type { HttpError } from "@/lib/http";

export type RetryableHttpError = Extract<
  HttpError,
  { kind: "network" | "server_error" | "unexpected" | "rate_limited" }
>;
