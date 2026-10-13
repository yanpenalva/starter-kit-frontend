import { afterAll, afterEach, beforeAll } from "vitest";
import { config } from "@vue/test-utils";
import { Quasar } from "quasar";
import { server } from "./server";

import.meta.env.VITE_API_URL = "http://localhost:8000";

// The authenticated shell renders Quasar layout components (q-layout/q-header/
// q-drawer/q-page-container), so every test mounting a page needs the plugin.
config.global.plugins.push(Quasar);

function installBrowserShims(): void {
  if (!("orientation" in window.screen)) {
    Object.defineProperty(window.screen, "orientation", {
      configurable: true,
      value: {
        type: "landscape-primary",
        angle: 0,
        addEventListener: (): void => {
          /* jsdom has no orientation events */
        },
        removeEventListener: (): void => {
          /* jsdom has no orientation events */
        },
      },
    });
  }
  if (window.ResizeObserver === undefined) {
    Object.defineProperty(window, "ResizeObserver", {
      configurable: true,
      value: class {
        observe(): void {
          /* Quasar only needs the observer to exist under jsdom */
        }
        unobserve(): void {
          /* noop */
        }
        disconnect(): void {
          /* noop */
        }
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
