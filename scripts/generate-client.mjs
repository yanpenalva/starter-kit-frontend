import { error as logError } from "node:console";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

const contractPath = "openapi/openapi.json";

if (!existsSync(contractPath)) {
  logError(
    `Contrato aprovado ausente em ${contractPath}. Receba bundle e receipt oficiais, execute npm run contract:verify e tente novamente. Geração bloqueada.`,
  );
  process.exit(1);
}

const verification = spawnSync("python3", ["scripts/verify_contract.py"], {
  stdio: "inherit",
});

if (verification.error) {
  if (verification.error.code === "ENOENT") {
    logError(
      "[generate-client] python3 não encontrado. Instale o Python 3 para executar scripts/verify_contract.py (ex.: apk add python3 / apt install python3).",
    );
  } else {
    logError(
      `[generate-client] Erro ao executar python3: ${verification.error.message}`,
    );
  }
  process.exit(1);
}

if (verification.status !== 0) {
  const status = verification.status ?? 1;
  logError(`[generate-client] verify_contract.py falhou com status ${status}`);
  process.exit(status);
}

const orvalBin =
  process.platform === "win32" && existsSync("node_modules/.bin/orval.cmd")
    ? "node_modules/.bin/orval.cmd"
    : "node_modules/.bin/orval";

if (!existsSync(orvalBin)) {
  logError(
    `[generate-client] Binário do Orval não encontrado em "${orvalBin}". Execute "npm ci" para instalar as dependências.`,
  );
  process.exit(1);
}

const generation = spawnSync(orvalBin, ["--config", "orval.config.ts"], {
  stdio: "inherit",
});

if (generation.error) {
  if (generation.error.code === "ENOENT") {
    logError(
      `[generate-client] Falha ao executar Orval em "${orvalBin}": executável não encontrado. Execute "npm ci" para reinstalar.`,
    );
  } else {
    logError(
      `[generate-client] Erro ao executar Orval: ${generation.error.message}`,
    );
  }
  process.exit(1);
}

if (generation.status !== 0) {
  const status = generation.status ?? 1;
  logError(`[generate-client] orval falhou com status ${status}`);
  process.exit(status);
}

process.exit(0);
