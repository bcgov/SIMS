<template>
  <chip-status status="success" :label="clientTypeLabel" />
</template>

<script setup lang="ts">
import { RestrictedParty } from "@/types";
import { computed } from "vue";

const props = defineProps<{
  clientType: RestrictedParty;
}>();

const clientTypeLabel = computed(() =>
  props.clientType === RestrictedParty.Student ? "Student" : "Institution",
);
</script>
