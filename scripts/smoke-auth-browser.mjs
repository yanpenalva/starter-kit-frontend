import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const BASE_URL = process.env.BROWSER_SMOKE_URL ?? "http://127.0.0.1:5173";
const API_URL = (process.env.API_SMOKE_URL ?? "").replace(/\/$/, "");
const CHROME_BIN = process.env.CHROME_BIN ?? "google-chrome";
const CHROME_REMOTE_ENDPOINT = process.env.CHROME_REMOTE_ENDPOINT ?? null;
const AUTH_EMAIL = process.env.SMOKE_AUTH_EMAIL ?? null;
const AUTH_PASSWORD = process.env.SMOKE_AUTH_PASSWORD ?? null;

const failures = [];
const steps = [];
function assert(cond, msg, step) {
  if (step) steps.push({ name: step, pass: !!cond });
  if (!cond) failures.push(msg);
  console.log(`[${cond ? "PASS" : "FAIL"}] ${msg}`);
}

function fetchJson(url, options = {}) {
  return fetch(url, { signal: AbortSignal.timeout(5000), ...options }).then(
    async (res) => {
      if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
      return res.json();
    },
  );
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
        msg.error
          ? reject(new Error(JSON.stringify(msg.error)))
          : resolve(msg.result);
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
      {
        expression,
        awaitPromise: true,
        returnByValue: true,
      },
    );
    if (exceptionDetails) throw new Error(JSON.stringify(exceptionDetails));
    return result.value;
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  if (!API_URL) {
    console.error(
      "Erro: defina API_SMOKE_URL no ambiente (origem da API, ex. http://127.0.0.1:8000).",
    );
    process.exit(1);
  }
  if (!AUTH_EMAIL || !AUTH_PASSWORD) {
    console.error(
      "Erro: defina SMOKE_AUTH_EMAIL e SMOKE_AUTH_PASSWORD no ambiente.",
    );
    console.error(
      "As credenciais não devem ser embutidas no código nem logadas.",
    );
    process.exit(1);
  }

  let chrome = null;
  let profileDir = null;
  let cdp = null;
  let targetWsUrl = null;
  let targetId = null;
  let endpoint = CHROME_REMOTE_ENDPOINT;

  try {
    if (!endpoint) {
      profileDir = mkdtempSync(join(tmpdir(), "smoke-auth-browser-"));
      const port = 9339 + Math.floor(Math.random() * 500);
      endpoint = `http://127.0.0.1:${port}`;
      chrome = spawn(
        CHROME_BIN,
        [
          "--headless=new",
          "--no-sandbox",
          "--disable-gpu",
          "--remote-debugging-port=" + port,
          `--user-data-dir=${profileDir}`,
          "--window-size=1280,900",
          "about:blank",
        ],
        { stdio: "ignore" },
      );
      chrome.on("error", (e) => {
        throw new Error(`Falha ao iniciar Chrome: ${e.message}`);
      });
    }

    const version = await waitForBrowser(endpoint);
    console.log(`Browser: ${version.Browser}`);

    const target = await fetchJson(`${endpoint}/json/new?about:blank`, {
      method: "PUT",
    });
    targetId = target.id;
    targetWsUrl = target.webSocketDebuggerUrl;

    cdp = await Cdp.connect(targetWsUrl);
    await cdp.command("Page.enable");
    await cdp.command("Runtime.enable");
    await cdp.command("Network.enable");

    assert(
      await (async () => {
        await cdp.command("Page.navigate", { url: `${BASE_URL}/login` });
        await sleep(1500);
        return (await cdp.evaluate("location.pathname")) === "/login";
      })(),
      "navegou para /login",
      "navegar-login",
    );

    assert(
      await (async () => {
        await cdp.evaluate(`(async () => {
        const email = document.querySelector('#login-email');
        const pass = document.querySelector('#login-password');
        for (const [el, value] of [[email, ${JSON.stringify(AUTH_EMAIL)}], [pass, ${JSON.stringify(AUTH_PASSWORD)}]]) {
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        document.querySelector('.login-form__submit-btn').click();
      })()`);
        const deadline = Date.now() + 15000;
        while (Date.now() < deadline) {
          if ((await cdp.evaluate("location.pathname")) === "/dashboard")
            return true;
          await sleep(300);
        }
        return false;
      })(),
      "após login, URL contém /dashboard (timeout 15s)",
      "login",
    );

    assert(
      await (async () => {
        const res = await cdp.evaluate(`(async () => {
        const res = await fetch('${API_URL}/api/v1/auth/my-profile', { credentials: 'include' });
        return { status: res.status, body: await res.json() };
      })()`);
        return res.status === 200;
      })(),
      `GET ${API_URL}/api/v1/auth/my-profile retornou 200`,
      "my-profile-autenticado",
    );

    assert(
      await (async () => {
        await cdp.command("Page.reload", {});
        const deadline = Date.now() + 15000;
        while (Date.now() < deadline) {
          if ((await cdp.evaluate("location.pathname")) === "/dashboard")
            return true;
          await sleep(300);
        }
        return false;
      })(),
      "após location.reload(), permanece em /dashboard (sessão persiste)",
      "reload-persiste-sessao",
    );

    assert(
      await (async () => {
        const appeared = await (async () => {
          const deadline = Date.now() + 15000;
          while (Date.now() < deadline) {
            if (
              await cdp.evaluate(
                `!!document.querySelector('.app-navigation__logout-btn')`,
              )
            )
              return true;
            await sleep(300);
          }
          return false;
        })();
        assert(
          appeared,
          "botão .app-navigation__logout-btn apareceu após hidratação (timeout 15s)",
          "logout-btn-visivel",
        );
        if (!appeared) return false;
        await cdp.evaluate(
          `document.querySelector('.app-navigation__logout-btn').click()`,
        );
        const deadline = Date.now() + 15000;
        while (Date.now() < deadline) {
          if ((await cdp.evaluate("location.pathname")) === "/login")
            return true;
          await sleep(300);
        }
        return false;
      })(),
      "após logout via .app-navigation__logout-btn, retornou a /login (timeout 15s)",
      "logout",
    );

    assert(
      await (async () => {
        const res = await cdp.evaluate(`(async () => {
        const res = await fetch('${API_URL}/api/v1/auth/my-profile', { credentials: 'include' });
        return res.status;
      })()`);
        return res === 401;
      })(),
      `GET ${API_URL}/api/v1/auth/my-profile após logout retornou 401`,
      "my-profile-pos-logout-401",
    );
  } finally {
    if (cdp) cdp.close();
    if (targetId && endpoint) {
      try {
        await fetch(`${endpoint}/json/close/${targetId}`);
      } catch {}
    }
    if (chrome) {
      chrome.kill();
      await sleep(300);
    }
    if (profileDir) rmSync(profileDir, { recursive: true, force: true });
  }

  const ok = failures.length === 0;
  console.log(JSON.stringify({ ok, failures: failures.length, steps }));

  if (!ok) {
    console.error(
      `\nSmoke auth falhou: ${failures.length} assert(s) com falha.`,
    );
    process.exit(1);
  }
  console.log("\nSmoke auth concluído com sucesso.");
}

main().catch((e) => {
  console.error(`Erro fatal: ${e.message}`);
  process.exit(1);
});
