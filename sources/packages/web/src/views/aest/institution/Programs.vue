<template>
  <content-group>
    <p class="category-header-large color-blue">Programs</p>
    {{ institutionProgramsSummary }}
  </content-group>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import { AESTInstitutionProgramsSummaryPaginatedDto } from "@/types";
export default {
  components: { ContentGroup },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const institutionProgramsSummary = ref(
      {} as AESTInstitutionProgramsSummaryPaginatedDto,
    );
    onMounted(async () => {
      institutionProgramsSummary.value = await InstitutionService.shared.getPaginatedAESTInstitutionProgramsSummary(
        props.institutionId,
      );
    });
    return {
      institutionProgramsSummary,
    };
  },
};
</script>
