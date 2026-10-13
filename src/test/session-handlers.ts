import { http, HttpResponse } from "msw";
import type { RequestHandler } from "msw";
import type { ActiveSession } from "@/features/auth/api/sessions.api";
import {
  createHttpTestHandlers,
  makeCorsHeaders,
  TEST_API_BASE,
} from "@/test/http-handlers";

const SESSIONS_URL = `${TEST_API_BASE}/api/v1/auth/sessions`;

export interface SessionRequest {
  method: string;
  path: string;
}

export interface SessionMocks {
  handlers: RequestHandler[];
  calls: SessionRequest[];
}

export const createSessionMocks = (
  initialSessions: readonly ActiveSession[] = [],
): SessionMocks => {
  let sessions = [...initialSessions];
  const calls: SessionRequest[] = [];
  const testHandlers = createHttpTestHandlers();
  const handlers: RequestHandler[] = [
    ...testHandlers.handlers,
    http.get(SESSIONS_URL, ({ request }) => {
      calls.push({
        method: request.method,
        path: new URL(request.url).pathname,
      });
      return HttpResponse.json(
        { data: sessions },
        { headers: makeCorsHeaders(request) },
      );
    }),
    http.delete(`${SESSIONS_URL}/:id`, ({ params, request }) => {
      calls.push({
        method: request.method,
        path: new URL(request.url).pathname,
      });
      const id = String(params.id);
      sessions = sessions.filter((session) => session.id !== id);
      return new HttpResponse(null, {
        status: 204,
        headers: makeCorsHeaders(request),
      });
    }),
    http.delete(SESSIONS_URL, ({ request }) => {
      calls.push({
        method: request.method,
        path: new URL(request.url).pathname,
      });
      sessions = sessions.filter((session) => session.is_current);
      return new HttpResponse(null, {
        status: 204,
        headers: makeCorsHeaders(request),
      });
    }),
  ];
  return { handlers, calls };
};
