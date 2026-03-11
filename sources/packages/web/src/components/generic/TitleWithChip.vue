<template>
  <span>
    {{ title }}
    <chip-tag color="success" :label="props.restrictedParty" />
  </span>
</template>

<script setup lang="ts">
import type { RestrictedParty } from "@/types";

const props = defineProps<{
  title: string;
  restrictedParty: RestrictedParty;
}>();
</script>
