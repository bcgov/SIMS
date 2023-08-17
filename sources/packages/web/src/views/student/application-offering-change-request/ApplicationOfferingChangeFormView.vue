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
            applicationOfferingChangeRequestStatus ===
            ApplicationOfferingChangeRequestStatus.InProgressWithStudent
          "
        >
          <v-btn
            v-if="showActionButtons"
            color="primary"
            variant="outlined"
            @click="declineApplicationOfferingChangeRequest"
            >Decline change</v-btn
          >
          <v-btn
            v-if="showActionButtons"
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
          <span class="mx-2 label-bold"> {{ item.label }} </span>
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
import { defineComponent, ref, computed, onMounted, watchEffect } from "vue";
import { RouteLocationRaw } from "vue-router";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import ApproveApplicationOfferingChangeRequestModal from "@/components/aest/students/modals/ApproveApplicationOfferingChangeRequestModal.vue";
import DeclineApplicationOfferingChangeRequestModal from "@/components/aest/students/modals/DeclineApplicationOfferingChangeRequestModal.vue";
import { ModalDialog, useSnackBar } from "@/composables";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import { UpdateApplicationOfferingChangeRequestAPIInDTO } from "@/services/http/dto";
import { ApplicationOfferingChangeRequestStatus } from "@/types";
import router from "@/router";

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
    const applicationOfferingChangeRequestStatus =
      ref<ApplicationOfferingChangeRequestStatus>();
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
        label:
          applicationOfferingChangeRequestStatus.value ===
          ApplicationOfferingChangeRequestStatus.Approved
            ? "Previous application details"
            : "Active application details",
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
    watchEffect(async () => {
      const [, secondItem] = items.value;
      if (
        applicationOfferingChangeRequestStatus.value ===
        ApplicationOfferingChangeRequestStatus.Approved
      )
        secondItem.label = "Previous application details";
      else secondItem.label = "Active application details";
    });
    onMounted(async () => {
      applicationOfferingChangeRequestStatus.value =
        await ApplicationOfferingChangeRequestService.shared.getApplicationOfferingChangeRequestStatusById(
          props.applicationOfferingChangeRequestId,
        );
    });
    const showActionButtons = computed(() => true);
    const declineApplicationOfferingChangeRequestModal = ref(
      {} as ModalDialog<
        UpdateApplicationOfferingChangeRequestAPIInDTO | boolean
      >,
    );
    const declineApplicationOfferingChangeRequest = async () => {
      const declineApplicationOfferingChangeRequestData =
        await declineApplicationOfferingChangeRequestModal.value.showModal();
      if (declineApplicationOfferingChangeRequestData) {
        try {
          await ApplicationOfferingChangeRequestService.shared.updateApplicationOfferingChangeRequestStatus(
            props.applicationOfferingChangeRequestId,
            declineApplicationOfferingChangeRequestData as UpdateApplicationOfferingChangeRequestAPIInDTO,
          );
          snackBar.success("Your decision has been submitted successfully");
          router.push({
            name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
            params: { id: props.applicationId },
          });
        } catch {
          snackBar.error(
            "Unexpected error while approving the application offering change request",
          );
        }
      }
    };
    const approveApplicationOfferingChangeRequestModal = ref(
      {} as ModalDialog<
        UpdateApplicationOfferingChangeRequestAPIInDTO | boolean
      >,
    );
    const approveApplicationOfferingChangeRequest = async () => {
      const approveApplicationOfferingChangeRequestData =
        await approveApplicationOfferingChangeRequestModal.value.showModal();
      if (approveApplicationOfferingChangeRequestData)
        try {
          await ApplicationOfferingChangeRequestService.shared.updateApplicationOfferingChangeRequestStatus(
            props.applicationOfferingChangeRequestId,
            approveApplicationOfferingChangeRequestData as UpdateApplicationOfferingChangeRequestAPIInDTO,
          );
          snackBar.success("Your decision has been submitted successfully");
          router.push({
            name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
            params: { id: props.applicationId },
          });
        } catch {
          snackBar.error(
            "Unexpected error while approving the application offering change request",
          );
        }
    };
    const goBackRouteParams = computed(
      () =>
        ({
          name: StudentRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: { id: props.applicationId },
        } as RouteLocationRaw),
    );
    return {
      items,
      showActionButtons,
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
