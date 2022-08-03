<template>
  <full-page-container :fullWidth="true">
    <template #header>
      <header-navigator title="Manage Users" subTitle="User Summary" />
    </template>
    <institution-user-summary
      :hasBusinessGuid="hasBusinessGuid"
      :canSearchBCeIDUsers="true"
    />
  </full-page-container>
</template>

<script lang="ts">
import { computed } from "vue";
import InstitutionUserSummary from "@/components/common/InstitutionUserSummary.vue";
import { useInstitutionState } from "@/composables";

export default {
  components: {
    InstitutionUserSummary,
  },
  setup() {
    const { institutionState } = useInstitutionState();
    const hasBusinessGuid = computed(
      () => institutionState.value.hasBusinessGuid,
    );
    return { hasBusinessGuid };
  },
};
</script>
