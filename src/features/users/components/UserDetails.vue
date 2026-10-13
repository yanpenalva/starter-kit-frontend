<template>
  <DialogComponent
    :model-value="modelValue"
    :title="title"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p v-if="isPending" role="status">Carregando usuário...</p>
    <p v-else-if="isError" role="alert">
      Usuário não encontrado ou indisponível.
    </p>

    <template v-else-if="user">
      <q-expansion-item
        dense
        default-opened
        label="Conta"
        toggle-aria-label="Informações da conta"
      >
        <dl class="user-detail__grid">
          <div>
            <dt>Nome</dt>
            <dd data-testid="user-detail-name">{{ user.name }}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{{ user.email }}</dd>
          </div>
          <div>
            <dt>Status de verificação</dt>
            <dd>
              {{ user.email_verified_at === null ? "Pendente" : "Verificado" }}
            </dd>
          </div>
          <div>
            <dt>Status da conta</dt>
            <dd>{{ user.deactivated_at === null ? "Ativo" : "Desativado" }}</dd>
          </div>
          <div v-if="can('users.read-cpf')">
            <dt>CPF</dt>
            <dd data-testid="user-detail-cpf">
              {{ formatCpf(user.cpf ?? "") ?? "—" }}
            </dd>
          </div>
        </dl>
      </q-expansion-item>

      <q-expansion-item
        dense
        default-opened
        label="Papéis"
        toggle-aria-label="Papéis do usuário"
      >
        <p v-if="user.roles.length === 0" class="user-detail__empty">
          Nenhum papel atribuído.
        </p>
        <ul v-else class="user-detail__roles">
          <li v-for="role in user.roles" :key="role">{{ role }}</li>
        </ul>
      </q-expansion-item>
    </template>
  </DialogComponent>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DialogComponent from "@/shared/components/DialogComponent.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { formatCpf } from "@/features/users/utils/cpf-mask";
import type { AdminUser } from "@/features/users/api/users.types";

/*
 * Consulta somente leitura: recebe os dados permitidos de `useUserDetail`.
 * Sem edição aqui — a alteração continua nos fluxos existentes. O CPF segue
 * `users.read-cpf`: sem a permissão, o campo não existe nem com os grupos
 * expandidos.
 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    user: AdminUser | null;
    isPending?: boolean;
    isError?: boolean;
  }>(),
  { isPending: false, isError: false },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const { can } = useAuthorization();

const title = computed(() =>
  props.user === null
    ? "Detalhes do usuário"
    : `Detalhes de ${props.user.name}`,
);
</script>

<style scoped>
.user-detail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.75rem 1rem;
  margin: 0;
  padding: 0.5rem 0;
}

.user-detail__grid dt {
  color: var(--color-muted, #73766e);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.user-detail__grid dd {
  margin: 0.25rem 0 0;
  font-size: 0.9375rem;
  color: var(--color-ink, #252a25);
}

.user-detail__roles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0;
  padding: 0.5rem 0;
  list-style: none;
}

.user-detail__roles li,
.user-detail__empty {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background: rgb(58 77 60 / 10%);
  color: var(--color-evergreen, #314830);
  font-size: 0.75rem;
  font-weight: 600;
}

.user-detail__empty {
  margin: 0.5rem 0;
  font-weight: 500;
}
</style>
