import { error as logErrorLine, log as logInfo } from "node:console";
import { existsSync } from "node:fs";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const DEV_MOCK_DEPENDENCIES = [
  { specifier: "@mswjs/interceptors", importedBy: "src/mocks/in-page-mock.ts" },
  { specifier: "axios", importedBy: "src/lib/http/client.ts" },
  { specifier: "msw", importedBy: "src/mocks/browser.ts" },
  { specifier: "vue", importedBy: "src/main.ts" },
];

const resolveFromScript = (specifier) => import.meta.resolve(specifier);

const toFilePath = (resolved) => {
  if (typeof resolved !== "string" || resolved === "") {
    return null;
  }
  try {
    return fileURLToPath(resolved);
  } catch {
    return null;
  }
};

export const checkDevMockDependencies = ({
  dependencies = DEV_MOCK_DEPENDENCIES,
  resolve = resolveFromScript,
  fileExists = existsSync,
} = {}) => {
  const problems = [];
  for (const { specifier, importedBy } of dependencies) {
    let resolved;
    try {
      resolved = resolve(specifier);
    } catch {
      problems.push({ specifier, importedBy, reason: "unresolved" });
      continue;
    }
    const filePath = toFilePath(resolved);
    if (filePath === null) {
      problems.push({ specifier, importedBy, reason: "unresolved" });
      continue;
    }
    if (!fileExists(filePath)) {
      problems.push({
        specifier,
        importedBy,
        reason: "missing-file",
        resolved,
      });
    }
  }
  return problems;
};

const describeProblem = ({ specifier, importedBy, reason, resolved }) => {
  if (reason === "missing-file") {
    return `  - ${specifier}: arquivo ausente em ${resolved} (importado por ${importedBy})`;
  }
  return `  - ${specifier}: não resolvido em node_modules (importado por ${importedBy})`;
};

export const formatDevMockDependencyReport = (problems) => {
  const [first] = problems;
  const names = problems.map((problem) => problem.specifier).join(", ");
  return [
    `[check-dev-deps] Modo mock indisponível: ${names} — instalação de dependências ausente ou incompleta.`,
    "",
    "Detalhes:",
    ...problems.map(describeProblem),
    "",
    "É um problema de instalação, não de código: sem node_modules completo o Vite",
    `para com 'Failed to resolve import "${first.specifier}" from "${first.importedBy}"'.`,
    "",
    "Na raiz do projeto, com o Node 24.15.0 do .nvmrc:",
    "",
    "  nvm use",
    "  npm ci",
    "",
    "Sem nvm, use o Node pinado direto:",
    "",
    "  PATH=/opt/data/node24/bin:$PATH npm ci",
    "",
    "npm ci instala a árvore exata do package-lock.json; npm install não serve para instalação limpa.",
  ].join("\n");
};

export const runDevMockDependencyCheck = ({
  inspect = checkDevMockDependencies,
  log = logInfo,
  logError = logErrorLine,
  exit = (code) => process.exit(code),
} = {}) => {
  const problems = inspect();
  if (problems.length === 0) {
    const names = DEV_MOCK_DEPENDENCIES.map(
      (dependency) => dependency.specifier,
    ).join(", ");
    log(
      `[check-dev-deps] Dependências do modo mock resolvidas em node_modules: ${names}.`,
    );
    return 0;
  }
  logError(formatDevMockDependencyReport(problems));
  exit(1);
  return 1;
};

const isDirectRun = () => {
  const entry = process.argv[1];
  return (
    typeof entry === "string" && pathToFileURL(entry).href === import.meta.url
  );
};

if (isDirectRun()) {
  runDevMockDependencyCheck();
}
