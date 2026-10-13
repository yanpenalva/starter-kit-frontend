<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="route-fade" mode="out-in">
      <div :key="route.path" class="route-view">
        <component :is="Component" />
      </div>
    </Transition>
  </RouterView>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
</script>
