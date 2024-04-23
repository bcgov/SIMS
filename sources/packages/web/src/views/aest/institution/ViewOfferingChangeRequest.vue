<template>
  <full-page-container layout-template="centered-card-tab">
    <template #header>
      <header-navigator
        title="Study period offerings"
        :routeLocation="{ name: AESTRoutesConst.OFFERING_CHANGE_REQUESTS }"
        subTitle="View Request"
      >
        <template #buttons>
          <check-permission-role
            :role="Role.InstitutionApproveDeclineOfferingChanges"
          >
            <template #="{ notAllowed }">
              <v-btn
                color="primary"
                variant="outlined"
                @click="assessOfferingChange(OfferingStatus.ChangeDeclined)"
                :disabled="notAllowed"
                >Decline reassessment</v-btn
              >
              <v-btn
                class="ml-2"
                color="primary"
                @click="assessOfferingChange(OfferingStatus.Approved)"
                :disabled="notAllowed"
                >Approve reassessment</v-btn
              >
            </template>
          </check-permission-role>
        </template>
      </header-navigator>
      <program-offering-detail-header
        class="m-4"
        :headerDetails="headerDetails"
      />
    </template>
    <template #alerts
      ><offering-application-banner
        :offeringId="offeringId"
      ></offering-application-banner>
    </template>
    <template #tab-header>
      <v-tabs stacked v-model="tab" color="primary">
        <v-tab value="requested-change" :ripple="false">Requested Change</v-tab>
        <v-tab value="active-offering" :ripple="false">Active Offering</v-tab>
      </v-tabs>
    </template>
    <v-window v-model="tab">
      <v-window-item value="requested-change"
        ><offering-form :offeringId="offeringId" />
      </v-window-item>
      <v-window-item value="active-offering">
        <offering-form :offeringId="offering.precedingOfferingId" />
      </v-window-item>
    </v-window>
    <assess-offering-change-modal ref="assessOfferingChangeModalRef" />
  </full-page-container>
</template>

<script lang="ts">
import { ref, defineComponent, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  OfferingStatus,
  ProgramOfferingHeader,
  OfferingRelationType,
  Role,
} from "@/types";
import {
  EducationProgramOfferingAPIOutDTO,
  OfferingChangeAssessmentAPIInDTO,
} from "@/services/http/dto";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { ModalDialog, useSnackBar } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingApplicationBanner from "@/components/aest/OfferingApplicationBanner.vue";
import AssessOfferingChangeModal from "@/components/aest/institution/modals/AssessOfferingChangeModal.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import OfferingForm from "@/components/common/OfferingForm.vue";

export default defineComponent({
  components: {
    ProgramOfferingDetailHeader,
    OfferingApplicationBanner,
    AssessOfferingChangeModal,
    CheckPermissionRole,
    OfferingForm,
  },
  props: {
    programId: {
      type: Number,
      required: true,
    },
    offeringId: {
      type: Number,
      required: true,
    },
  },

  setup(props) {
    const tab = ref("requested-change");
    const headerDetails = ref({} as ProgramOfferingHeader);
    const offering = ref({} as EducationProgramOfferingAPIOutDTO);
    const assessOfferingChangeModalRef = ref(
      {} as ModalDialog<OfferingChangeAssessmentAPIInDTO | boolean>,
    );
    const snackBar = useSnackBar();
    const router = useRouter();

    onMounted(async () => {
      offering.value =
        await EducationProgramOfferingService.shared.getOfferingDetails(
          props.offeringId,
        );
      headerDetails.value = {
        institutionId: offering.value.institutionId,
        institutionName: offering.value.institutionName,
        submittedDate: offering.value.submittedDate,
        status: offering.value.offeringStatus,
        assessedBy: offering.value.assessedBy,
        assessedDate: offering.value.assessedDate,
        locationName: offering.value.locationName,
      };
    });

    const assessOfferingChange = async (offeringStatus: OfferingStatus) => {
      const responseData = await assessOfferingChangeModalRef.value.showModal(
        offeringStatus,
      );
      if (responseData) {
        try {
          await EducationProgramOfferingService.shared.assessOfferingChangeRequest(
            props.offeringId,
            responseData as OfferingChangeAssessmentAPIInDTO,
          );

          router.push({
            name: AESTRoutesConst.REQUEST_CHANGE_OFFERINGS,
          });
          const snackbarMessage =
            offeringStatus === OfferingStatus.Approved
              ? "Offering change request has been approved and reassessments have been created for impacted applications."
              : "Offering change request has been declined.";
          snackBar.success(snackbarMessage);
        } catch {
          snackBar.error(
            "Unexpected error while submitting offering change request.",
          );
        }
      }
    };

    return {
      headerDetails,
      OfferingStatus,
      AESTRoutesConst,
      tab,
      OfferingRelationType,
      assessOfferingChangeModalRef,
      assessOfferingChange,
      Role,
      offering,
    };
  },
});
</script>
