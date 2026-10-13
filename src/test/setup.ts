import { afterAll, afterEach, beforeAll } from "vitest";
import { config } from "@vue/test-utils";
import { Quasar } from "quasar";
import { server } from "./server";

import.meta.env.VITE_API_URL = "http://localhost:8000";

config.global.plugins.push(Quasar);

function installBrowserShims(): void {
  if (!("orientation" in window.screen)) {
    Object.defineProperty(window.screen, "orientation", {
      configurable: true,
      value: {
        type: "landscape-primary",
        angle: 0,
        addEventListener: (): void => {},
        removeEventListener: (): void => {},
      },
    });
  }
  if (window.ResizeObserver === undefined) {
    Object.defineProperty(window, "ResizeObserver", {
      configurable: true,
      value: class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    });
  }
}

installBrowserShims();

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
