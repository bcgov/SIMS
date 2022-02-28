<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <p class="category-header-large color-blue">Designation</p>
    </div>
    <full-page-container
      ><designation-agreement-summary
        :designations="designations"
        @viewDesignation="goToViewDesignation"
    /></full-page-container>
  </v-card>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { GetDesignationAgreementsDto } from "@/types/contracts/DesignationAgreementContract";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import DesignationAgreementSummary from "@/components/partial-view/DesignationAgreement/DesignationAgreementSummary.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
export default {
  components: { DesignationAgreementSummary, FullPageContainer },
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
        params: { designationAgreementId: id },
      });
    };

    onMounted(async () => {
      designations.value = await DesignationAgreementService.shared.getDesignationsAgreements(
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
