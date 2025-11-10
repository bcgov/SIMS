<template>
  <full-page-container layout-template="centered-card-tab">
    <template #header>
      <header-navigator
        title="Assessments"
        :route-location="goBackRouteParams"
        sub-title="View Request"
      >
        <template
          #buttons
          v-if="
            !isRequestFromApplicationVersion &&
            applicationOfferingChangeRequestDetails.status ===
              ApplicationOfferingChangeRequestStatus.InProgressWithSABC
          "
          ><check-permission-role
            :role="
              Role.InstitutionApproveDeclineApplicationOfferingChangeRequest
            "
          >
            <template #="{ notAllowed }">
              <v-btn
                color="primary"
                variant="outlined"
                @click="
                  assessApplicationOfferingChangeRequest(
                    ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
                  )
                "
                :disabled="notAllowed"
                >Decline reassessment</v-btn
              >
              <v-btn
                class="ml-2"
                color="primary"
                @click="
                  assessApplicationOfferingChangeRequest(
                    ApplicationOfferingChangeRequestStatus.Approved,
                  )
                "
                :disabled="notAllowed"
                >Approve reassessment</v-btn
              >
            </template>
          </check-permission-role>
        </template>
      </header-navigator>
      <application-offering-change-details-header
        :header-details="headerDetails"
      />
    </template>
    <template
      #alerts
      v-if="
        !isRequestFromApplicationVersion &&
        applicationOfferingChangeRequestDetails.status ===
          ApplicationOfferingChangeRequestStatus.InProgressWithStudent
      "
      ><banner
        class="mb-2"
        :type="BannerTypes.Warning"
        header="This request is still pending with the student"
        summary="The option to approve or decline for reassessment will be available once the student gives permission for the change. Please follow back shortly or contact the student."
      />
    </template>
    <template #tab-header>
      <student-application-offering-change-details
        class="mb-6"
        :application-offering-change-details="studentApplicationOfferingDetails"
      />
      <v-tabs stacked v-model="tab" color="primary">
        <v-tab value="requested-change" :ripple="false">Requested Change</v-tab>
        <v-tab value="active-offering" :ripple="false">Active Offering</v-tab>
      </v-tabs>
    </template>
    <v-window v-model="tab">
      <v-window-item value="requested-change"
        ><offering-form
          :offering-id="
            applicationOfferingChangeRequestDetails.requestedOfferingId
          "
        />
      </v-window-item>
      <v-window-item value="active-offering">
        <offering-form
          :offering-id="
            applicationOfferingChangeRequestDetails.activeOfferingId
          "
        />
      </v-window-item>
    </v-window>
    <assess-application-offering-change-request-modal
      ref="assessApplicationOfferingChangeRequestModal"
    />
  </full-page-container>
</template>

<script lang="ts">
import { ref, defineComponent, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  ApplicationOfferingChangeRequestHeader,
  ApplicationOfferingChangeRequestStatus,
  Role,
} from "@/types";
import {
  ApplicationOfferingChangeAssessmentAPIInDTO,
  ApplicationOfferingChangeDetailsAPIOutDTO,
} from "@/services/http/dto";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ApplicationOfferingChangeDetailsHeader from "@/components/aest/institution/ApplicationOfferingChangeDetailsHeader.vue";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import StudentApplicationOfferingChangeDetails from "@/components/aest/StudentApplicationOfferingChangeDetails.vue";
import AssessApplicationOfferingChangeRequestModal from "@/components/aest/AssessApplicationOfferingChangeRequestModal.vue";
import OfferingForm from "@/components/common/OfferingForm.vue";
import { BannerTypes } from "@/types/contracts/Banner";
import { ApplicationOfferingDetails } from "@/types/contracts/StudentApplicationOfferingChangeContract";
import { ModalDialog, useFormatters, useSnackBar } from "@/composables";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default defineComponent({
  components: {
    StudentApplicationOfferingChangeDetails,
    ApplicationOfferingChangeDetailsHeader,
    OfferingForm,
    AssessApplicationOfferingChangeRequestModal,
    CheckPermissionRole,
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
    versionApplicationId: {
      type: Number,
      required: false,
      default: undefined,
    },
    applicationOfferingChangeRequestId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const tab = ref("requested-change");
    const { dateOnlyLongString } = useFormatters();
    const headerDetails = ref({} as ApplicationOfferingChangeRequestHeader);
    const applicationOfferingChangeRequestDetails = ref(
      {} as ApplicationOfferingChangeDetailsAPIOutDTO,
    );
    const studentApplicationOfferingDetails = ref(
      {} as ApplicationOfferingDetails,
    );
    const assessApplicationOfferingChangeRequestModal = ref(
      {} as ModalDialog<ApplicationOfferingChangeAssessmentAPIInDTO | false>,
    );
    const snackBar = useSnackBar();
    const router = useRouter();

    const isRequestFromApplicationVersion = computed(
      () => !!props.versionApplicationId,
    );

    onMounted(async () => {
      applicationOfferingChangeRequestDetails.value =
        await ApplicationOfferingChangeRequestService.shared.getApplicationOfferingDetailsForReview(
          props.applicationOfferingChangeRequestId,
        );
      studentApplicationOfferingDetails.value = {
        studentName:
          applicationOfferingChangeRequestDetails.value.studentFullName,
        applicationNumber:
          applicationOfferingChangeRequestDetails.value.applicationNumber,
        locationName:
          applicationOfferingChangeRequestDetails.value.locationName,
        reasonForChange: applicationOfferingChangeRequestDetails.value.reason,
        accessedNoteDescription:
          applicationOfferingChangeRequestDetails.value.assessedNoteDescription,
        applicationOfferingChangeRequestStatus:
          applicationOfferingChangeRequestDetails.value.status,
      };
      headerDetails.value = {
        submittedDate: dateOnlyLongString(
          applicationOfferingChangeRequestDetails.value.submittedDate,
        ),
        institutionName:
          applicationOfferingChangeRequestDetails.value.institutionName,
        locationName:
          applicationOfferingChangeRequestDetails.value.locationName,
        assessedBy: applicationOfferingChangeRequestDetails.value.assessedBy,
        assessedDate: dateOnlyLongString(
          applicationOfferingChangeRequestDetails.value.assessedDate,
        ),
        institutionId:
          applicationOfferingChangeRequestDetails.value.institutionId,
        status: applicationOfferingChangeRequestDetails.value.status,
        studentActionDate: dateOnlyLongString(
          applicationOfferingChangeRequestDetails.value.studentActionDate,
        ),
      };
    });

    const assessApplicationOfferingChangeRequest = async (
      applicationOfferingChangeRequestStatus: ApplicationOfferingChangeRequestStatus,
    ) => {
      const responseData =
        await assessApplicationOfferingChangeRequestModal.value.showModal(
          applicationOfferingChangeRequestStatus,
        );
      if (responseData) {
        try {
          assessApplicationOfferingChangeRequestModal.value.loading = true;
          await ApplicationOfferingChangeRequestService.shared.assessApplicationOfferingChangeRequest(
            props.applicationOfferingChangeRequestId,
            responseData,
          );
          router.push({
            name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
          });
          snackBar.success(
            "Your decision was submitted. You can refer to the outcome below.",
          );
          assessApplicationOfferingChangeRequestModal.value.hideModal();
        } catch {
          snackBar.error(
            "Unexpected error while submitting application offering change request.",
          );
          assessApplicationOfferingChangeRequestModal.value.loading = false;
        }
      }
    };

    const goBackRouteParams = computed(() => {
      if (props.versionApplicationId) {
        return {
          name: AESTRoutesConst.ASSESSMENTS_SUMMARY_DETAILS_VERSION,
          params: {
            studentId: props.studentId,
            applicationId: props.applicationId,
            versionApplicationId: props.versionApplicationId,
          },
        };
      }
      return {
        name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
        params: {
          applicationId: props.applicationId,
          studentId: props.studentId,
        },
      };
    });

    return {
      Role,
      headerDetails,
      AESTRoutesConst,
      BannerTypes,
      tab,
      ApplicationOfferingChangeRequestStatus,
      goBackRouteParams,
      studentApplicationOfferingDetails,
      applicationOfferingChangeRequestDetails,
      assessApplicationOfferingChangeRequest,
      assessApplicationOfferingChangeRequestModal,
      isRequestFromApplicationVersion,
    };
  },
});
</script>
