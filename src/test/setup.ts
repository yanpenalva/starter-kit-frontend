import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";

import.meta.env.VITE_API_URL = "http://localhost:8000";

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
