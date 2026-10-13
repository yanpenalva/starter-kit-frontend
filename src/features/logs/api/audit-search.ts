import type { AdminActivity } from "./audit.types";

export const auditActorId = (activity: AdminActivity): number | null => {
  if (activity.properties.actor_type !== "user") return null;
  const id = Number(activity.properties.actor_id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export const matchesAuditSearch = (
  activity: AdminActivity,
  term: string,
  actorName?: string,
): boolean => {
  const search = term.trim().toLowerCase();
  if (search === "") return true;

  const action = activity.properties.action;
  return [actorName, activity.event, activity.description, action].some(
    (value) =>
      typeof value === "string" && value.toLowerCase().includes(search),
  );
};
