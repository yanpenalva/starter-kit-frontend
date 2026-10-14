import { beforeEach, describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { createSessionMocks } from "@/test/session-handlers";
import type { ActiveSession } from "./sessions.api";
import {
  listActiveSessions,
  revokeOtherSessions,
  revokeSession,
} from "./sessions.api";

const sessions: ActiveSession[] = [
  {
    id: "current-session",
    ip_address: "192.0.2.1",
    user_agent: "Example Browser",
    last_activity: "2026-10-12T10:00:00Z",
    is_current: true,
  },
  {
    id: "other-session",
    ip_address: null,
    user_agent: null,
    last_activity: null,
    is_current: false,
  },
];

describe("active sessions API", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=; Max-Age=0; path=/";
  });

  it("lists account sessions per the API contract", async () => {
    const mocks = createSessionMocks(sessions);
    server.use(...mocks.handlers);

    await expect(listActiveSessions()).resolves.toEqual(sessions);
    expect(mocks.calls).toEqual([
      { method: "GET", path: "/api/v1/auth/sessions" },
    ]);
  });

  it("revokes a session by the ID encoded in the path", async () => {
    const mocks = createSessionMocks(sessions);
    server.use(...mocks.handlers);

    await revokeSession("other-session");

    expect(mocks.calls).toEqual([
      { method: "DELETE", path: "/api/v1/auth/sessions/other-session" },
    ]);
  });

  it("revokes other sessions without ending the current one", async () => {
    const mocks = createSessionMocks(sessions);
    server.use(...mocks.handlers);

    await revokeOtherSessions();
    await expect(listActiveSessions()).resolves.toEqual([sessions[0]]);
    expect(mocks.calls).toEqual([
      { method: "DELETE", path: "/api/v1/auth/sessions" },
      { method: "GET", path: "/api/v1/auth/sessions" },
    ]);
  });
});
