<template>
  <tab-container>
    <institution-user-summary
      :institutionId="institutionId"
      :hasBusinessGuid="hasBusinessGuid"
      :allowBasicBCeIDCreation="true"
    />
  </tab-container>
</template>

<script lang="ts">
import { watch, ref, defineComponent } from "vue";
import InstitutionUserSummary from "@/components/common/InstitutionUserSummary.vue";
import { InstitutionService } from "@/services/InstitutionService";

export default defineComponent({
  components: { InstitutionUserSummary },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const hasBusinessGuid = ref(false);
    watch(
      () => props.institutionId,
      async () => {
        const institutionDetails =
          await InstitutionService.shared.getBasicInstitutionInfoById(
            props.institutionId,
          );
        hasBusinessGuid.value = institutionDetails.hasBusinessGuid;
      },
      { immediate: true },
    );
    return { hasBusinessGuid };
  },
});
</script>
