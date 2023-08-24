<template>
  <full-page-container layout-template="centered-card-tab">
    <template #header>
      <header-navigator
        title="Financial Aid Application"
        sub-title="View Request"
        :routeLocation="goBackRouteParams"
      >
        <template
          #buttons
          v-if="
            applicationOfferingChangeRequestStatus?.status ===
            ApplicationOfferingChangeRequestStatus.InProgressWithStudent
          "
        >
          <v-btn
            color="primary"
            variant="outlined"
            @click="declineApplicationOfferingChangeRequest"
            >Decline change</v-btn
          >
          <v-btn
            color="primary"
            class="ml-2"
            @click="approveApplicationOfferingChangeRequest"
            >Allow change</v-btn
          >
        </template>
      </header-navigator>
    </template>
    <template #tab-header>
      <v-tabs stacked color="primary"
        ><v-tab
          v-for="item in items"
          :key="item.label"
          :to="item.command()"
          :ripple="false"
        >
          <span class="label-bold"> {{ item.label }} </span>
        </v-tab>
      </v-tabs>
    </template>
    <router-view />
    <approve-application-offering-change-request-modal
      ref="approveApplicationOfferingChangeRequestModal"
    />
    <decline-application-offering-change-request-modal
      ref="declineApplicationOfferingChangeRequestModal"
    />
  </full-page-container>
</template>

<script lang="ts">
import { useRouter, RouteLocationRaw } from "vue-router";
import { defineComponent, ref, computed, onMounted, watchEffect } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import ApproveApplicationOfferingChangeRequestModal from "@/components/students/modals/ApproveApplicationOfferingChangeRequestModal.vue";
import DeclineApplicationOfferingChangeRequestModal from "@/components/students/modals/DeclineApplicationOfferingChangeRequestModal.vue";
import { ModalDialog, useSnackBar } from "@/composables";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import {
  ApplicationOfferingChangeRequestStatusAPIOutDTO,
  StudentApplicationOfferingChangeRequestAPIInDTO,
} from "@/services/http/dto";
import { ApplicationOfferingChangeRequestStatus } from "@/types";

export default defineComponent({
  components: {
    ApproveApplicationOfferingChangeRequestModal,
    DeclineApplicationOfferingChangeRequestModal,
  },
  props: {
    applicationOfferingChangeRequestId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: false,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const router = useRouter();
    const applicationOfferingChangeRequestStatus =
      ref<ApplicationOfferingChangeRequestStatusAPIOutDTO>();
    const approveApplicationOfferingChangeRequestModal = ref(
      {} as ModalDialog<StudentApplicationOfferingChangeRequestAPIInDTO>,
    );
    const declineApplicationOfferingChangeRequestModal = ref(
      {} as ModalDialog<StudentApplicationOfferingChangeRequestAPIInDTO>,
    );
    const getLabel = () => {
      return applicationOfferingChangeRequestStatus.value?.status ===
        ApplicationOfferingChangeRequestStatus.Approved
        ? "Previous application details"
        : "Active application details";
    };
    const goBackRouteParams = computed(
      () =>
        ({
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: { id: props.applicationId },
        } as RouteLocationRaw),
    );
    const items = ref([
      {
        label: "Requested change",
        command: () => ({
          name: StudentRoutesConst.STUDENT_REQUESTED_APPLICATION_OFFERING_CHANGE,
          params: {
            applicationOfferingChangeRequestId:
              props.applicationOfferingChangeRequestId,
            applicationId: props.applicationId,
          },
        }),
      },
      {
        label: getLabel(),
        command: () => ({
          name: StudentRoutesConst.STUDENT_ACTIVE_APPLICATION_DETAILS,
          params: {
            applicationOfferingChangeRequestId:
              props.applicationOfferingChangeRequestId,
            applicationId: props.applicationId,
          },
        }),
      },
    ]);
    watchEffect(() => {
      const [, secondItem] = items.value;
      secondItem.label = getLabel();
    });
    onMounted(async () => {
      applicationOfferingChangeRequestStatus.value =
        await ApplicationOfferingChangeRequestService.shared.getApplicationOfferingChangeRequestStatusById(
          props.applicationOfferingChangeRequestId,
        );
    });
    const declineApplicationOfferingChangeRequest = async () => {
      const declineApplicationOfferingChangeRequestData =
        await declineApplicationOfferingChangeRequestModal.value.showModal();
      if (declineApplicationOfferingChangeRequestData) {
        try {
          await ApplicationOfferingChangeRequestService.shared.updateApplicationOfferingChangeRequestStatus(
            props.applicationOfferingChangeRequestId,
            declineApplicationOfferingChangeRequestData,
          );
          snackBar.success("Your decision has been submitted successfully");
          router.push(goBackRouteParams.value);
        } catch {
          snackBar.error(
            "Unexpected error while approving the application offering change request",
          );
        }
      }
    };
    const approveApplicationOfferingChangeRequest = async () => {
      const approveApplicationOfferingChangeRequestData =
        await approveApplicationOfferingChangeRequestModal.value.showModal();
      if (approveApplicationOfferingChangeRequestData)
        try {
          await ApplicationOfferingChangeRequestService.shared.updateApplicationOfferingChangeRequestStatus(
            props.applicationOfferingChangeRequestId,
            approveApplicationOfferingChangeRequestData,
          );
          snackBar.success("Your decision has been submitted successfully");
          router.push(goBackRouteParams.value);
        } catch {
          snackBar.error(
            "Unexpected error while approving the application offering change request",
          );
        }
    };
    return {
      items,
      declineApplicationOfferingChangeRequest,
      approveApplicationOfferingChangeRequest,
      goBackRouteParams,
      approveApplicationOfferingChangeRequestModal,
      declineApplicationOfferingChangeRequestModal,
      applicationOfferingChangeRequestStatus,
      ApplicationOfferingChangeRequestStatus,
    };
  },
});
</script>
