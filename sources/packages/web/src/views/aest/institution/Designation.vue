<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header
          title="Designation agreements"
          title-header-level="2"
          :recordsCount="designations?.length"
        >
        </body-header>
      </template>
      <designation-agreement-summary
        :designations="designations"
        toggleMessage="No designation agreements found"
        @viewDesignation="goToViewDesignation"
      />
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { DesignationAgreementDetailsAPIOutDTO } from "@/services/http/dto";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import DesignationAgreementSummary from "@/components/partial-view/DesignationAgreement/DesignationAgreementSummary.vue";
import { LayoutTemplates } from "@/types";

export default defineComponent({
  components: { DesignationAgreementSummary },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const designations = ref([] as DesignationAgreementDetailsAPIOutDTO[]);

    const goToViewDesignation = (id: number) => {
      return router.push({
        name: AESTRoutesConst.DESIGNATION_VIEW,
        params: {
          designationId: id,
          institutionId: props.institutionId,
        },
      });
    };

    onMounted(async () => {
      designations.value =
        await DesignationAgreementService.shared.getDesignationsAgreements(
          props.institutionId,
        );
    });

    return {
      designations,
      goToViewDesignation,
      LayoutTemplates,
    };
  },
});
</script>
