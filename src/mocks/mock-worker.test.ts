import { describe, expect, it } from "vitest";
import {
  isUnusableDocumentError,
  mockErrorDetail,
  waitForActiveDocument,
} from "./mock-worker";
import type { MockDocument } from "./mock-worker";

const serviceWorkerUnavailableError = (): Error =>
  new Error(
    "Failed to get ServiceWorkerRegistration objects: The document is in an invalid state.",
  );

describe("isUnusableDocumentError", () => {
  it.each([
    {
      label: "InvalidStateError",
      error: Object.assign(new Error("qualquer falha"), {
        name: "InvalidStateError",
      }),
      expected: true,
    },
    {
      label: "mensagem do getRegistrations",
      error: serviceWorkerUnavailableError(),
      expected: true,
    },
    {
      label: "mensagem sem prefixo",
      error: new Error("The document is in an invalid state."),
      expected: true,
    },
    {
      label: "objeto com name e message sem ser Error",
      error: {
        name: "InvalidStateError",
        message: "Failed to get ServiceWorkerRegistration objects.",
      },
      expected: true,
    },
    {
      label: "script do worker ausente",
      error: new Error(
        "Failed to register the Service Worker:\n\nService Worker script does not exist at the given path.",
      ),
      expected: false,
    },
    {
      label: "erro comum",
      error: new Error("qualquer falha"),
      expected: false,
    },
  ])("classifica $label", ({ error, expected }) => {
    expect(isUnusableDocumentError(error)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "Failed to get ServiceWorkerRegistration objects.",
  ])("ignora valor que não é erro (%s)", (error) => {
    expect(isUnusableDocumentError(error)).toBe(false);
  });
});

describe("mockErrorDetail", () => {
  it("usa a mensagem de um Error", () => {
    expect(mockErrorDetail(new Error("falha detalhada"))).toBe(
      "falha detalhada",
    );
  });

  it("usa a mensagem de um erro da plataforma sem ser Error", () => {
    expect(
      mockErrorDetail({
        name: "InvalidStateError",
        message: "The document is in an invalid state.",
      }),
    ).toBe("The document is in an invalid state.");
  });

  it("converte valores sem mensagem", () => {
    expect(mockErrorDetail("falha")).toBe("falha");
  });
});

describe("waitForActiveDocument", () => {
  const createDocumentLike = (prerendering: boolean): MockDocument =>
    Object.assign(new EventTarget(), { prerendering });

  it("resolve de imediato quando não há pré-render", async () => {
    await expect(
      waitForActiveDocument(createDocumentLike(false)),
    ).resolves.toBeUndefined();
  });

  it("espera prerenderingchange durante o pré-render", async () => {
    const documentLike = createDocumentLike(true);
    let settled = false;
    const pending = waitForActiveDocument(documentLike).then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    documentLike.dispatchEvent(new Event("prerenderingchange"));
    await pending;
    expect(settled).toBe(true);
  });
});
