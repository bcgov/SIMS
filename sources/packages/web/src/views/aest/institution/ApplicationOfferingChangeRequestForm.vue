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
          <v-btn color="primary" variant="outlined">Decline reassessment</v-btn>
          <v-btn class="ml-2" color="primary">Approve reassessment</v-btn>
        </template>
      </header-navigator>
      <application-offering-change-details-header
        :headerDetails="headerDetails"
      />
    </template>
    <template
      #alerts
      v-if="
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
        :applicationOfferingChangeDetails="studentApplicationOfferingDetails"
      />
      <v-tabs stacked v-model="tab" color="primary">
        <v-tab value="requested-change" :ripple="false">Requested Change</v-tab>
        <v-tab value="active-offering" :ripple="false">Active Offering</v-tab>
      </v-tabs>
    </template>
    <v-window v-model="tab">
      <v-window-item value="requested-change"
        ><offering-form
          :offeringId="
            applicationOfferingChangeRequestDetails.requestedOfferingId
          "
        />
      </v-window-item>
      <v-window-item value="active-offering">
        <offering-form
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
  ApplicationOfferingChangeRequestHeader,
  ApplicationOfferingChangeRequestStatus,
} from "@/types";
import { ApplicationOfferingDetailsReviewAPIOutDTO } from "@/services/http/dto";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ApplicationOfferingChangeDetailsHeader from "@/components/aest/institution/ApplicationOfferingChangeDetailsHeader.vue";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import StudentApplicationOfferingChangeDetails from "@/components/aest/StudentApplicationOfferingChangeDetails.vue";
import OfferingForm from "@/components/common/OfferingForm.vue";
import { BannerTypes } from "@/types/contracts/Banner";
import { ApplicationOfferingDetails } from "@/types/contracts/StudentApplicationOfferingChangeContract";

export default defineComponent({
  components: {
    StudentApplicationOfferingChangeDetails,
    ApplicationOfferingChangeDetailsHeader,
    OfferingForm,
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
    const headerDetails = ref({} as ApplicationOfferingChangeRequestHeader);
    const applicationOfferingChangeRequestDetails = ref(
      {} as ApplicationOfferingDetailsReviewAPIOutDTO,
    );
    const studentApplicationOfferingDetails = ref(
      {} as ApplicationOfferingDetails,
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
      BannerTypes,
      tab,
      ApplicationOfferingChangeRequestStatus,
      goBackRouteParams,
      studentApplicationOfferingDetails,
      applicationOfferingChangeRequestDetails,
    };
  },
});
</script>
