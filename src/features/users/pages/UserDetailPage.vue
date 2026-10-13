<template>
  <AdminPageLayout eyebrow="ADMINISTRAÇÃO" title="Detalhe do Usuário">
    <template #subtitle>
      Detalhe e edição de um usuário. Área restrita para usuários com permissão
      <code>users.view</code>.
    </template>

    <p v-if="query.isPending.value" role="status">Carregando usuário...</p>
    <FormFeedback :feedback="feedback" @retry="feedback.retry" />

    <p v-if="query.isError.value" role="alert">
      Usuário não encontrado ou indisponível.
    </p>

    <form
      v-if="user"
      class="detail-form"
      aria-label="Editar usuário"
      @submit.prevent="saveEdits"
    >
      <div class="detail-grid">
        <label>
          Nome
          <input
            v-model="form.name"
            data-testid="edit-name"
            aria-label="Nome do usuário"
            required
          />
        </label>
        <label>
          Email
          <input
            v-model="form.email"
            data-testid="edit-email"
            aria-label="Email do usuário"
            type="email"
            required
          />
          <FieldErrors
            :errors="feedback.fieldErrors.value.email ?? []"
            field-label="Email do usuário"
          />
        </label>
        <label v-if="can('users.read-cpf')">
          CPF
          <input
            v-model="form.cpf"
            data-testid="edit-cpf"
            aria-label="CPF do usuário"
            inputmode="numeric"
            maxlength="14"
          />
          <FieldErrors
            :errors="feedback.fieldErrors.value.cpf ?? []"
            field-label="CPF do usuário"
          />
        </label>
      </div>

      <dl class="detail-meta" aria-label="Informações da conta">
        <div>
          <dt>Email</dt>
          <dd data-testid="user-email">{{ user.email }}</dd>
        </div>
        <div>
          <dt>Status de verificação</dt>
          <dd>
            <span
              data-testid="user-verified"
              class="pill"
              :class="
                user.email_verified_at === null ? 'pill--warn' : 'pill--ok'
              "
            >
              {{ user.email_verified_at === null ? "Pendente" : "Verificado" }}
            </span>
          </dd>
        </div>
        <div v-if="can('users.read-cpf')">
          <dt>CPF</dt>
          <dd data-testid="user-cpf">{{ formatCpf(user.cpf ?? "") ?? "—" }}</dd>
        </div>
        <div>
          <dt>Status da conta</dt>
          <dd>
            <span
              class="pill"
              :class="user.deactivated_at === null ? 'pill--ok' : 'pill--warn'"
            >
              {{ user.deactivated_at === null ? "Ativo" : "Desativado" }}
            </span>
          </dd>
        </div>
        <div>
          <dt>Papéis</dt>
          <dd>
            <span v-if="user.roles.length === 0">Nenhum</span>
            <span v-for="role in user.roles" :key="role" class="pill">
              {{ role }}
            </span>
          </dd>
        </div>
      </dl>

      <div class="detail-actions">
        <button
          v-if="can('users.update')"
          type="submit"
          data-testid="save-user"
          :disabled="isSaving || !isDirty"
        >
          {{ isSaving ? "Salvando..." : "Salvar alterações" }}
        </button>
        <button
          type="button"
          data-testid="cancel-edit"
          :disabled="isSaving"
          @click="resetForm"
        >
          Cancelar
        </button>
      </div>
    </form>
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, watch } from "vue";
import { useRoute } from "vue-router";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import FieldErrors from "@/shared/components/FieldErrors.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import {
  useUserDetail,
  useUsersList,
} from "@/features/users/composables/useUsersList";
import { formatCpf } from "@/features/users/utils/cpf-mask";
import type { AdminUser } from "@/features/users/api/users.types";

const route = useRoute();
const { can } = useAuthorization();
const feedback = useFormFeedback();
const { updateMutation } = useUsersList();

const userId = computed(() => {
  const raw = route.params.userId;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
});

const query = useUserDetail(() => userId.value);

const user = computed<AdminUser | null>(() => query.data.value?.data ?? null);

const form = reactive({ name: "", email: "", cpf: "" });
const saved = reactive({ name: "", email: "", cpf: "" });

const isDirty = computed(
  () =>
    form.name !== saved.name ||
    form.email !== saved.email ||
    form.cpf !== saved.cpf,
);

watch(
  user,
  (value) => {
    if (value === null) return;
    form.name = value.name;
    form.email = value.email;
    form.cpf = formatCpf(value.cpf ?? "") ?? "";
    saved.name = form.name;
    saved.email = form.email;
    saved.cpf = form.cpf;
  },
  { immediate: true },
);

const resetForm = (): void => {
  form.name = saved.name;
  form.email = saved.email;
  form.cpf = saved.cpf;
  feedback.clearFeedback();
};

const saveEdits = async (): Promise<void> => {
  if (userId.value === null || isSaving.value || !can("users.update")) return;
  const payload: { name?: string; email?: string; cpf?: string | null } = {};
  if (form.name !== saved.name) payload.name = form.name;
  if (form.email !== saved.email) payload.email = form.email;
  if (form.cpf !== saved.cpf) {
    payload.cpf = form.cpf === "" ? null : form.cpf;
  }
  if (Object.keys(payload).length === 0) return;
  try {
    await updateMutation.mutateAsync({ userId: userId.value, payload });
    feedback.reportSuccess("Usuário atualizado com sucesso.");
  } catch (error: unknown) {
    feedback.handleFailure(error);
  }
};

const isSaving = computed(() => updateMutation.isPending.value);

const beforeWindowUnload = (event: BeforeUnloadEvent): void => {
  if (!isDirty.value) return;
  if (!globalThis.confirm("Há alterações não salvas. Sair mesmo assim?")) {
    event.preventDefault();
  }
};

onMounted(() => {
  window.addEventListener("beforeunload", beforeWindowUnload);
});
onUnmounted(() => {
  window.removeEventListener("beforeunload", beforeWindowUnload);
});

defineExpose({ beforeWindowUnload });
</script>

<style scoped>
.detail-form {
  display: grid;
  gap: 1.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.375rem;
  font-size: 0.875rem;
}

input,
button {
  min-height: 2.25rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: white;
  color: var(--color-ink, #252b25);
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.detail-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 1rem;
  border: 1px solid rgb(58 77 60 / 10%);
  border-radius: 0.375rem;
  background: rgb(58 77 60 / 3%);
}

.detail-meta dt {
  color: var(--color-muted, #666);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-meta dd {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0.25rem 0 0;
  font-size: 0.9375rem;
}

.pill {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background: rgb(58 77 60 / 10%);
  color: var(--color-evergreen, #314830);
  font-size: 0.75rem;
  font-weight: 600;
}

.pill--ok {
  background: #ecfdf5;
  color: #065f46;
}

.pill--warn {
  background: #fef3c7;
  color: #b45309;
}

.detail-actions {
  display: flex;
  gap: 0.75rem;
}
</style>
