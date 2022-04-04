<template>
  <v-card class="mt-4 p-4">
    <body-header
      title="Designation agreements"
      :recordsCount="designations?.length"
      class="m-1"
    >
    </body-header>
    <designation-agreement-summary
      :designations="designations"
      toggleMessage="No designation agreements found"
      @viewDesignation="goToViewDesignation"
    />
  </v-card>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { GetDesignationAgreementsDto } from "@/types/contracts/DesignationAgreementContract";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import DesignationAgreementSummary from "@/components/partial-view/DesignationAgreement/DesignationAgreementSummary.vue";
import BodyHeader from "@/components/generic/BodyHeader.vue";
export default {
  components: { DesignationAgreementSummary, BodyHeader },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const designations = ref([] as GetDesignationAgreementsDto[]);

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
    };
  },
};
</script>
