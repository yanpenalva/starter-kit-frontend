import { transportApi } from "@/lib/http/orval-mutator";
import type { Paginated } from "@/shared/types/contract";
import type { ActivityFilters, AdminActivity } from "./audit.types";
export const listActivities = (
  filters: ActivityFilters = {},
): Promise<Paginated<AdminActivity>> => {
  return transportApi<Paginated<AdminActivity>>({
    url: "/api/v1/activity-log",
    method: "GET",
    params: filters,
  });
};
