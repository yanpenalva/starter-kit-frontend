/**
 * CSRF bootstrap for the Sanctum SPA flow (ADR 0001, decision D9).
 *
 * Before any state-changing request the client must call
 * `GET /sanctum/csrf-cookie` so the API issues the XSRF cookie; axios then
 * mirrors it into the `X-XSRF-TOKEN` header. Concurrent mutations share one
 * in-flight bootstrap (deduplicated). `resetCsrfBootstrap` invalidates the
 * deduplication state after a 419 or logout so the next mutation bootstraps
 * again. Failures never retry blindly: the bootstrap error propagates to the
 * caller as a typed `HttpError`.
 */

import type { AxiosInstance } from "axios";
import { CSRF_COOKIE_PATH } from "./config";

export type CsrfBootstrapper = () => Promise<void>;

export interface CsrfCoordinator {
  readonly ensureCsrfCookie: CsrfBootstrapper;
  readonly resetCsrfBootstrap: () => void;
}

export function createCsrfCoordinator(client: AxiosInstance): CsrfCoordinator {
  let inflight: Promise<void> | null = null;
  let generation = 0;

  const requestCsrfCookie = async (): Promise<void> => {
    await client.get<void>(CSRF_COOKIE_PATH);
  };

  const ensureCsrfCookie: CsrfBootstrapper = () => {
    if (inflight !== null) {
      return inflight;
    }
    const currentGen = generation;
    inflight = requestCsrfCookie().catch((cause: unknown) => {
      if (generation === currentGen) {
        inflight = null;
      }
      throw cause;
    });
    return inflight;
  };

  const resetCsrfBootstrap = (): void => {
    generation += 1;
    inflight = null;
  };

  return { ensureCsrfCookie, resetCsrfBootstrap };
}
