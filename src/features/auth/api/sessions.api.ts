import { transportApi } from "@/lib/http/orval-mutator";

export interface ActiveSession {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  last_activity: string | null;
  is_current: boolean;
}

interface ActiveSessionsResponse {
  data: ActiveSession[];
}

export const listActiveSessions = async (): Promise<ActiveSession[]> => {
  const response = await transportApi<ActiveSessionsResponse>({
    url: "/api/v1/auth/sessions",
    method: "GET",
  });
  return response.data;
};

export const revokeSession = async (id: string): Promise<void> => {
  await transportApi<void>({
    url: `/api/v1/auth/sessions/${encodeURIComponent(id)}`,
    method: "DELETE",
  });
};

export const revokeOtherSessions = async (): Promise<void> => {
  await transportApi<void>({
    url: "/api/v1/auth/sessions",
    method: "DELETE",
  });
};
