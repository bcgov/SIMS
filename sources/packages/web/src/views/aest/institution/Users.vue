<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <InstitutionUserSummary
        :clientType="ClientIdType.AEST"
        :institutionId="institutionId"
      />
    </div>
  </v-card>
</template>

<script lang="ts">
import InstitutionUserSummary from "@/components/common/InstitutionUserSummary.vue";
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
