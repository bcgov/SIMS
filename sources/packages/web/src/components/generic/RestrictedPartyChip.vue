<template>
  <chip-status status="success" :label="props.clientType" />
</template>

<script setup lang="ts">
import { RestrictedParty } from "@/types";

const props = defineProps<{
  clientType: RestrictedParty;
}>();
</script>
