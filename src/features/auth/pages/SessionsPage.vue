<template>
  <AdminPageLayout
    eyebrow="SEGURANÇA DA CONTA"
    title="Sessões ativas"
    help-text="Revise os dispositivos conectados e encerre uma sessão que você não reconhece."
  >
    <template #subtitle>
      Confira onde sua conta está conectada e encerre acessos que não reconhece.
    </template>

    <p v-if="query.isPending.value" role="status">Carregando sessões...</p>
    <FormFeedback :feedback="feedback" @retry="feedback.retry" />

    <section
      v-if="query.data.value"
      aria-label="Sessões da conta"
      :aria-busy="revokeMutation.isPending.value"
    >
      <p v-if="query.data.value.length === 0" class="empty-state">
        Nenhuma sessão ativa encontrada.
      </p>

      <article
        v-if="currentSession"
        class="session-card session-card--current"
        aria-label="Sessão atual"
      >
        <div class="session-card__heading">
          <h2>Sessão atual</h2>
          <span class="session-badge">Este dispositivo</span>
        </div>
        <dl class="session-details">
          <div>
            <dt>Navegador e dispositivo</dt>
            <dd>{{ currentSession.user_agent ?? "Não informado" }}</dd>
          </div>
          <div>
            <dt>Endereço IP</dt>
            <dd>{{ currentSession.ip_address ?? "Não informado" }}</dd>
          </div>
          <div>
            <dt>Última atividade</dt>
            <dd>{{ formatDate(currentSession.last_activity) }}</dd>
          </div>
        </dl>
      </article>

      <div v-if="otherSessions.length > 0" class="other-sessions">
        <div class="other-sessions__heading">
          <h2>Outras sessões</h2>
          <button
            type="button"
            :disabled="revokeMutation.isPending.value"
            @click="endOtherSessions"
          >
            {{
              pendingAction?.type === "others"
                ? "Encerrando sessões..."
                : "Encerrar outras sessões"
            }}
          </button>
        </div>

        <article
          v-for="session in otherSessions"
          :key="session.id"
          class="session-card"
        >
          <h3>Sessão em outro dispositivo</h3>
          <dl class="session-details">
            <div>
              <dt>Navegador e dispositivo</dt>
              <dd>{{ session.user_agent ?? "Não informado" }}</dd>
            </div>
            <div>
              <dt>Endereço IP</dt>
              <dd>{{ session.ip_address ?? "Não informado" }}</dd>
            </div>
            <div>
              <dt>Última atividade</dt>
              <dd>{{ formatDate(session.last_activity) }}</dd>
            </div>
          </dl>
          <button
            type="button"
            :aria-label="`Encerrar sessão ${session.id}`"
            :disabled="revokeMutation.isPending.value"
            @click="endSession(session)"
          >
            {{
              pendingAction?.type === "session" &&
              pendingAction.id === session.id
                ? "Encerrando..."
                : "Encerrar sessão"
            }}
          </button>
        </article>
      </div>
    </section>
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import {
  listActiveSessions,
  revokeOtherSessions,
  revokeSession,
} from "@/features/auth/api/sessions.api";
import type { ActiveSession } from "@/features/auth/api/sessions.api";

const ACTIVE_SESSIONS_QUERY_KEY = ["auth", "sessions"] as const;
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});
type RevokeAction = { type: "session"; id: string } | { type: "others" };

const feedback = useFormFeedback();
const client = useQueryClient();
const query = useQuery({
  queryKey: ACTIVE_SESSIONS_QUERY_KEY,
  queryFn: listActiveSessions,
});
const currentSession = computed(
  () => query.data.value?.find((session) => session.is_current) ?? null,
);
const otherSessions = computed(
  () => query.data.value?.filter((session) => !session.is_current) ?? [],
);
const pendingAction = ref<RevokeAction | null>(null);
const revokeMutation = useMutation({
  mutationFn: (action: RevokeAction) =>
    action.type === "others" ? revokeOtherSessions() : revokeSession(action.id),
  onMutate: () => feedback.clearFeedback(),
  onSuccess: (_result, action) => {
    feedback.reportSuccess(
      action.type === "others"
        ? "As outras sessões foram encerradas."
        : "Sessão encerrada.",
    );
    return client.invalidateQueries({ queryKey: ACTIVE_SESSIONS_QUERY_KEY });
  },
  onError: (error: unknown) => feedback.handleFailure(error),
  onSettled: () => {
    pendingAction.value = null;
  },
});

const retryLoading = async (): Promise<void> => {
  const result = await query.refetch();
  if (result.error !== null) {
    throw result.error;
  }
};
watch(query.error, (error) => {
  if (error !== null && query.isError.value) {
    feedback.handleFailure(error, retryLoading);
  }
});

const endSession = (session: ActiveSession): void => {
  if (
    session.is_current ||
    !window.confirm(
      "Deseja encerrar esta sessão? Será necessário entrar novamente nesse dispositivo.",
    )
  ) {
    return;
  }
  pendingAction.value = { type: "session", id: session.id };
  revokeMutation.mutate(pendingAction.value);
};

const endOtherSessions = (): void => {
  if (
    otherSessions.value.length === 0 ||
    !window.confirm("Deseja encerrar todas as sessões nos outros dispositivos?")
  ) {
    return;
  }
  pendingAction.value = { type: "others" };
  revokeMutation.mutate(pendingAction.value);
};

const formatDate = (value: string | null): string => {
  const timestamp = value === null ? Number.NaN : Date.parse(value);
  return Number.isFinite(timestamp)
    ? dateFormatter.format(timestamp)
    : "Não disponível";
};
</script>

<style scoped>
.empty-state {
  padding: 1rem;
  border: 1px dashed rgb(58 77 60 / 25%);
  border-radius: 0.5rem;
  color: var(--color-muted, #666);
}

.other-sessions {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.other-sessions__heading,
.session-card__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.other-sessions__heading h2,
.session-card h2,
.session-card h3 {
  margin: 0;
  color: var(--color-ink, #252b25);
  font-family: var(--type-display, inherit);
  font-size: 1.125rem;
  font-weight: 400;
}

.session-card {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid rgb(58 77 60 / 15%);
  border-radius: 0.5rem;
  background: white;
}

.session-card--current {
  border-color: rgb(58 77 60 / 45%);
  background: rgb(58 77 60 / 4%);
}

.session-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  background: rgb(58 77 60 / 12%);
  color: var(--color-ink, #252b25);
  font-size: 0.8125rem;
  font-weight: 600;
}

.session-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  gap: 0.75rem 1rem;
  margin: 0;
}

.session-details div {
  min-width: 0;
}

.session-details dt {
  margin-bottom: 0.25rem;
  color: var(--color-muted, #666);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.session-details dd {
  overflow-wrap: anywhere;
  margin: 0;
  color: var(--color-ink, #252b25);
  font-size: 0.9375rem;
}

button {
  min-height: 2.25rem;
  justify-self: start;
  padding: 0.375rem 0.75rem;
  border: 1px solid rgb(58 77 60 / 25%);
  border-radius: 0.375rem;
  background: white;
  color: var(--color-ink, #252b25);
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
</style>
