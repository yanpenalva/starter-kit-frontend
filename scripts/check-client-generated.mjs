import { spawnSync } from "node:child_process";
import { error as logError } from "node:console";
import process from "node:process";

const outputPath = "src/lib/api/generated";
const trackedDiff = spawnSync(
  "git",
  ["diff", "--exit-code", "--", outputPath],
  { encoding: "utf8" },
);
const untrackedFiles = spawnSync(
  "git",
  ["ls-files", "--others", "--exclude-standard", "--", outputPath],
  { encoding: "utf8" },
);

if (
  trackedDiff.status !== 0 ||
  untrackedFiles.status !== 0 ||
  untrackedFiles.stdout.trim() !== ""
) {
  logError("Client Orval gerado diverge dos arquivos revisados e pinados.");
  process.exit(1);
}
