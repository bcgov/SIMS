<template>
  <InstitutionUserSummary
    :clientType="ClientIdType.AEST"
    :institutionId="institutionId"
  />
</template>

<script lang="ts">
import InstitutionUserSummary from "@/components/aest/InstitutionUserSummary.vue";
import { ClientIdType } from "@/types";

export default {
  components: { InstitutionUserSummary },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    return { ClientIdType };
  },
};
</script>
