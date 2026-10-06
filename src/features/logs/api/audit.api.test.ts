import { describe, expect, it, beforeEach } from "vitest";
import { server } from "@/test/server";
import { listActivities } from "./audit.api";
import { makeAdminActivity, makeAuditRouteMocks } from "@/test/admin-handlers";

const activities = [
  makeAdminActivity({ id: 3, subject_id: 2 }),
  makeAdminActivity({ id: 2, event: "cli.bootstrap" }),
  makeAdminActivity({ id: 1 }),
];

describe("audit.api", () => {
  let calls: ReturnType<typeof makeAuditRouteMocks>["calls"];

  beforeEach(() => {
    const mocks = makeAuditRouteMocks(activities);
    server.use(...mocks.handlers);
    calls = mocks.calls;
  });

  it("lists activities with allowlisted filters and pagination", async () => {
    const page = await listActivities({
      page: 1,
      per_page: 25,
      event: "privileged.change",
      subject_type: "user",
    });

    expect(page.data).toHaveLength(2);
    expect(page.data.map((activity) => activity.id)).toEqual([3, 1]);
    expect(page.meta).toMatchObject({
      current_page: 1,
      per_page: 25,
      total: 2,
    });

    const call = calls[0];
    expect(call?.method).toBe("GET");
    expect(call?.path).toBe("/api/v1/activity-log");
    expect(call?.query.get("page")).toBe("1");
    expect(call?.query.get("per_page")).toBe("25");
    expect(call?.query.get("event")).toBe("privileged.change");
    expect(call?.query.get("subject_type")).toBe("user");
  });

  it("omits filters that are not set", async () => {
    await listActivities();

    const call = calls[0];
    expect(call?.query.get("event")).toBeNull();
    expect(call?.query.get("subject_type")).toBeNull();
  });

  it("propagates API errors as HttpError", async () => {
    const mocks = makeAuditRouteMocks([], {
      status: 500,
      message: "Erro interno.",
    });
    server.use(...mocks.handlers);

    await expect(listActivities()).rejects.toMatchObject({
      kind: "server_error",
      status: 500,
    });
  });
});
