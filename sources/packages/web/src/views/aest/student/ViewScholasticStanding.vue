<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessments"
        subTitle="View Submission"
        :routeLocation="goBackRouteParams"
      >
        <template #buttons>
          <check-permission-role :role="Role.StudentReverseScholasticStanding">
            <template #="{ notAllowed }">
              <v-btn
                color="primary"
                @click="showReverseScholasticStandingModal"
                :disabled="notAllowed"
                >Reverse</v-btn
              >
            </template>
          </check-permission-role>
        </template></header-navigator
      >
    </template>
    <scholastic-standing-form
      :scholasticStandingId="scholasticStandingId"
      :readOnly="true"
      :showFooter="true"
      :showCompleteInfo="true"
      :processing="false"
    />
    <reverse-scholastic-standing-modal ref="reverseScholasticStandingModal" />
  </full-page-container>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { computed, ref } from "vue";
import { RouteLocationRaw } from "vue-router";
import ScholasticStandingForm from "@/components/common/ScholasticStandingForm.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import ReverseScholasticStandingModal from "@/components/aest/students/modals/ReverseScholasticStandingModal.vue";
import { Role } from "@/types";
import { ModalDialog, useSnackBar } from "@/composables";
import { ReverseScholasticStandingAPIInDTO } from "@/services/http/dto";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";

export default {
  name: "ViewScholasticStanding",
  components: {
    ScholasticStandingForm,
    CheckPermissionRole,
    ReverseScholasticStandingModal,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    scholasticStandingId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const reverseScholasticStandingModal = ref(
      {} as ModalDialog<ReverseScholasticStandingAPIInDTO | false>,
    );
    const goBackRouteParams = computed(
      () =>
        ({
          name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
          params: {
            applicationId: props.applicationId,
            studentId: props.studentId,
          },
        } as RouteLocationRaw),
    );
    const showReverseScholasticStandingModal = async () => {
      const payload = await reverseScholasticStandingModal.value.showModal();
      if (payload) {
        try {
          await ScholasticStandingService.shared.reverseScholasticStanding(
            props.scholasticStandingId,
            payload,
          );
          snackBar.success("Reassessment triggered successfully.");
        } catch {
          snackBar.error(
            "Unexpected error while triggering manual reassessment.",
          );
          reverseScholasticStandingModal.value.loading = false;
        }
      }
    };

    return {
      goBackRouteParams,
      Role,
      reverseScholasticStandingModal,
      showReverseScholasticStandingModal,
    };
  },
};
</script>
