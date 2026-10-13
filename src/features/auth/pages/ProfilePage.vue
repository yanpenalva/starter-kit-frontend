<template>
  <AppLayout>
    <div class="profile-page">
      <header class="profile-page__header">
        <p class="profile-page__eyebrow">CONTA</p>
        <h1>Minha Conta</h1>
        <p>Consulte seus dados e atualize suas credenciais.</p>
      </header>

      <section class="profile-page__card" aria-labelledby="profile-details">
        <h2 id="profile-details">Dados da conta</h2>
        <dl class="profile-page__details">
          <div>
            <dt>E-mail</dt>
            <dd>{{ user?.email ?? "—" }}</dd>
          </div>
          <div>
            <dt>Status do e-mail</dt>
            <dd>{{ isLimited ? "Pendente de verificação" : "Verificado" }}</dd>
          </div>
          <div>
            <dt>Perfis atribuídos</dt>
            <dd>{{ roles.length > 0 ? roles.join(", ") : "Nenhum" }}</dd>
          </div>
          <div>
            <dt>Permissões ativas</dt>
            <dd>
              {{ permissions.length > 0 ? permissions.join(", ") : "Nenhuma" }}
            </dd>
          </div>
        </dl>

        <form
          class="profile-page__form"
          aria-label="Atualizar nome"
          @submit.prevent="saveName"
        >
          <label for="profile-name">Nome</label>
          <input
            id="profile-name"
            v-model.trim="name"
            aria-label="Nome"
            autocomplete="name"
            maxlength="255"
            :disabled="isSavingName"
            required
            :aria-invalid="
              profileFeedback.fieldErrors.value.name?.length
                ? 'true'
                : undefined
            "
            :aria-describedby="
              profileFeedback.fieldErrors.value.name?.length
                ? 'field-error-nome'
                : undefined
            "
            @input="profileFeedback.clearFeedback"
          />
          <FieldErrors
            :errors="profileFeedback.fieldErrors.value.name ?? []"
            field-label="Nome"
          />
          <FormFeedback :feedback="profileFeedback" @retry="retryNameSave" />
          <button type="submit" :disabled="isSavingName || !name.trim()">
            {{ isSavingName ? "Salvando..." : "Salvar nome" }}
          </button>
        </form>
      </section>

      <section class="profile-page__card" aria-labelledby="password-title">
        <h2 id="password-title">Alterar senha</h2>
        <form
          class="profile-page__form"
          aria-label="Alterar senha"
          @submit.prevent="savePassword"
        >
          <label for="current-password">Senha atual</label>
          <input
            id="current-password"
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            required
            :disabled="isSavingPassword"
            :aria-invalid="
              passwordFeedback.fieldErrors.value.current_password?.length
                ? 'true'
                : undefined
            "
            :aria-describedby="
              passwordFeedback.fieldErrors.value.current_password?.length
                ? 'field-error-senha-atual'
                : undefined
            "
            @input="passwordFeedback.clearFeedback"
          />
          <FieldErrors
            :errors="passwordFeedback.fieldErrors.value.current_password ?? []"
            field-label="Senha atual"
          />

          <label for="new-password">Nova senha</label>
          <input
            id="new-password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            minlength="12"
            maxlength="255"
            required
            :disabled="isSavingPassword"
            :aria-invalid="
              passwordFeedback.fieldErrors.value.password?.length
                ? 'true'
                : undefined
            "
            :aria-describedby="
              passwordFeedback.fieldErrors.value.password?.length
                ? 'field-error-nova-senha'
                : undefined
            "
            @input="passwordFeedback.clearFeedback"
          />
          <FieldErrors
            :errors="passwordFeedback.fieldErrors.value.password ?? []"
            field-label="Nova senha"
          />

          <label for="password-confirmation">Confirmar nova senha</label>
          <input
            id="password-confirmation"
            v-model="passwordConfirmation"
            type="password"
            autocomplete="new-password"
            minlength="12"
            maxlength="255"
            required
            :disabled="isSavingPassword"
            :aria-invalid="
              passwordFeedback.fieldErrors.value.password_confirmation?.length
                ? 'true'
                : undefined
            "
            :aria-describedby="
              passwordFeedback.fieldErrors.value.password_confirmation?.length
                ? 'field-error-confirmar-nova-senha'
                : undefined
            "
            @input="passwordFeedback.clearFeedback"
          />
          <FieldErrors
            :errors="
              passwordFeedback.fieldErrors.value.password_confirmation ?? []
            "
            field-label="Confirmar nova senha"
          />

          <FormFeedback
            :feedback="passwordFeedback"
            @retry="retryPasswordChange"
          />
          <button
            type="submit"
            :disabled="
              isSavingPassword ||
              !currentPassword ||
              password.length < 12 ||
              passwordConfirmation.length < 12
            "
          >
            {{ isSavingPassword ? "Alterando..." : "Alterar senha" }}
          </button>
        </form>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import AppLayout from "@/shared/layouts/AppLayout.vue";
import FieldErrors from "@/shared/components/FieldErrors.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useSessionStore } from "@/features/auth/stores/session";
import {
  changeMyPassword,
  updateMyProfile,
} from "@/features/auth/api/auth.api";
import type {
  ChangeMyPasswordRequest,
  UpdateMyProfileRequest,
} from "@/features/auth/api/auth.types";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";

const { user, isLimited, roles, permissions } = useAuthorization();
const session = useSessionStore();
const profileFeedback = useFormFeedback();
const passwordFeedback = useFormFeedback();
const name = ref("");
const currentPassword = ref("");
const password = ref("");
const passwordConfirmation = ref("");
const isSavingName = ref(false);
const isSavingPassword = ref(false);

watch(
  user,
  (profile) => {
    name.value = profile?.name ?? "";
  },
  { immediate: true },
);

const saveName = async (): Promise<void> => {
  if (isSavingName.value || session.user === null) return;
  const payload: UpdateMyProfileRequest = { name: name.value.trim() };
  const operation = async (): Promise<void> => {
    const response = await updateMyProfile(payload);
    session.user = response.data;
  };
  isSavingName.value = true;
  try {
    await operation();
    profileFeedback.reportSuccess("Nome atualizado com sucesso.");
  } catch (error: unknown) {
    profileFeedback.handleFailure(error, operation);
  } finally {
    isSavingName.value = false;
  }
};

const retryNameSave = async (): Promise<void> => {
  if (isSavingName.value) return;
  isSavingName.value = true;
  try {
    await profileFeedback.retry();
  } finally {
    isSavingName.value = false;
  }
};

const savePassword = async (): Promise<void> => {
  if (isSavingPassword.value) return;
  const payload: ChangeMyPasswordRequest = {
    current_password: currentPassword.value,
    password: password.value,
    password_confirmation: passwordConfirmation.value,
  };
  const operation = async (): Promise<void> => {
    await changeMyPassword(payload);
    currentPassword.value = "";
    password.value = "";
    passwordConfirmation.value = "";
  };
  isSavingPassword.value = true;
  try {
    await operation();
    passwordFeedback.reportSuccess("Sua senha foi alterada com sucesso.");
  } catch (error: unknown) {
    passwordFeedback.handleFailure(error, operation);
  } finally {
    isSavingPassword.value = false;
  }
};

const retryPasswordChange = async (): Promise<void> => {
  if (isSavingPassword.value) return;
  isSavingPassword.value = true;
  try {
    await passwordFeedback.retry();
  } finally {
    isSavingPassword.value = false;
  }
};
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-page__header {
  border-bottom: 1px solid rgb(58 77 60 / 10%);
  padding-bottom: 1.5rem;
}

.profile-page__eyebrow {
  margin: 0 0 0.5rem;
  color: var(--color-evergreen, #314830);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.profile-page__header h1 {
  margin: 0 0 0.5rem;
  color: var(--color-ink, #252b25);
  font-family: var(--type-display, inherit);
  font-size: 2.25rem;
  font-weight: 400;
}

.profile-page__header p:last-child {
  margin: 0;
  color: var(--color-ink-muted, #626b61);
}

.profile-page__card {
  display: grid;
  gap: 1.25rem;
  max-width: 48rem;
  padding: 1.5rem;
  border: 1px solid rgb(58 77 60 / 12%);
  border-radius: 0.75rem;
  background: white;
}

.profile-page__card h2 {
  margin: 0;
  font-size: 1.125rem;
}

.profile-page__details {
  display: grid;
  gap: 1rem;
  margin: 0;
}

.profile-page__details div {
  display: grid;
  gap: 0.25rem;
}

.profile-page__details dt,
.profile-page__form label {
  color: var(--color-ink-muted, #626b61);
  font-size: 0.875rem;
}

.profile-page__details dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.profile-page__form {
  display: grid;
  gap: 0.5rem;
}

.profile-page__form input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: var(--color-canvas, #fff);
  color: var(--color-ink, #252b25);
  font: inherit;
}

.profile-page__form input:focus {
  outline: none;
  border-color: var(--color-evergreen, #314830);
  box-shadow: 0 0 0 3px rgb(49 72 48 / 12%);
}

.profile-page__form button {
  justify-self: start;
  margin-top: 0.5rem;
  padding: 0.625rem 1rem;
  border: 0;
  border-radius: 0.375rem;
  background: var(--color-evergreen, #314830);
  color: white;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.profile-page__form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
