export interface MockDocument extends EventTarget {
  readonly prerendering?: boolean;
}

const UNUSABLE_DOCUMENT_ERROR_PATTERN =
  /Failed to get ServiceWorkerRegistration objects|document is in an invalid state/i;

const propertyOf = (error: unknown, key: "name" | "message"): string => {
  if (typeof error !== "object" || error === null || !(key in error)) {
    return "";
  }
  const value: unknown = (error as Record<"name" | "message", unknown>)[key];
  return typeof value === "string" ? value : "";
};

export const mockErrorDetail = (error: unknown): string => {
  const message = propertyOf(error, "message");
  return message === "" ? String(error) : message;
};

export const isUnusableDocumentError = (error: unknown): boolean => {
  return (
    propertyOf(error, "name") === "InvalidStateError" ||
    UNUSABLE_DOCUMENT_ERROR_PATTERN.test(propertyOf(error, "message"))
  );
};

export const waitForActiveDocument = async (
  documentLike: MockDocument,
): Promise<void> => {
  if (documentLike.prerendering !== true) {
    return;
  }
  await new Promise<void>((resolve) => {
    documentLike.addEventListener("prerenderingchange", () => resolve(), {
      once: true,
    });
  });
};
