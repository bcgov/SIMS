<template>
  <span>
    {{ title }}
    <RestrictedPartyChip :client-type="clientType" class="ml-3 float-right" />
  </span>
</template>

<script setup lang="ts">
import RestrictedPartyChip from "@/components/generic/RestrictedPartyChip.vue";
import type { RestrictedParty } from "@/types";

defineProps<{
  title: string;
  clientType: RestrictedParty;
}>();
</script>
