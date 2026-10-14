<template>
  <DialogComponent
    :model-value="modelValue"
    :title="title"
    @update:model-value="handleDialogVisibility"
  >
    <template v-if="mode === 'create'">
      <form
        :id="formId"
        class="role-form"
        aria-label="Formulário de novo perfil"
        @submit.prevent="submitCreate"
      >
        <label>
          <FormLabel required>Nome do perfil</FormLabel>
          <input
            v-model="name"
            aria-label="Nome do novo perfil"
            autofocus
            required
            :disabled="pendingCreatedRole !== null || isPending"
          />
          <FieldErrors
            :errors="feedback.fieldErrors.value.name ?? []"
            field-label="Nome do novo perfil"
          />
        </label>
      </form>
    </template>

    <template v-if="mode === 'create' || role">
      <p
        v-if="mode === 'edit' && role"
        class="role-form__name"
        data-testid="role-form-name"
      >
        {{ roleLabel(role.name) }}
      </p>
      <p class="role-form__summary" data-testid="role-form-summary">
        {{ selection.length }} de {{ CATALOGUE_PERMISSIONS.length }} concedidas
      </p>
      <p
        v-if="mode === 'edit' && role && isRoleImmutable(role)"
        role="note"
        class="role-form__notice"
      >
        Perfil Administrador protegido: permissões não podem ser alteradas.
      </p>
      <p
        v-if="
          mode === 'create' &&
          can('roles.manage') &&
          !can('roles.update-permissions')
        "
        role="note"
        class="role-form__notice"
      >
        A permissão roles.update-permissions é necessária para definir
        permissões do novo perfil.
      </p>

      <label class="role-form__permission role-form__select-all">
        <input
          type="checkbox"
          :checked="isAllSelected"
          :indeterminate.prop="isSelectionIndeterminate"
          :disabled="isLocked"
          aria-label="Selecionar todas as permissões"
          @change="togglePermissions(CATALOGUE_PERMISSIONS, checked($event))"
        />
        Selecionar todas as permissões
      </label>

      <q-expansion-item
        v-for="(group, index) in PERMISSION_GROUPS"
        :key="group.id"
        group="role-permissions-form"
        dense
        :default-opened="index === 0"
        :label="group.label"
        :caption="`${grantedCount(group)} de ${group.permissions.length} concedidas`"
        :toggle-aria-label="`Permissões do grupo ${group.label}`"
      >
        <div class="role-form__permissions">
          <label class="role-form__permission role-form__select-all">
            <input
              type="checkbox"
              :checked="isGroupSelected(group)"
              :indeterminate.prop="isGroupIndeterminate(group)"
              :disabled="isLocked"
              :aria-label="`Selecionar todas as permissões de ${group.label}`"
              @change="togglePermissions(group.permissions, checked($event))"
            />
            Selecionar todas de {{ group.label }}
          </label>
          <label
            v-for="permission in group.permissions"
            :key="permission"
            class="role-form__permission"
          >
            <input
              v-model="selection"
              type="checkbox"
              :value="permission"
              :disabled="isLocked"
              :aria-label="`Permissão ${CATALOGUE_PERMISSION_LABELS[permission]} para ${role?.name ?? 'novo perfil'}`"
            />
            {{ CATALOGUE_PERMISSION_LABELS[permission] }}
          </label>
        </div>
      </q-expansion-item>
    </template>

    <FormFeedback :feedback="feedback" />

    <template #actions>
      <button
        type="button"
        class="ui-control"
        data-testid="cancel-role-form"
        :disabled="isPending"
        @click="requestClose"
      >
        Cancelar
      </button>
      <button
        v-if="mode === 'create'"
        type="submit"
        class="ui-control ui-control--primary"
        data-testid="submit-create-role"
        :form="formId"
        :disabled="isPending"
      >
        {{ isPending ? "Criando..." : "Criar perfil" }}
      </button>
      <button
        v-if="mode === 'edit'"
        type="button"
        class="ui-control ui-control--primary"
        data-testid="submit-role-permissions"
        :disabled="isLocked || !isDirty || isPending"
        @click="submitPermissions"
      >
        {{ isPending ? "Salvando..." : "Salvar permissões" }}
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
import FormLabel from "@/shared/components/FormLabel.vue";
import FieldErrors from "@/shared/components/FieldErrors.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
import { roleLabel } from "@/shared/utils/role-labels";
import { useFormDismissGuard } from "@/shared/composables/useFormDismissGuard";
import {
  CATALOGUE_PERMISSIONS,
  CATALOGUE_PERMISSION_LABELS,
  type CataloguePermission,
} from "@/shared/types/contract";
import {
  PERMISSION_GROUPS,
  type PermissionGroup,
} from "@/features/roles/permission-groups";
import {
  isRoleImmutable,
  type AdminRole,
} from "@/features/roles/api/roles.types";
import { useRoleMutations } from "@/features/roles/composables/useRolesList";

const props = defineProps<{
  modelValue: boolean;
  mode: "create" | "edit";
  role?: AdminRole | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  created: [];
  "permissions-saved": [];
}>();

const { can } = useAuthorization();
const { createMutation, permissionMutation } = useRoleMutations();
const feedback = useFormFeedback();
const formId = `role-form-${useId()}`;
const name = ref("");
const selection = ref<CataloguePermission[]>([]);
const saved = ref<CataloguePermission[]>([]);
const pendingCreatedRole = ref<AdminRole | null>(null);

const isPending = computed(() =>
  props.mode === "create"
    ? createMutation.isPending.value || permissionMutation.isPending.value
    : permissionMutation.isPending.value,
);

const isLocked = computed(() => {
  if (isPending.value) return true;
  if (props.mode === "create")
    return !can("roles.manage") || !can("roles.update-permissions");
  return (
    props.role === null ||
    props.role === undefined ||
    isRoleImmutable(props.role) ||
    !can("roles.update-permissions")
  );
});

const title = computed(() =>
  props.mode === "create"
    ? "Criar perfil"
    : `Editar permissões${props.role ? ` de ${props.role.name}` : ""}`,
);

const isDirty = computed(() => {
  if (props.mode === "create")
    return name.value !== "" || selection.value.length > 0;
  return (
    selection.value.length !== saved.value.length ||
    selection.value.some((permission) => !saved.value.includes(permission))
  );
});

const isAllSelected = computed(
  () => selection.value.length === CATALOGUE_PERMISSIONS.length,
);
const isSelectionIndeterminate = computed(
  () => selection.value.length > 0 && !isAllSelected.value,
);

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

const reset = (): void => {
  name.value = "";
  pendingCreatedRole.value = null;
  const role = props.role ?? null;
  selection.value = role === null ? [] : [...role.permissions];
  saved.value = role === null ? [] : [...role.permissions];
  feedback.clearFeedback();
};

watch(
  [() => props.modelValue, () => props.mode, () => props.role?.id],
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
  if (value) return;
  requestClose();
};

const grantedCount = (group: PermissionGroup): number =>
  group.permissions.filter((permission) => selection.value.includes(permission))
    .length;

const isGroupSelected = (group: PermissionGroup): boolean =>
  group.permissions.every((permission) => selection.value.includes(permission));

const isGroupIndeterminate = (group: PermissionGroup): boolean => {
  const granted = grantedCount(group);
  return granted > 0 && granted < group.permissions.length;
};

const togglePermissions = (
  permissions: readonly CataloguePermission[],
  selected: boolean,
): void => {
  const next = new Set(selection.value);
  for (const permission of permissions) {
    if (selected) next.add(permission);
    if (!selected) next.delete(permission);
  }
  selection.value = CATALOGUE_PERMISSIONS.filter((permission) =>
    next.has(permission),
  );
};

const checked = (event: Event): boolean =>
  (event.target as HTMLInputElement).checked;

const submitCreate = async (): Promise<void> => {
  if (isPending.value || !can("roles.manage")) return;
  if (selection.value.length > 0 && !can("roles.update-permissions")) return;
  try {
    pendingCreatedRole.value ??= (
      await createMutation.mutateAsync({ name: name.value })
    ).data;
    if (selection.value.length > 0 && pendingCreatedRole.value !== null) {
      await permissionMutation.mutateAsync({
        roleId: pendingCreatedRole.value.id,
        payload: { permissions: [...selection.value] },
      });
    }
    reset();
    emit("created");
  } catch (error: unknown) {
    feedback.handleFailure(error);
  }
};

const submitPermissions = async (): Promise<void> => {
  const role = props.role ?? null;
  if (role === null || isLocked.value || isPending.value) return;
  if (!isDirty.value) return;
  try {
    await permissionMutation.mutateAsync({
      roleId: role.id,
      payload: { permissions: [...selection.value] },
    });
    saved.value = [...selection.value];
    emit("permissions-saved");
  } catch (error: unknown) {
    feedback.handleFailure(error);
  }
};
</script>

<style scoped>
.role-form {
  display: grid;
  gap: 0.75rem;
}

.role-form label {
  display: grid;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.role-form label > .form-label__text {
  white-space: nowrap;
}

.role-form input {
  min-height: 2.25rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid rgb(58 77 60 / 20%);
  border-radius: 0.375rem;
  background: white;
  color: var(--color-ink, #252a25);
}

.role-form__name {
  margin: 0;
  font-family: var(--type-display, inherit);
  font-size: 1.125rem;
  color: var(--color-ink, #252a25);
}

.role-form__summary {
  margin: 0;
  color: var(--color-muted, #73766e);
  font-size: 0.8125rem;
}

.role-form__notice {
  margin: 0;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgb(58 77 60 / 15%);
  border-radius: 0.375rem;
  background: rgb(58 77 60 / 5%);
  color: var(--color-muted, #73766e);
  font-size: 0.8125rem;
}

.role-form__permissions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.375rem 1rem;
  padding: 0.5rem 0;
}

.role-form__select-all {
  padding-bottom: 0.375rem;
  border-bottom: 1px solid rgb(58 77 60 / 10%);
  font-weight: 600;
}

.role-form__permission {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
}

.role-form__permission input {
  min-height: 0;
  width: 1rem;
  height: 1rem;
}
</style>
