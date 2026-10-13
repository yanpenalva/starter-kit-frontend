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
          Nome do perfil
          <input
            v-model="name"
            aria-label="Nome do novo perfil"
            autofocus
            required
          />
          <FieldErrors
            :errors="feedback.fieldErrors.value.name ?? []"
            field-label="Nome do novo perfil"
          />
        </label>
      </form>
    </template>

    <template v-else-if="role">
      <p class="role-form__name" data-testid="role-form-name">
        {{ role.name }}
      </p>
      <p class="role-form__summary" data-testid="role-form-summary">
        {{ selection.length }} de {{ CATALOGUE_PERMISSIONS.length }} concedidas
      </p>
      <p v-if="isRoleImmutable(role)" role="note" class="role-form__notice">
        Perfil protegido: permissões não podem ser alteradas.
      </p>

      <q-expansion-item
        v-for="group in PERMISSION_GROUPS"
        :key="group.id"
        dense
        default-opened
        :label="group.label"
        :caption="`${grantedCount(group)} de ${group.permissions.length} concedidas`"
        :toggle-aria-label="`Permissões do grupo ${group.label}`"
      >
        <div class="role-form__permissions">
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
              :aria-label="`Permissão ${CATALOGUE_PERMISSION_LABELS[permission]} para ${role.name}`"
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
        v-else
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
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import DialogComponent from "@/shared/components/DialogComponent.vue";
import FieldErrors from "@/shared/components/FieldErrors.vue";
import FormFeedback from "@/shared/components/FormFeedback.vue";
import { useAuthorization } from "@/features/auth/composables/useAuthorization";
import { useFormFeedback } from "@/shared/composables/useFormFeedback";
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

const isPending = computed(() =>
  props.mode === "create"
    ? createMutation.isPending.value
    : permissionMutation.isPending.value,
);

const isLocked = computed(
  () =>
    props.role === null ||
    props.role === undefined ||
    isRoleImmutable(props.role) ||
    !can("roles.update-permissions"),
);

const title = computed(() =>
  props.mode === "create"
    ? "Criar perfil"
    : `Editar permissões${props.role ? ` de ${props.role.name}` : ""}`,
);

const isDirty = computed(() => {
  if (props.mode === "create") return name.value !== "";
  return (
    selection.value.length !== saved.value.length ||
    selection.value.some((permission) => !saved.value.includes(permission))
  );
});

const { canDismiss } = useFormDismissGuard({
  isDirty: () => isDirty.value,
  isPending: () => isPending.value,
  message: "Há alterações não salvas. Descartar as mudanças?",
});

const reset = (): void => {
  name.value = "";
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
  if (!canDismiss()) return;
  reset();
  emit("update:modelValue", false);
};

const handleDialogVisibility = (value: boolean): void => {
  if (value) return;
  requestClose();
};

const grantedCount = (group: PermissionGroup): number =>
  group.permissions.filter((permission) => selection.value.includes(permission))
    .length;

const submitCreate = async (): Promise<void> => {
  if (isPending.value || !can("roles.manage")) return;
  try {
    await createMutation.mutateAsync({ name: name.value });
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
