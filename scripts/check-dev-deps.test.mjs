import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { describe, expect, it, vi } from "vitest";
import {
  checkDevMockDependencies,
  DEV_MOCK_DEPENDENCIES,
  formatDevMockDependencyReport,
  runDevMockDependencyCheck,
} from "./check-dev-deps.mjs";

const projectRoot = process.cwd();
const scriptPath = join(projectRoot, "scripts", "check-dev-deps.mjs");

const resolvedUrl = (specifier) =>
  `file:///deps/${specifier.replace("/", "-")}/index.js`;

const createResolver =
  (unresolved = []) =>
  (specifier) => {
    if (unresolved.includes(specifier)) {
      const error = new Error(`Cannot find package '${specifier}'`);
      error.code = "ERR_MODULE_NOT_FOUND";
      throw error;
    }
    return resolvedUrl(specifier);
  };

const unresolvedProblems = [
  {
    specifier: "@mswjs/interceptors",
    importedBy: "src/mocks/in-page-mock.ts",
    reason: "unresolved",
  },
  {
    specifier: "axios",
    importedBy: "src/lib/http/client.ts",
    reason: "unresolved",
  },
  {
    specifier: "msw",
    importedBy: "src/mocks/browser.ts",
    reason: "unresolved",
  },
  { specifier: "vue", importedBy: "src/main.ts", reason: "unresolved" },
];

const runWith = (problems, { log, logError, exit } = {}) => {
  const spies = {
    log: log ?? vi.fn(),
    logError: logError ?? vi.fn(),
    exit: exit ?? vi.fn(),
  };
  const status = runDevMockDependencyCheck({
    inspect: () => problems,
    ...spies,
  });
  return { ...spies, status };
};

describe("checkDevMockDependencies", () => {
  it("reports nothing when every dependency resolves to an existing file", () => {
    const problems = checkDevMockDependencies({
      resolve: createResolver(),
      fileExists: () => true,
    });

    expect(problems).toEqual([]);
  });

  it("uses the pinned dev:mock dependencies by default", () => {
    const resolve = vi.fn(createResolver());

    checkDevMockDependencies({ resolve, fileExists: () => true });

    expect(
      DEV_MOCK_DEPENDENCIES.map((dependency) => dependency.specifier),
    ).toEqual(["@mswjs/interceptors", "axios", "msw", "vue"]);
    expect(resolve.mock.calls.map(([specifier]) => specifier)).toEqual([
      "@mswjs/interceptors",
      "axios",
      "msw",
      "vue",
    ]);
  });

  it("reports specifier, importing file and reason per dependency", () => {
    const problems = checkDevMockDependencies({
      resolve: createResolver(["@mswjs/interceptors", "axios", "msw", "vue"]),
      fileExists: () => true,
    });

    expect(problems).toEqual(unresolvedProblems);
  });

  it("keeps checking after a failure instead of stopping at the first", () => {
    const problems = checkDevMockDependencies({
      resolve: createResolver(["axios", "vue"]),
      fileExists: () => true,
    });

    expect(problems).toEqual([unresolvedProblems[1], unresolvedProblems[3]]);
  });

  it("reports a missing file when the package resolves to an absent path", () => {
    const problems = checkDevMockDependencies({
      dependencies: [
        { specifier: "axios", importedBy: "src/lib/http/client.ts" },
      ],
      resolve: createResolver(),
      fileExists: () => false,
    });

    expect(problems).toEqual([
      {
        specifier: "axios",
        importedBy: "src/lib/http/client.ts",
        reason: "missing-file",
        resolved: resolvedUrl("axios"),
      },
    ]);
  });

  it("treats an unexpected resolver failure as an install problem", () => {
    const problems = checkDevMockDependencies({
      dependencies: [{ specifier: "vue", importedBy: "src/main.ts" }],
      resolve: () => {
        throw new TypeError("import.meta.resolve is not available");
      },
      fileExists: () => true,
    });

    expect(problems).toEqual([
      { specifier: "vue", importedBy: "src/main.ts", reason: "unresolved" },
    ]);
  });
});

describe("formatDevMockDependencyReport", () => {
  it("lists every problem with the file that imports it", () => {
    const report = formatDevMockDependencyReport(unresolvedProblems);

    expect(report).toContain("axios");
    expect(report).toContain("src/lib/http/client.ts");
    expect(report).toContain("msw");
    expect(report).toContain("src/mocks/browser.ts");
    expect(report).toContain("vue");
    expect(report).toContain("src/main.ts");
  });

  it("names the resolved-but-absent file when that is the reason", () => {
    const report = formatDevMockDependencyReport([
      {
        specifier: "axios",
        importedBy: "src/lib/http/client.ts",
        reason: "missing-file",
        resolved: "file:///deps/axios/index.js",
      },
    ]);

    expect(report).toContain("file:///deps/axios/index.js");
    expect(report).toContain("instalação");
  });

  it("points to npm ci with the pinned Node 24.15.0", () => {
    const report = formatDevMockDependencyReport(unresolvedProblems);

    expect(report).toContain("npm ci");
    expect(report).toContain("nvm use");
    expect(report).toContain("24.15.0");
    expect(report).toContain("PATH=/opt/data/node24/bin");
  });

  it("quotes the Vite error signature for the first missing dependency", () => {
    const report = formatDevMockDependencyReport([
      unresolvedProblems[0],
      unresolvedProblems[1],
    ]);

    expect(report).toContain(
      'Failed to resolve import "@mswjs/interceptors" from "src/mocks/in-page-mock.ts"',
    );
  });

  it("quotes the first problem even when only another dependency is broken", () => {
    const report = formatDevMockDependencyReport([unresolvedProblems[3]]);

    expect(report).toContain(
      'Failed to resolve import "vue" from "src/main.ts"',
    );
    expect(report).not.toContain('"axios"');
  });
});

describe("runDevMockDependencyCheck", () => {
  it("reports the resolved dependencies and continues", () => {
    const { log, logError, exit, status } = runWith([]);

    expect(status).toBe(0);
    expect(logError).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
    expect(log.mock.calls[0][0]).toContain("axios, msw, vue");
  });

  it("prints the report and exits with code 1 when something is missing", () => {
    const { log, logError, exit, status } = runWith(unresolvedProblems);

    expect(status).toBe(1);
    expect(log).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
    expect(logError.mock.calls[0][0]).toContain("npm ci");
    expect(logError.mock.calls[0][0]).toContain("axios");
  });
});

describe("dev:mock wiring", () => {
  const packageJson = JSON.parse(
    readFileSync(join(projectRoot, "package.json"), "utf8"),
  );

  it("runs the dependency check before dev:mock", () => {
    expect(packageJson.scripts["predev:mock"]).toBe(
      "node scripts/check-dev-deps.mjs",
    );
  });

  it("keeps dev:mock itself a plain Vite run with the mock flag", () => {
    expect(packageJson.scripts["dev:mock"]).toBe("VITE_MOCK_API=1 vite");
  });

  it("ships the script the predev:mock hook calls", () => {
    expect(existsSync(scriptPath)).toBe(true);
  });
});
