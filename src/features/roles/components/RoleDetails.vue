<template>
  <DialogComponent
    :model-value="modelValue"
    :title="title"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="role">
      <p class="role-detail__name" data-testid="role-detail-name">
        {{ role.name }}
      </p>
      <p v-if="isRoleImmutable(role)" role="note" class="role-detail__notice">
        Perfil protegido: não pode ser editado nem excluído.
      </p>

      <q-expansion-item
        v-for="group in PERMISSION_GROUPS"
        :key="group.id"
        dense
        :label="group.label"
        :caption="`${grantedCount(group)} de ${group.permissions.length} concedidas`"
        :toggle-aria-label="`Permissões do grupo ${group.label}`"
      >
        <ul class="role-detail__permissions">
          <li
            v-for="permission in group.permissions"
            :key="permission"
            class="role-detail__permission"
            :class="{
              'role-detail__permission--granted': isGranted(permission),
            }"
          >
            <span>{{ CATALOGUE_PERMISSION_LABELS[permission] }}</span>
            <span class="role-detail__state">
              {{ isGranted(permission) ? "Concedida" : "Não concedida" }}
            </span>
          </li>
        </ul>
      </q-expansion-item>
    </template>
  </DialogComponent>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DialogComponent from "@/shared/components/DialogComponent.vue";
import {
  CATALOGUE_PERMISSION_LABELS,
  type CataloguePermission,
} from "@/shared/types/contract";
import {
  PERMISSION_GROUPS,
  type PermissionGroup,
} from "@/features/roles/permission-groups";
import { isRoleImmutable } from "@/features/roles/api/roles.types";
import type { AdminRole } from "@/features/roles/api/roles.types";

const props = defineProps<{
  modelValue: boolean;
  role: AdminRole | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const title = computed(() =>
  props.role === null
    ? "Detalhes do perfil"
    : `Detalhes do perfil ${props.role.name}`,
);

const isGranted = (permission: CataloguePermission): boolean =>
  props.role?.permissions.includes(permission) ?? false;

const grantedCount = (group: PermissionGroup): number =>
  group.permissions.filter((permission) => isGranted(permission)).length;
</script>

<style scoped>
.role-detail__name {
  margin: 0;
  font-family: var(--type-display, inherit);
  font-size: 1.125rem;
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
