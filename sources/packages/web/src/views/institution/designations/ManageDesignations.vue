<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Manage institution"
        sub-title="Manage Designations"
        data-cy="manageDesignationHeader"
      />
    </template>
    <body-header-container>
      <template #header>
        <body-header
          title="Designation requests"
          :records-count="designations.length"
        >
          <template #subtitle>
            Ensure you have an approved designation to administer financial aid
            to students.
            <tooltip-icon
              >You must have the role of a Legal Signing Authority to request a
              designation.</tooltip-icon
            >
          </template>
          <template #actions>
            <v-btn
              class="float-right"
              color="primary"
              data-cy="requestDesignation"
              @click="goToRequestDesignation()"
              prepend-icon="fa:fa fa-bell-concierge"
              :disabled="!isLegalSigningAuthority"
              >Request designation</v-btn
            >
          </template>
        </body-header>
      </template>

      <designation-agreement-summary
        :designations="designations"
        toggle-message="You don't have any agreements yet"
        @view-designation="goToViewDesignation"
      />
    </body-header-container>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { onMounted, ref, defineComponent } from "vue";
import { DesignationAgreementService } from "@/services/DesignationAgreementService";
import {
  DesignationAgreementDetailsAPIOutDTO,
  DesignationAgreementStatus,
} from "@/services/http/dto";
import { useInstitutionAuth, useSnackBar } from "@/composables";
import DesignationAgreementSummary from "@/components/partial-view/DesignationAgreement/DesignationAgreementSummary.vue";

export default defineComponent({
  components: {
    DesignationAgreementSummary,
  },
  setup() {
    const router = useRouter();
    const snackBar = useSnackBar();
    const { isLegalSigningAuthority } = useInstitutionAuth();
    const designations = ref([] as DesignationAgreementDetailsAPIOutDTO[]);

    const goToRequestDesignation = () => {
      const hasPendingDesignation = designations.value.some(
        (designation) =>
          designation.designationStatus === DesignationAgreementStatus.Pending,
      );
      if (!hasPendingDesignation) {
        router.push({
          name: InstitutionRoutesConst.DESIGNATION_REQUEST,
        });
      } else {
        snackBar.warn(
          "Your institution already has one pending designation request; you cannot submit another one until the first has been approved or denied.",
        );
      }
    };

    const goToViewDesignation = (id: number) => {
      return router.push({
        name: InstitutionRoutesConst.DESIGNATION_VIEW,
        params: { designationAgreementId: id },
      });
    };

    onMounted(async () => {
      designations.value =
        await DesignationAgreementService.shared.getDesignationsAgreements();
    });

    return {
      designations,
      goToRequestDesignation,
      goToViewDesignation,
      isLegalSigningAuthority,
    };
  },
});
</script>
