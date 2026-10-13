<template>
  <DialogComponent
    :model-value="modelValue"
    :title="title"
    @update:model-value="handleDialogVisibility"
  >
    <template v-if="role">
      <p class="role-detail__name" data-testid="role-detail-name">
        {{ roleLabel(role.name) }}
      </p>
      <p v-if="isRoleImmutable(role)" role="note" class="role-detail__notice">
        Perfil Administrador protegido: não pode ser renomeado, excluído nem ter
        permissões alteradas.
      </p>
      <p
        v-if="!isRoleImmutable(role) && isRoleNameReserved(role)"
        role="note"
        class="role-detail__notice"
      >
        O nome Usuário é reservado e não pode ser renomeado.
      </p>
      <p
        v-if="
          !isRoleImmutable(role) &&
          !isRoleNameReserved(role) &&
          !can('roles.manage')
        "
        role="note"
        class="role-detail__notice"
      >
        A permissão {{ cataloguePermissionLabel("roles.manage") }} é necessária
        para renomear este perfil.
      </p>

      <form
        v-if="canRename"
        :id="formId"
        class="role-detail__rename"
        aria-label="Renomear perfil"
        @submit.prevent="submitRename"
      >
        <label>
          Nome do perfil
          <input v-model="name" aria-label="Novo nome do perfil" required />
          <FieldErrors
            :errors="feedback.fieldErrors.value.name ?? []"
            field-label="Nome do perfil"
          />
        </label>
      </form>

      <FormFeedback :feedback="feedback" />

      <q-expansion-item
        v-for="group in PERMISSION_GROUPS"
        :key="group.id"
        group="role-permissions"
        :default-opened="group.id === PERMISSION_GROUPS[0]?.id"
        dense
        :label="group.label"
        :caption="`${grantedCount(group)} permissões`"
        :toggle-aria-label="`Permissões do grupo ${group.label}`"
      >
        <ul class="role-detail__permissions">
          <li
            v-for="permission in group.permissions.filter(isGranted)"
            :key="permission"
            class="role-detail__permission"
            :class="{
              'role-detail__permission--granted': isGranted(permission),
            }"
          >
            <span>{{ CATALOGUE_PERMISSION_LABELS[permission] }}</span>
          </li>
        </ul>
      </q-expansion-item>
    </template>

    <template #actions>
      <button
        type="button"
        class="ui-control"
        data-testid="close-role-details"
        :disabled="isPending"
        @click="requestClose"
      >
        Fechar
      </button>
      <button
        v-if="canRename"
        type="submit"
        class="ui-control ui-control--primary"
        data-testid="rename-role"
        :form="formId"
        :disabled="isPending || !isDirty"
      >
        {{ isPending ? "Salvando nome..." : "Salvar nome" }}
      </button>
    </template>
  </DialogComponent>
  <ConfirmDialog
    :model-value="confirmOpen"
    title="Descartar alterações"
    :message="dismissMessage"
    confirm-label="Descartar alterações"
    :busy="isPending"
    @update:model-value="cancelDismiss"
    @confirm="confirmDismiss"
  />
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import DialogComponent from "@/shared/components/DialogComponent.vue";
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue";
import FieldErrors from "@/shared/components/FieldErrors.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useRoleMutations } from "@/features/roles/composables/useRolesList";
import {
  PERMISSION_GROUPS,
  type PermissionGroup,
} from "@/features/roles/permission-groups";
import {
  isRoleImmutable,
  isRoleNameReserved,
} from "@/features/roles/api/roles.types";
import type { AdminRole } from "@/features/roles/api/roles.types";
import {
  CATALOGUE_PERMISSION_LABELS,
  cataloguePermissionLabel,
  type CataloguePermission,
} from "@/shared/types/contract";
import { useFormDismissGuard } from "@/shared/composables/useFormDismissGuard";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { roleLabel } from "@/shared/utils/role-labels";

const props = defineProps<{
  modelValue: boolean;
  role: AdminRole | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  renamed: [role: AdminRole];
}>();

const { can } = useAuthorization();
const { renameMutation } = useRoleMutations();
const feedback = useFormFeedback();
const formId = `role-rename-${useId()}`;
const name = ref("");
const savedName = ref("");

const isPending = computed(() => renameMutation.isPending.value);
const canRename = computed(
  () =>
    props.role !== null &&
    !isRoleNameReserved(props.role) &&
    can("roles.manage"),
);
const isDirty = computed(() => name.value !== savedName.value);
const title = computed(() =>
  props.role === null
    ? "Detalhes do perfil"
    : `Detalhes do perfil ${roleLabel(props.role.name)}`,
);

const reset = (): void => {
  name.value = props.role?.name ?? "";
  savedName.value = name.value;
  feedback.clearFeedback();
};

const {
  confirmOpen,
  message: dismissMessage,
  requestDismiss,
  confirmDismiss,
  cancelDismiss,
} = useFormDismissGuard({
  isDirty: () => isDirty.value,
  isPending: () => isPending.value,
  message: "Há alterações não salvas. Descartar as mudanças?",
});

watch(
  [() => props.modelValue, () => props.role?.id],
  ([open]) => {
    if (open) reset();
  },
  { immediate: true },
);

const requestClose = (): void => {
  requestDismiss(() => {
    reset();
    emit("update:modelValue", false);
  });
};

const handleDialogVisibility = (value: boolean): void => {
  if (!value) requestClose();
};

const isGranted = (permission: CataloguePermission): boolean =>
  props.role?.permissions.includes(permission) ?? false;

const grantedCount = (group: PermissionGroup): number =>
  group.permissions.filter((permission) => isGranted(permission)).length;

const submitRename = async (): Promise<void> => {
  const role = props.role;
  if (role === null || !canRename.value || isPending.value || !isDirty.value) {
    return;
  }
  try {
    const response = await renameMutation.mutateAsync({
      roleId: role.id,
      name: name.value,
    });
    name.value = response.data.name;
    savedName.value = response.data.name;
    feedback.reportSuccess("Perfil renomeado com sucesso.");
    emit("renamed", response.data);
  } catch (error: unknown) {
    feedback.handleFailure(error);
  }
};
</script>

<style scoped>
.role-detail__name {
  margin: 0;
  font-family: var(--type-display, inherit);
  font-size: 1.125rem;
  color: var(--color-ink, #252a25);
}

.role-detail__rename,
.role-detail__rename label {
  display: grid;
  gap: 0.375rem;
}

.role-detail__rename label {
  font-size: 0.875rem;
}

.role-detail__rename input {
  min-height: 2.25rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: white;
  color: var(--color-ink, #252a25);
}

.role-detail__notice {
  margin: 0;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgb(58 77 60 / 15%);
  border-radius: 0.375rem;
  background: rgb(58 77 60 / 5%);
  color: var(--color-muted, #73766e);
  font-size: 0.8125rem;
}

.role-detail__permissions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.375rem 1rem;
  margin: 0;
  padding: 0.5rem 0;
  list-style: none;
}

.role-detail__permission {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-muted, #73766e);
}

.role-detail__permission--granted {
  color: var(--color-ink, #252a25);
}

.role-detail__state {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(58 77 60 / 70%);
}
</style>
