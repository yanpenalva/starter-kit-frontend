import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";
import { URL } from "node:url";

const baseUrl = process.env.BROWSER_SMOKE_URL ?? "http://127.0.0.1:5173";
const layoutWaitTimeoutMs = 10_000;
const chromeBinary = process.env.CHROME_BIN ?? "google-chrome";
const remoteEndpoint = process.env.CHROME_REMOTE_ENDPOINT?.replace(/\/$/, "");
let profile;
let browser;
let debugEndpoint = remoteEndpoint;
let socket;

try {
  if (!debugEndpoint) {
    profile = await mkdtemp(join(tmpdir(), "starter-kit-chrome-"));
    const portServer = createServer();
    await new Promise((resolve) => portServer.listen(0, "127.0.0.1", resolve));
    const address = portServer.address();
    const debugPort =
      typeof address === "object" && address !== null ? address.port : 0;
    await new Promise((resolve, reject) =>
      portServer.close((error) => (error ? reject(error) : resolve(undefined))),
    );
    debugEndpoint = `http://127.0.0.1:${debugPort}`;
    browser = spawn(
      chromeBinary,
      [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${profile}`,
        "about:blank",
      ],
      { stdio: "ignore" },
    );
  }

  const browserVersion = await waitForBrowser(debugEndpoint);
  const target = await fetchJson(`${debugEndpoint}/json/new?about:blank`, {
    method: "PUT",
  });
  socket = new globalThis.WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  const pending = new Map();
  const externalRequests = [];
  let nextId = 0;
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Network.requestWillBeSent") {
      const requestUrl = message.params.request.url;
      const requestedOrigin = new URL(requestUrl);
      const appOrigin = new URL(baseUrl);
      if (
        requestedOrigin.hostname !== appOrigin.hostname ||
        requestedOrigin.port !== appOrigin.port
      ) {
        externalRequests.push(requestUrl);
      }
    }
    if (!message.id || !pending.has(message.id)) return;
    pending.get(message.id)(message);
    pending.delete(message.id);
  });

  const command = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Chrome command timed out: ${method}`));
      }, 10000);
      pending.set(id, (message) => {
        clearTimeout(timeout);
        if (message.error) reject(new Error(message.error.message));
        resolve(message);
      });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression, awaitPromise = false) => {
    const result = await command("Runtime.evaluate", {
      expression,
      awaitPromise,
      returnByValue: true,
    });
    if (result.result.exceptionDetails) {
      throw new Error(result.result.exceptionDetails.text);
    }
    return result.result.result.value;
  };

  await command("Network.enable");
  await command("Page.enable");
  await command("Runtime.enable");
  await command("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await command("Page.navigate", { url: baseUrl });
  await evaluate(
    `new Promise((resolve) => {
      const waitForIcons = () => {
        if (document.querySelectorAll(".q-icon").length === 2) {
          resolve(true);
          return;
        }
        setTimeout(waitForIcons, 50);
      };
      waitForIcons();
    })`,
    true,
  );
  await evaluate("document.fonts.ready.then(() => true)", true);

  const desktop = await evaluate(`(() => {
    const icons = [...document.querySelectorAll(".q-icon")];
    const heading = document.querySelector("h1");
    return {
      grid: getComputedStyle(document.querySelector(".hero")).gridTemplateColumns,
      minHeight: getComputedStyle(document.querySelector(".landing")).minHeight,
      headingFont: getComputedStyle(heading).fontFamily,
      bodyFont: getComputedStyle(document.querySelector(".landing")).fontFamily,
      icons: icons.map((icon) => ({
        name: icon.textContent.trim(),
        family: getComputedStyle(icon).fontFamily,
        size: getComputedStyle(icon).fontSize,
        glyphAvailable: document.fonts.check(
          '18px "Material Icons"',
          icon.textContent.trim(),
        ),
      })),
      loadedFonts: [...document.fonts]
        .filter((font) => font.status === "loaded")
        .map((font) => font.family),
    };
  })()`);
  await command("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  await command("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  const skipFocus = await evaluate(`(() => ({
    className: document.activeElement.className,
    outline: getComputedStyle(document.activeElement).outlineStyle,
  }))()`);
  await command("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  await command("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  await command("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  await command("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  const focus = await evaluate(`(() => ({
    className: document.activeElement.className,
    outline: getComputedStyle(document.activeElement).outlineStyle,
  }))()`);

  await command("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  const mobile = await evaluate(`(() => ({
    columns: getComputedStyle(document.querySelector(".hero")).gridTemplateColumns,
    cardWidth: document.querySelector(".note-card").getBoundingClientRect().width,
    viewport: innerWidth,
  }))()`);

  await command("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const authLayoutUrl = new URL("/scripts/layout-smoke.html", baseUrl).href;
  await command("Page.navigate", { url: authLayoutUrl });
  await evaluate(
    `new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const waitForLayout = () => {
        if (document.querySelector(".auth-layout__main")) {
          resolve(true);
          return;
        }
        if (Date.now() - startedAt >= ${layoutWaitTimeoutMs}) {
          reject(new Error("Auth layout smoke timed out: use the Vite development server, not preview."));
          return;
        }
        setTimeout(waitForLayout, 50);
      };
      waitForLayout();
    })`,
    true,
  );
  await evaluate("document.fonts.ready.then(() => true)", true);
  const authDesktop = await evaluate(`(() => ({
    columns: getComputedStyle(document.querySelector(".auth-layout__main")).gridTemplateColumns,
    panelWidth: document.querySelector(".auth-layout__panel").getBoundingClientRect().width,
    viewport: innerWidth,
    headingFont: getComputedStyle(document.querySelector(".auth-layout__main h1")).fontFamily,
    evergreen: getComputedStyle(document.documentElement).getPropertyValue("--color-evergreen").trim(),
  }))()`);
  await command("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  await command("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  const authSkipFocus = await evaluate(`(() => ({
    className: document.activeElement.className,
    outline: getComputedStyle(document.activeElement).outlineStyle,
  }))()`);
  await command("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  await command("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
  });
  const authBrandFocus = await evaluate(`(() => ({
    className: document.activeElement.className,
    outline: getComputedStyle(document.activeElement).outlineStyle,
  }))()`);
  await command("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  const authMobile = await evaluate(`(() => ({
    columns: getComputedStyle(document.querySelector(".auth-layout__main")).gridTemplateColumns,
    panelWidth: document.querySelector(".auth-layout__panel").getBoundingClientRect().width,
    viewport: innerWidth,
  }))()`);
  const result = {
    browserVersion,
    desktop,
    skipFocus,
    focus,
    mobile,
    authDesktop,
    authSkipFocus,
    authBrandFocus,
    authMobile,
    externalRequests,
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

  assert(desktop.minHeight === "900px", "Tailwind min-height utility missing");
  assert(desktop.grid.split(" ").length === 2, "Desktop grid utility missing");
  assert(
    desktop.headingFont.includes("DM Serif Display"),
    "Display font missing",
  );
  assert(desktop.bodyFont.includes("DM Sans"), "Body font missing");
  assert(desktop.icons.length === 2, "Expected two Quasar icons");
  assert(
    desktop.icons.every(
      (icon) =>
        icon.family.includes("Material Icons") &&
        icon.size !== "0px" &&
        icon.name.length > 0 &&
        icon.glyphAvailable,
    ),
    "Material icon font or glyph names missing",
  );
  assert(
    desktop.loadedFonts.includes("Material Icons"),
    "Icon font not loaded",
  );
  assert(desktop.loadedFonts.includes("DM Sans"), "DM Sans font not loaded");
  assert(
    desktop.loadedFonts.includes("DM Serif Display"),
    "DM Serif Display font not loaded",
  );
  assert(focus.className === "hero__link", "Keyboard focus did not reach CTA");
  assert(focus.outline === "solid", "Keyboard focus outline missing");
  assert(
    skipFocus.className === "public-layout__skip" &&
      skipFocus.outline === "solid",
    "Public layout skip link is not keyboard accessible",
  );
  assert(mobile.columns.split(" ").length === 1, "Mobile layout not stacked");
  assert(mobile.cardWidth <= mobile.viewport, "Mobile card overflows viewport");
  assert(
    authDesktop.columns.split(" ").length === 2,
    "Auth layout desktop columns missing",
  );
  assert(
    authDesktop.headingFont.includes("DM Serif Display"),
    "Auth display font missing",
  );
  assert(authDesktop.evergreen === "#456b56", "Shared color token missing");
  assert(
    authSkipFocus.className === "auth-layout__skip" &&
      authSkipFocus.outline === "solid",
    "Auth layout skip link is not keyboard accessible",
  );
  assert(
    authBrandFocus.className.includes("auth-layout__brand") &&
      authBrandFocus.outline === "solid",
    "Auth layout brand focus is not visible",
  );
  assert(
    authMobile.columns.split(" ").length === 1,
    "Auth layout mobile columns not stacked",
  );
  assert(
    authMobile.panelWidth <= authMobile.viewport,
    "Auth panel overflows viewport",
  );
  assert(externalRequests.length === 0, "External runtime request detected");
} finally {
  socket?.close();
  browser?.kill("SIGTERM");
  if (profile) await rm(profile, { recursive: true, force: true });
}

async function waitForBrowser(debugServer) {
  const endpoint = `${debugServer}/json/version`;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      return await fetchJson(endpoint);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error("Chrome DevTools endpoint did not start");
}

async function fetchJson(url, options = {}) {
  const response = await globalThis.fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.json();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
