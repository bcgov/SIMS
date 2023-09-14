<template>
  <full-page-container layout-template="centered-card-tab">
    <template #header>
      <header-navigator
        title="Assessments"
        :routeLocation="goBackRouteParams"
        subTitle="View Request"
      >
        <template
          #buttons
          v-if="
            applicationOfferingChangeRequestDetails.status ===
            ApplicationOfferingChangeRequestStatus.InProgressWithSABC
          "
        >
          <v-row class="p-0 m-0">
            <v-btn color="primary" variant="outlined"
              >Decline reassessment</v-btn
            >
            <v-btn class="ml-2" color="primary">Approve reassessment</v-btn>
          </v-row>
        </template>
      </header-navigator>
      <program-offering-detail-header
        class="m-4"
        :headerDetails="headerDetails"
      />
    </template>
    <template
      #alerts
      v-if="
        applicationOfferingChangeRequestDetails.status ===
        ApplicationOfferingChangeRequestStatus.InProgressWithStudent
      "
      ><offering-application-banner
        :offeringId="
          applicationOfferingChangeRequestDetails.requestedOfferingId
        "
      ></offering-application-banner>
    </template>
    <template #tab-header>
      <student-application-offering-change-details
        class="mb-6"
        :studentName="applicationOfferingChangeRequestDetails.studentFullName"
        :applicationNumber="
          applicationOfferingChangeRequestDetails.applicationNumber
        "
        :locationName="applicationOfferingChangeRequestDetails.locationName"
        :reasonForChange="applicationOfferingChangeRequestDetails.reason"
        :accessedNoteDescription="
          applicationOfferingChangeRequestDetails.assessedNoteDescription
        "
        :applicationOfferingChangeRequestStatus="
          applicationOfferingChangeRequestDetails.status
        "
      />
      <v-tabs stacked v-model="tab" color="primary">
        <v-tab value="requested-change" :ripple="false">Requested Change</v-tab>
        <v-tab value="active-offering" :ripple="false">Active Offering</v-tab>
      </v-tabs>
    </template>
    <v-window v-model="tab">
      <v-window-item value="requested-change"
        ><offering-change-request
          v-if="applicationOfferingChangeRequestDetails.requestedOfferingId"
          :offeringId="
            applicationOfferingChangeRequestDetails.requestedOfferingId
          "
        />
      </v-window-item>
      <v-window-item value="active-offering">
        <offering-change-request
          v-if="applicationOfferingChangeRequestDetails.activeOfferingId"
          :offeringId="applicationOfferingChangeRequestDetails.activeOfferingId"
        />
      </v-window-item>
    </v-window>
    <assess-offering-change-modal ref="assessOfferingChangeModal" />
  </full-page-container>
</template>

<script lang="ts">
import { ref, defineComponent, computed, onMounted } from "vue";
import { RouteLocationRaw } from "vue-router";
import {
  ProgramOfferingHeader,
  ApplicationOfferingChangeRequestStatus,
} from "@/types";
import { ApplicationOfferingDetailsReviewAPIOutDTO } from "@/services/http/dto";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import OfferingApplicationBanner from "@/components/aest/OfferingApplicationBanner.vue";
import OfferingChangeRequest from "@/components/aest/OfferingChangeRequest.vue";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import StudentApplicationOfferingChangeDetails from "@/components/aest/StudentApplicationOfferingChangeDetails.vue";

export default defineComponent({
  components: {
    ProgramOfferingDetailHeader,
    OfferingChangeRequest,
    OfferingApplicationBanner,
    StudentApplicationOfferingChangeDetails,
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
    applicationOfferingChangeRequestId: {
      type: Number,
      required: true,
    },
  },

  setup(props) {
    const tab = ref("requested-change");
    const headerDetails = ref({} as ProgramOfferingHeader);
    const applicationOfferingChangeRequestDetails = ref(
      {} as ApplicationOfferingDetailsReviewAPIOutDTO,
    );
    onMounted(async () => {
      applicationOfferingChangeRequestDetails.value =
        await ApplicationOfferingChangeRequestService.shared.getApplicationOfferingDetailsForReview(
          props.applicationOfferingChangeRequestId,
        );
      headerDetails.value = {
        submittedDate:
          applicationOfferingChangeRequestDetails.value.submittedDate?.toString(),
        institutionName:
          applicationOfferingChangeRequestDetails.value.institutionName,
        locationName:
          applicationOfferingChangeRequestDetails.value.locationName,
        assessedBy: applicationOfferingChangeRequestDetails.value.assessedBy,
        assessedDate:
          applicationOfferingChangeRequestDetails.value.assessedDate?.toString(),
        institutionId:
          applicationOfferingChangeRequestDetails.value.institutionId,
        status: applicationOfferingChangeRequestDetails.value.status,
        updatedDate:
          applicationOfferingChangeRequestDetails.value.updatedDate?.toString(),
      };
    });
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
    return {
      headerDetails,
      AESTRoutesConst,
      tab,
      ApplicationOfferingChangeRequestStatus,
      goBackRouteParams,
      applicationOfferingChangeRequestDetails,
    };
  },
});
</script>
