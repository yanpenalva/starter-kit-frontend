import { computed, ref } from "vue";
import { effectScope } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildHttpError } from "@/lib/http";
import { useFormFeedback } from "./useFormFeedback";

const validationError = (): unknown =>
  buildHttpError({
    kind: "validation",
    status: 422,
    body: {
      message: "Dados inválidos.",
      errors: { email: ["O email já está em uso."], cpf: ["CPF inválido."] },
    },
  });

const rateLimitedError = (seconds: number | null): unknown =>
  buildHttpError({
    kind: "rate_limited",
    status: 429,
    retryAfterHeader: seconds === null ? null : String(seconds),
  });

describe("useFormFeedback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("extrai erros por campo de um erro de validação", () => {
    const feedback = useFormFeedback();

    feedback.handleFailure(validationError());

    expect(feedback.fieldErrors.value).toEqual({
      email: ["O email já está em uso."],
      cpf: ["CPF inválido."],
    });
    expect(feedback.errorMessage.value).toBe("O email já está em uso.");
    expect(feedback.rateLimitSeconds.value).toBeNull();
  });

  it("inicia e decrementa a contagem regressiva em 429", () => {
    const feedback = useFormFeedback();

    feedback.handleFailure(rateLimitedError(3));

    expect(feedback.rateLimitSeconds.value).toBe(3);
    vi.advanceTimersByTime(1000);
    expect(feedback.rateLimitSeconds.value).toBe(2);
    vi.advanceTimersByTime(2000);
    expect(feedback.rateLimitSeconds.value).toBeNull();
  });

  it("registra mensagem genérica para erro sem contagem", () => {
    const feedback = useFormFeedback();

    feedback.handleFailure(rateLimitedError(null));

    expect(feedback.rateLimitSeconds.value).toBeNull();
    expect(feedback.errorMessage.value).toContain("Muitas tentativas");
  });

  it("registra mensagem para erros mapeados de status", () => {
    const feedback = useFormFeedback();

    feedback.handleFailure(buildHttpError({ kind: "not_found", status: 404 }));

    expect(feedback.errorMessage.value).toBe(
      "Não encontramos o recurso solicitado. Atualize a página e tente novamente.",
    );
    expect(feedback.fieldErrors.value).toEqual({});
  });

  it("não oferece retry para erro de validação", () => {
    const feedback = useFormFeedback();
    const operation = vi.fn().mockResolvedValue(undefined);

    feedback.handleFailure(validationError(), operation);

    expect(feedback.canRetry.value).toBe(false);
  });

  it("notifica sucesso e libera o retry pendente", () => {
    const feedback = useFormFeedback();
    const operation = vi.fn().mockRejectedValue(new Error("boom"));

    feedback.handleFailure(
      buildHttpError({ kind: "network", status: null, timedOut: false }),
      operation,
    );
    expect(feedback.canRetry.value).toBe(true);

    feedback.reportSuccess("Usuário criado.");

    expect(feedback.successMessage.value).toBe("Usuário criado.");
    expect(feedback.errorMessage.value).toBeNull();
    expect(feedback.canRetry.value).toBe(false);
  });

  it("reexecuta a operação que falhou via retry", async () => {
    const feedback = useFormFeedback();
    let attempts = 0;
    const operation = vi.fn(async () => {
      attempts += 1;
      if (attempts === 1) {
        throw buildHttpError({
          kind: "network",
          status: null,
          timedOut: false,
        });
      }
    });

    await expect(feedback.run(operation)).rejects.toBeTruthy();
    expect(feedback.canRetry.value).toBe(true);
    await feedback.retry();

    expect(operation).toHaveBeenCalledTimes(2);
    expect(feedback.errorMessage.value).toBeNull();
    expect(feedback.successMessage.value).toContain("sucesso");
  });

  it("run devolve o resultado quando a operação succeede", async () => {
    const feedback = useFormFeedback();
    const operation = vi.fn().mockResolvedValue({ id: 7 });

    expect(await feedback.run(operation)).toEqual({ id: 7 });
    expect(feedback.errorMessage.value).toBeNull();
  });

  it("limpa o feedback do formulário sem parar a contagem", () => {
    const feedback = useFormFeedback();

    feedback.handleFailure(validationError());
    feedback.handleFailure(rateLimitedError(2));
    feedback.clearFeedback();

    expect(feedback.fieldErrors.value).toEqual({});
    expect(feedback.errorMessage.value).toBeNull();
    expect(feedback.rateLimitSeconds.value).toBe(2);
  });

  it("para a contagem quando o escopo é descartado", () => {
    const scope = effectScope();
    let feedback: ReturnType<typeof useFormFeedback>;
    scope.run(() => {
      feedback = useFormFeedback();
    });

    feedback!.handleFailure(rateLimitedError(5));
    scope.stop();
    vi.advanceTimersByTime(5000);

    expect(feedback!.rateLimitSeconds.value).toBe(5);
  });

  it("expõe estado reativo compatível com computed", () => {
    const feedback = useFormFeedback();
    const summary = computed(
      () => Object.keys(feedback.fieldErrors.value).length,
    );

    feedback.handleFailure(validationError());

    expect(summary.value).toBe(2);
    expect(ref(true).value).toBe(true);
  });
});
