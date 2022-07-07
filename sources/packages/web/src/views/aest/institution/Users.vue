<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <InstitutionUserSummary
        :institutionId="institutionId"
        :hasBusinessGuid="hasBusinessGuid"
      />
    </div>
  </v-card>
</template>

<script lang="ts">
import { watch, ref } from "vue";
import InstitutionUserSummary from "@/components/common/InstitutionUserSummary.vue";
import { InstitutionService } from "@/services/InstitutionService";

export default {
  components: { InstitutionUserSummary },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
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
    console.log("hasBusinessGuid");
    console.log(hasBusinessGuid.value);
    return { hasBusinessGuid };
  },
};
</script>
