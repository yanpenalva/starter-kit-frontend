import { spawnSync } from "node:child_process";
import { error as logError, log as logInfo } from "node:console";
import { existsSync } from "node:fs";
import process from "node:process";

if (process.env.SKIP_CLIENT_GIT_CHECK === "1") {
  logInfo("[check-client] SKIP_CLIENT_GIT_CHECK=1 — pulando verificação git.");
  process.exit(0);
}

if (!existsSync(".git")) {
  logInfo("[check-client] Diretório .git ausente — pulando verificação git.");
  process.exit(0);
}

const outputPath = "src/lib/api/generated";
const trackedDiff = spawnSync(
  "git",
  ["diff", "--exit-code", "--", outputPath],
  { encoding: "utf8" },
);

if (trackedDiff.error) {
  if (trackedDiff.error.code === "ENOENT") {
    logInfo(
      "[check-client] Binário git não encontrado — pulando verificação git.",
    );
    process.exit(0);
  }
  logError(
    `[check-client] Erro ao executar git diff: ${trackedDiff.error.message}`,
  );
  process.exit(1);
}

const untrackedFiles = spawnSync(
  "git",
  ["ls-files", "--others", "--exclude-standard", "--", outputPath],
  { encoding: "utf8" },
);

if (untrackedFiles.error) {
  if (untrackedFiles.error.code === "ENOENT") {
    logInfo(
      "[check-client] Binário git não encontrado — pulando verificação git.",
    );
    process.exit(0);
  }
  logError(
    `[check-client] Erro ao executar git ls-files: ${untrackedFiles.error.message}`,
  );
  process.exit(1);
}

if (
  trackedDiff.status !== 0 ||
  untrackedFiles.status !== 0 ||
  untrackedFiles.stdout.trim() !== ""
) {
  logError("Client Orval gerado diverge dos arquivos revisados e pinados.");
  if (trackedDiff.stdout?.trim()) {
    logError("[check-client] Diferenças rastreadas (git diff):");
    logError(trackedDiff.stdout.trim());
  }
  if (trackedDiff.stderr?.trim()) {
    logError("[check-client] git diff stderr:");
    logError(trackedDiff.stderr.trim());
  }
  if (untrackedFiles.stdout?.trim()) {
    logError(
      "[check-client] Arquivos não rastreados encontrados (git ls-files):",
    );
    logError(untrackedFiles.stdout.trim());
  }
  if (untrackedFiles.stderr?.trim()) {
    logError("[check-client] git ls-files stderr:");
    logError(untrackedFiles.stderr.trim());
  }
  process.exit(1);
}
