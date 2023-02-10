<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Manage institution"
        data-cy="manageUserHeader"
        subTitle="Manage Users"
      />
    </template>
    <institution-user-summary
      :hasBusinessGuid="hasBusinessGuid"
      :canSearchBCeIDUsers="true"
    />
  </full-page-container>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import InstitutionUserSummary from "@/components/common/InstitutionUserSummary.vue";
import { useInstitutionState } from "@/composables";

export default defineComponent({
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
});
</script>
