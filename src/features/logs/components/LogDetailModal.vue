<template>
  <DialogComponent
    :model-value="modelValue"
    :title="title"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="activity">
      <dl class="log-detail__meta">
        <div>
          <dt>Evento</dt>
          <dd>{{ AUDIT_EVENT_LABELS[activity.event] }}</dd>
        </div>
        <div>
          <dt>Canal</dt>
          <dd>
            {{
              AUDIT_LOG_NAME_LABELS[activity.log_name as AuditLogName] ??
              activity.log_name
            }}
          </dd>
        </div>
        <div>
          <dt>Entidade</dt>
          <dd>
            {{
              AUDIT_SUBJECT_TYPE_LABELS[
                activity.subject_type as AuditSubjectType
              ] ?? activity.subject_type
            }}
            #{{ activity.subject_id }}
          </dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>
            {{ activity.created_at ? formatDate(activity.created_at) : "—" }}
          </dd>
        </div>
      </dl>

      <p class="log-detail__description">{{ activity.description }}</p>

      <h3 class="log-detail__payload-title">Payload da auditoria</h3>
      <pre class="log-detail__payload" data-testid="activity-payload">{{
        formatPayload(activity.properties)
      }}</pre>
    </template>
  </DialogComponent>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DialogComponent from "@/shared/components/DialogComponent.vue";
import {
  AUDIT_EVENT_LABELS,
  AUDIT_LOG_NAME_LABELS,
  AUDIT_SUBJECT_TYPE_LABELS,
  type AdminActivity,
  type AuditLogName,
  type AuditSubjectType,
} from "@/features/logs/api/audit.types";

const props = defineProps<{
  modelValue: boolean;
  activity: AdminActivity | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const title = computed(() =>
  props.activity
    ? `Detalhes do registro #${props.activity.id}`
    : "Detalhes do registro",
);

const formatPayload = (properties: Record<string, unknown>): string =>
  JSON.stringify(properties, null, 2);

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
</script>

<style scoped>
.log-detail__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.log-detail__meta dt {
  color: var(--color-muted, #73766e);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.log-detail__meta dd {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-ink, #252a25);
}

.log-detail__description {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-ink, #252a25);
}

.log-detail__payload-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-muted, #73766e);
}

.log-detail__payload {
  margin: 0;
  padding: 0.75rem;
  overflow-x: auto;
  border: 1px solid rgb(58 77 60 / 15%);
  border-radius: 0.375rem;
  background: rgb(58 77 60 / 5%);
  font-size: 0.8125rem;
  line-height: 1.5;
}
</style>
