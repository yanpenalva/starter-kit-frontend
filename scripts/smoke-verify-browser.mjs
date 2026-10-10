import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";
import { setTimeout as sleep } from "node:timers/promises";

const BASE_URL = process.env.BROWSER_SMOKE_URL ?? "http://localhost:5173";
const API_URL = (process.env.API_SMOKE_URL ?? "").replace(/\/$/, "");
const LARAVEL_LOG = process.env.SMOKE_LARAVEL_LOG ?? "";
const DEFAULT_DB_PATH = "/opt/data/cache/scratch/verify-smoke.sqlite";
const DB_PATH = process.env.SMOKE_DB_PATH ?? DEFAULT_DB_PATH;
const CHROME_BIN = process.env.CHROME_BIN ?? "google-chrome";
const ALLOW_REMOTE_API = process.env.SMOKE_ALLOW_REMOTE === "1";
const LOCAL_API_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const EMAIL = `verify.smoke.${Date.now()}@example.test`;
const PASSWORD = "correct-horse-99";

const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
  globalThis.console.log(`[${cond ? "PASS" : "FAIL"}] ${msg}`);
}

function fetchJson(url, options = {}) {
  return globalThis
    .fetch(url, { signal: globalThis.AbortSignal.timeout(5000), ...options })
    .then(async (res) => {
      if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
      return res.json();
    });
}

async function waitForBrowser(endpoint, tries = 50, delay = 200) {
  for (let i = 0; i < tries; i++) {
    try {
      return await fetchJson(`${endpoint}/json/version`);
    } catch {
      await sleep(delay);
    }
  }
  throw new Error(`Browser not reachable at ${endpoint}`);
}

function isTcpPortFree(port, host = "127.0.0.1", timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const done = (free) => {
      try {
        socket.destroy();
      } catch {
        /* noop */
      }
      resolve(free);
    };
    socket.once("connect", () => done(false));
    socket.once("error", () => done(true));
    setTimeout(() => done(true), timeoutMs);
  });
}

async function pickFreePort(tries = 10) {
  for (let i = 0; i < tries; i++) {
    const port = 9349 + Math.floor(Math.random() * 500);
    if (await isTcpPortFree(port)) return port;
  }
  throw new Error(
    "Nenhuma porta livre para o Chrome (colisao apos 10 tentativas)",
  );
}

async function shutdownChrome(chrome, timeoutMs = 5000) {
  if (!chrome || chrome.exitCode !== null || chrome.signalCode !== null) return;
  const exited = new Promise((resolve) => chrome.once("exit", () => resolve()));
  try {
    chrome.kill("SIGTERM");
  } catch {
    return;
  }
  const done = await Promise.race([
    exited.then(() => true),
    sleep(timeoutMs).then(() => false),
  ]);
  if (!done) {
    try {
      chrome.kill("SIGKILL");
    } catch {
      /* noop */
    }
    await Promise.race([exited, sleep(3000)]);
  }
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) {
          reject(new Error(JSON.stringify(msg.error)));
        } else {
          resolve(msg.result);
        }
      }
    });
  }

  static async connect(wsUrl) {
    const ws = new globalThis.WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });
    return new Cdp(ws);
  }

  command(method, params = {}, timeout = 15000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeout);
      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const { result, exceptionDetails } = await this.command(
      "Runtime.evaluate",
      { expression, awaitPromise: true, returnByValue: true },
    );
    if (exceptionDetails) throw new Error(JSON.stringify(exceptionDetails));
    return result.value;
  }

  close() {
    this.ws.close();
  }
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeQuotedPrintable(text) {
  return text
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );
}

function extractVerifyLink(sinceBytes, { email = "", baseUrl = "" } = {}) {
  let log;
  try {
    log = readFileSync(LARAVEL_LOG, "utf8").slice(sinceBytes);
  } catch {
    return null;
  }
  const decoded = decodeQuotedPrintable(log);
  let origin;
  try {
    origin = new globalThis.URL(baseUrl).origin;
  } catch {
    origin = "";
  }
  const pattern = origin
    ? new RegExp(`${escapeRegExp(origin)}/verify-email\\?[^\\s"'<]+`, "g")
    : /https?:\/\/[^\s"'<]*\/verify-email\?[^\s"'<]+/g;
  const matches = [...decoded.matchAll(pattern)];
  if (matches.length === 0) return null;
  const clean = (m) => m.replace(/&amp;/g, "&").replace(/[).,;:!?'"\]]+$/, "");
  if (email) {
    const encoded = encodeURIComponent(email);
    const nearby = matches.filter((m) => {
      const idx = m.index ?? 0;
      const ctx = decoded.slice(Math.max(0, idx - 4000), idx + 4000);
      return ctx.includes(email) || ctx.includes(encoded);
    });
    if (nearby.length > 0) return clean(nearby[nearby.length - 1][0]);
  }
  return clean(matches[matches.length - 1][0]);
}

async function waitForVerifyLink(sinceBytes, opts = {}) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const link = extractVerifyLink(sinceBytes, opts);
    if (link !== null) return link;
    await sleep(500);
  }
  return null;
}

async function waitForPage(
  cdp,
  expression,
  { timeoutMs = 15000, pollMs = 300 } = {},
) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await cdp.evaluate(expression);
    if (last) return last;
    await sleep(pollMs);
  }
  return last;
}

async function readVisibleError(cdp) {
  try {
    return await cdp.evaluate(`(() => {
      const selectors = [
        '.register-form__error',
        '.register-form__server-error',
        '.login-form__error',
        '.login-form__server-error',
        '[role="alert"]',
        '.q-notification__message',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent.trim()) return el.textContent.trim().slice(0, 300);
      }
      return '';
    })()`);
  } catch {
    return "";
  }
}

function extractUserId(link) {
  const m = link?.match(/\/verify-email\/(\d+)\//);
  return m ? m[1] : null;
}

async function cleanupTestUser(link) {
  const userId = extractUserId(link);
  if (userId) {
    try {
      const res = await globalThis.fetch(`${API_URL}/api/v1/users/${userId}`, {
        method: "DELETE",
        signal: globalThis.AbortSignal.timeout(5000),
      });
      globalThis.console.log(
        `[INFO] limpeza via API: DELETE users/${userId} -> HTTP ${res.status}`,
      );
    } catch (e) {
      globalThis.console.log(
        `[INFO] limpeza via API ignorada (best-effort): ${e.message}`,
      );
    }
  }
  try {
    execFileSync(
      "php",
      [
        "-r",
        `$dbPath = getenv("SMOKE_DB_PATH") ?: ${JSON.stringify(DEFAULT_DB_PATH)}; $pdo = new PDO("sqlite:" . $dbPath); $stmt = $pdo->prepare("DELETE FROM users WHERE email = ?"); $stmt->execute([getenv("SMOKE_VERIFY_EMAIL")]);`,
      ],
      {
        env: {
          ...process.env,
          SMOKE_VERIFY_EMAIL: EMAIL,
          SMOKE_DB_PATH: DB_PATH,
        },
        stdio: "ignore",
      },
    );
    globalThis.console.log("[INFO] usuario de teste removido (best-effort)");
  } catch {
    globalThis.console.log(
      "[INFO] limpeza do usuario de teste ignorada (best-effort)",
    );
  }
}

async function fillRegister(cdp) {
  await cdp.evaluate(`(async () => {
    const set = (sel, value) => {
      const el = document.querySelector(sel);
      el.focus();
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.blur();
    };
    set('#register-name', 'Verify Smoke');
    set('#register-email', ${JSON.stringify(EMAIL)});
    set('#register-password', ${JSON.stringify(PASSWORD)});
    set('#register-password-confirmation', ${JSON.stringify(PASSWORD)});
    document.querySelector('.register-form__submit-btn').click();
  })()`);
}

async function main() {
  if (!API_URL || !LARAVEL_LOG) {
    globalThis.console.error(
      "Erro: defina API_SMOKE_URL e SMOKE_LARAVEL_LOG no ambiente.",
    );
    process.exit(1);
  }
  let apiHost;
  try {
    apiHost = new globalThis.URL(API_URL).hostname;
  } catch {
    apiHost = "";
  }
  if (!apiHost) {
    globalThis.console.error("Erro: API_SMOKE_URL invalida (sem host).");
    process.exit(1);
  }
  if (!LOCAL_API_HOSTS.has(apiHost) && !ALLOW_REMOTE_API) {
    globalThis.console.error(
      `Erro: API_SMOKE_URL aponta para host nao local (${apiHost}). ` +
        "O smoke cria usuarios de teste: use host local ou SMOKE_ALLOW_REMOTE=1.",
    );
    process.exit(1);
  }

  let chrome = null;
  let profileDir = null;
  let cdp = null;
  let targetId = null;
  let endpoint = null;
  let verifyLink = null;

  try {
    profileDir = mkdtempSync(join(tmpdir(), "smoke-verify-browser-"));
    const port = await pickFreePort();
    endpoint = `http://127.0.0.1:${port}`;
    chrome = spawn(
      CHROME_BIN,
      [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${profileDir}`,
        "about:blank",
      ],
      { stdio: "ignore" },
    );
    const chromeSpawnFailed = new Promise((resolve, reject) => {
      chrome.on("error", (e) => {
        reject(new Error(`Falha ao iniciar Chrome: ${e.message}`));
      });
    });

    const version = await Promise.race([
      waitForBrowser(endpoint),
      chromeSpawnFailed,
    ]);
    if (!version?.Browser) {
      throw new Error(
        "Endpoint CDP inesperado (sem Browser): possivel colisao de porta",
      );
    }
    globalThis.console.log(`Browser: ${version.Browser}`);

    const target = await fetchJson(`${endpoint}/json/new?about:blank`, {
      method: "PUT",
    });
    targetId = target.id;
    cdp = await Cdp.connect(target.webSocketDebuggerUrl);
    await cdp.command("Page.enable");

    await cdp.command("Page.navigate", { url: `${BASE_URL}/register` });
    const registerReady = await waitForPage(
      cdp,
      "(() => location.pathname === '/register' && !!document.querySelector('#register-email'))()",
      { timeoutMs: 15000 },
    );
    assert(
      registerReady === true,
      "formulario de registro carregou (/register com #register-email)",
    );

    let logOffset = 0;
    try {
      logOffset = statSync(LARAVEL_LOG).size;
    } catch {
      logOffset = 0;
    }
    await fillRegister(cdp);
    const registered = await waitForPage(
      cdp,
      "(() => (location.pathname === '/login' ? 'login' : null))()",
      { timeoutMs: 15000 },
    );
    if (registered !== "login") {
      const errText = await readVisibleError(cdp);
      assert(
        false,
        `registro redirecionou para /login (erro visivel: ${errText || "nenhum"})`,
      );
    } else {
      assert(true, "registro redirecionou para /login");
    }

    const link = await waitForVerifyLink(logOffset, {
      email: EMAIL,
      baseUrl: BASE_URL,
    });
    verifyLink = link;
    assert(link !== null, "link de verificacao presente no laravel.log");
    assert(
      link !== null && link.includes("expires=") && link.includes("signature="),
      "link contem expires e signature",
    );

    const loginReady = await waitForPage(
      cdp,
      "(() => !!document.querySelector('#login-email'))()",
      { timeoutMs: 10000 },
    );
    assert(loginReady === true, "formulario de login carregou (#login-email)");
    await cdp.evaluate(`(async () => {
      const email = document.querySelector('#login-email');
      const pass = document.querySelector('#login-password');
      for (const [el, value] of [[email, ${JSON.stringify(EMAIL)}], [pass, ${JSON.stringify(PASSWORD)}]]) {
        el.focus();
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.blur();
      }
      document.querySelector('.login-form__submit-btn').click();
    })()`);
    const loggedIn = await (async () => {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        if ((await cdp.evaluate("location.pathname")) === "/limited")
          return true;
        await sleep(300);
      }
      return false;
    })();
    assert(loggedIn, "login pendente nao-verificada alcancou /limited");

    await cdp.command("Page.navigate", { url: link });
    const verifyState = await (async () => {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        const state = await cdp.evaluate(`(() => {
          if (document.querySelector('.verify-card__awaiting')) return 'awaiting';
          if (document.querySelector('.verify-card__success')) return 'success';
          if (location.pathname === '/dashboard') return 'dashboard';
          return null;
        })()`);
        if (state !== null) return state;
        await sleep(300);
      }
      return null;
    })();
    assert(
      verifyState !== null,
      "pagina /verify-email confirmou o e-mail via SPA",
    );
    const finalState =
      verifyState === "success"
        ? await cdp.evaluate(`(() => {
            if (location.pathname === '/dashboard') return 'dashboard';
            if (document.querySelector('.verify-card__awaiting')) return 'awaiting';
            if (document.querySelector('.verify-card__success')) return 'success';
            return 'unknown';
          })()`)
        : verifyState;
    globalThis.console.log(`[INFO] estado final da verificacao: ${finalState}`);
    assert(
      finalState === "awaiting" || finalState === "dashboard",
      `estado final esperado (awaiting ou dashboard), obteve: ${finalState}`,
    );

    const verifiedAt = execFileSync(
      "php",
      [
        "-r",
        `$dbPath = getenv("SMOKE_DB_PATH") ?: ${JSON.stringify(DEFAULT_DB_PATH)}; $pdo = new PDO("sqlite:" . $dbPath); $r = $pdo->query("SELECT email_verified_at FROM users WHERE email = " . $pdo->quote(getenv("SMOKE_VERIFY_EMAIL")))->fetch(); echo $r && $r["email_verified_at"] ? $r["email_verified_at"] : "NULL";`,
      ],
      {
        env: {
          ...process.env,
          SMOKE_VERIFY_EMAIL: EMAIL,
          SMOKE_DB_PATH: DB_PATH,
        },
        encoding: "utf8",
      },
    ).trim();
    assert(
      verifiedAt !== "" && verifiedAt !== "NULL",
      "sqlite confirma email_verified_at preenchido",
    );

    if (failures.length > 0) {
      globalThis.console.error(`SMOKE-VERIFY FAILURES: ${failures.length}`);
      process.exitCode = 1;
    }
    globalThis.console.log("SMOKE-VERIFY ok:true failures:0");
  } finally {
    try {
      await cleanupTestUser(verifyLink);
    } catch {
      /* noop */
    }
    try {
      if (cdp) cdp.close();
    } catch {
      /* noop */
    }
    try {
      if (targetId)
        await globalThis.fetch(`${endpoint}/json/close/${targetId}`, {
          method: "PUT",
        });
    } catch {
      /* noop */
    }
    try {
      await shutdownChrome(chrome);
    } catch {
      /* noop */
    }
    try {
      if (profileDir) rmSync(profileDir, { recursive: true, force: true });
    } catch {
      /* noop */
    }
  }
}

await main();
