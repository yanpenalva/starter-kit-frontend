import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";
import { setTimeout as sleep } from "node:timers/promises";

const BASE_URL = process.env.BROWSER_SMOKE_URL ?? "http://localhost:5173";
const API_URL = (process.env.API_SMOKE_URL ?? "").replace(/\/$/, "");
const LARAVEL_LOG = process.env.SMOKE_LARAVEL_LOG ?? "";
const DB_PATH =
  process.env.SMOKE_DB_PATH ?? "/opt/data/cache/scratch/verify-smoke.sqlite";
const CHROME_BIN = process.env.CHROME_BIN ?? "google-chrome";
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

function extractVerifyLink(sinceBytes) {
  const log = readFileSync(LARAVEL_LOG, "utf8").slice(sinceBytes);
  const matches = [
    ...log.matchAll(/http:\/\/localhost:5173\/verify-email\?[^\s"'<]+/g),
  ];
  if (matches.length === 0) return null;
  return matches[matches.length - 1][0].replace(/&amp;/g, "&");
}

async function waitForVerifyLink(sinceBytes) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const link = extractVerifyLink(sinceBytes);
    if (link !== null) return link;
    await sleep(500);
  }
  return null;
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

  let chrome = null;
  let profileDir = null;
  let cdp = null;
  let targetId = null;
  let endpoint = null;

  try {
    profileDir = mkdtempSync(join(tmpdir(), "smoke-verify-browser-"));
    const port = 9349 + Math.floor(Math.random() * 500);
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
    chrome.on("error", (e) => {
      throw new Error(`Falha ao iniciar Chrome: ${e.message}`);
    });

    const version = await waitForBrowser(endpoint);
    globalThis.console.log(`Browser: ${version.Browser}`);

    const target = await fetchJson(`${endpoint}/json/new?about:blank`, {
      method: "PUT",
    });
    targetId = target.id;
    cdp = await Cdp.connect(target.webSocketDebuggerUrl);
    await cdp.command("Page.enable");

    await cdp.command("Page.navigate", { url: `${BASE_URL}/register` });
    await sleep(1500);
    assert(
      (await cdp.evaluate("location.pathname")) === "/register",
      "navegou para /register",
    );

    await cdp.evaluate(`(async () => {
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        if (document.querySelector('#register-email')) return true;
        await new Promise((r) => setTimeout(r, 200));
      }
      return false;
    })()`);

    let logOffset = 0;
    try {
      logOffset = statSync(LARAVEL_LOG).size;
    } catch {
      logOffset = 0;
    }
    await fillRegister(cdp);
    const registered = await (async () => {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        const path = await cdp.evaluate("location.pathname");
        if (path === "/login") return true;
        await sleep(300);
      }
      return false;
    })();
    assert(registered, "registro redirecionou para /login");

    const link = await waitForVerifyLink(logOffset);
    assert(link !== null, "link de verificacao presente no laravel.log");
    assert(
      link !== null && link.includes("expires=") && link.includes("signature="),
      "link contem expires e signature",
    );

    await cdp.evaluate(`(async () => {
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        if (document.querySelector('#login-email')) return true;
        await new Promise((r) => setTimeout(r, 200));
      }
    })()`);
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
    const verified = await (async () => {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        if (
          await cdp.evaluate(
            `!!document.querySelector('.verify-card__success, .verify-card__awaiting')`,
          )
        )
          return true;
        await sleep(300);
      }
      return false;
    })();
    assert(verified, "pagina /verify-email confirmou o e-mail via SPA");

    const verifiedAt = execFileSync(
      "php",
      [
        "-r",
        `$pdo = new PDO("sqlite:${DB_PATH}"); $r = $pdo->query("SELECT email_verified_at FROM users WHERE email = " . $pdo->quote(getenv("SMOKE_VERIFY_EMAIL")))->fetch(); echo $r && $r["email_verified_at"] ? $r["email_verified_at"] : "NULL";`,
      ],
      {
        env: { ...process.env, SMOKE_VERIFY_EMAIL: EMAIL },
        encoding: "utf8",
      },
    ).trim();
    assert(
      verifiedAt !== "" && verifiedAt !== "NULL",
      "sqlite confirma email_verified_at preenchido",
    );

    if (failures.length > 0) {
      globalThis.console.error(`SMOKE-VERIFY FAILURES: ${failures.length}`);
      process.exit(1);
    }
    globalThis.console.log("SMOKE-VERIFY ok:true failures:0");
  } finally {
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
      chrome?.kill();
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
