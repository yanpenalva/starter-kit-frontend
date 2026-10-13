<template>
  <AdminPageLayout
    eyebrow="ADMINISTRAÇÃO"
    title="Detalhe do Usuário"
    help-text="Confira os dados da conta e os perfis atribuídos. As ações de edição dependem das suas permissões."
  >
    <template #subtitle>
      Detalhe e edição de um usuário. Área restrita para usuários com permissão
      {{ cataloguePermissionLabel("users.view") }}.
    </template>

    <RouterLink :to="{ name: 'users' }" class="ui-control">
      Voltar à lista de usuários
    </RouterLink>

    <p v-if="query.isPending.value" role="status">Carregando usuário...</p>
    <FormFeedback :feedback="feedback" />

    <p v-if="query.isError.value" role="alert">
      Usuário não encontrado ou indisponível.
    </p>

    <div v-if="user" class="detail">
      <dl class="detail-meta" aria-label="Informações da conta">
        <div>
          <dt>Nome</dt>
          <dd data-testid="user-name">{{ user.name }}</dd>
        </div>
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
          <dt>Perfis</dt>
          <dd>
            <span v-if="user.roles.length === 0">Nenhum</span>
            <span v-for="role in user.roles" :key="role" class="pill">
              {{ roleLabel(role) }}
            </span>
          </dd>
        </div>
      </dl>

      <div class="detail-actions">
        <button
          v-if="can('users.update')"
          type="button"
          class="ui-control ui-control--primary"
          data-testid="edit-user"
          @click="editOpen = true"
        >
          Editar usuário
        </button>
      </div>
    </div>

    <UserEditForm
      :model-value="editOpen"
      :user="user"
      @update:model-value="closeEdit"
      @profile-saved="handleProfileSaved"
      @roles-saved="handleRolesSaved"
    />
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import AdminPageLayout from "@/shared/components/AdminPageLayout.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { useUserDetail } from "@/features/users/composables/useUsersList";
import { formatCpf } from "@/features/users/utils/cpf-mask";
import UserEditForm from "@/features/users/components/UserEditForm.vue";
import type { AdminUser } from "@/features/users/api/users.types";
import { roleLabel } from "@/shared/utils/role-labels";
import { cataloguePermissionLabel } from "@/shared/types/contract";

const route = useRoute();
const { can } = useAuthorization();
const feedback = useFormFeedback();

const userId = computed(() => {
  const raw = route.params.userId;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
});

const query = useUserDetail(() => userId.value);

const user = computed<AdminUser | null>(() => query.data.value?.data ?? null);

const editOpen = ref(false);

const closeEdit = (value: boolean): void => {
  if (!value) editOpen.value = false;
};

const handleProfileSaved = (): void => {
  editOpen.value = false;
  feedback.reportSuccess("Usuário atualizado com sucesso.");
};
const handleRolesSaved = (): void => {
  editOpen.value = false;
  feedback.reportSuccess("Perfis atualizados com sucesso.");
};
</script>

<style scoped>
.detail {
  display: grid;
  gap: 1.5rem;
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
  color: var(--color-evergreen, #456b56);
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
