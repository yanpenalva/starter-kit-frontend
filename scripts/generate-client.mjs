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
if (verification.status !== 0) {
  process.exit(verification.status ?? 1);
}

const generation = spawnSync(
  process.execPath,
  ["node_modules/orval/dist/bin/orval.mjs", "--config", "orval.config.ts"],
  { stdio: "inherit" },
);
process.exitCode = generation.status ?? 1;
