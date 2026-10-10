import { describe, expect, it } from "vitest";
import {
  AUDIT_EVENTS,
  AUDIT_SUBJECT_TYPES,
} from "@/features/logs/api/audit.types";
import { createMockDatabase } from "./mock-data";

describe("createMockDatabase", () => {
  it("builds enough volume for pagination", () => {
    const database = createMockDatabase();
    expect(database.users).toHaveLength(32);
    expect(database.activities).toHaveLength(48);
    expect(database.roles.length).toBeGreaterThanOrEqual(4);
  });

  it("returns independent instances on every call", () => {
    const first = createMockDatabase();
    first.users.splice(0, first.users.length);
    first.roles.pop();
    const second = createMockDatabase();
    expect(second.users).toHaveLength(32);
    expect(second.roles.length).toBeGreaterThanOrEqual(4);
  });

  it("uses only synthetic data without real personal information", () => {
    const database = createMockDatabase();
    const emails = [
      database.profile.email,
      ...database.users.map((user) => user.email),
    ];
    expect(emails.length).toBeGreaterThan(0);
    for (const email of emails) {
      expect(email).toMatch(/\.test$/);
    }
    const joined = emails.join(" ");
    expect(joined).not.toMatch(/gmail|hotmail|outlook|yahoo/i);
  });

  it("authenticates a verified admin profile with every admin permission", () => {
    const { profile } = createMockDatabase();
    expect(profile.email_verified_at).not.toBeNull();
    expect(profile.roles).toContain("admin");
    expect(profile.permissions).toEqual(
      expect.arrayContaining(["users.view", "roles.view", "logs.view"]),
    );
  });

  it("includes long texts for layout and responsiveness checks", () => {
    const database = createMockDatabase();
    expect(database.users.some((user) => user.name.length > 50)).toBe(true);
    expect(
      database.activities.some((activity) => activity.description.length > 120),
    ).toBe(true);
  });

  it("keeps activities within the real audit contract", () => {
    const database = createMockDatabase();
    for (const activity of database.activities) {
      expect(AUDIT_EVENTS as readonly string[]).toContain(activity.event);
      expect(AUDIT_SUBJECT_TYPES as readonly string[]).toContain(
        activity.subject_type,
      );
    }
  });
});
