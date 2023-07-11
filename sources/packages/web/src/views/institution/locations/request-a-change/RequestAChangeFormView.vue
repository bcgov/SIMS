<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Request an Application Change"
        :sub-title="subTitle"
        :routeLocation="goBackRouteParams"
      />
    </template>
    <request-a-change-form
      :locationId="locationId"
      :offeringId="changeRequest.activeOfferingId"
      :studentName="changeRequest.studentFullName"
      :applicationNumber="changeRequest.applicationNumber"
    >
      <v-text-field
        label="Program"
        :readonly="true"
        v-model="changeRequest.requestedOfferingProgramName"
        variant="outlined"
      />
      <v-text-field
        label="Offering"
        :readonly="true"
        v-model="changeRequest.requestedOfferingDescription"
        variant="outlined"
        class="mt-4"
      />
      <v-textarea
        :readonly="true"
        label="Reason for change"
        variant="outlined"
        hide-details="auto"
        class="mt-4"
        v-model="changeRequest.reason"
      />
      <p class="mt-1 brand-gray-text">
        This note is visible to students and StudentAid BC staff.
      </p>
      <v-textarea
        v-if="
          changeRequest.status ===
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC
        "
        :readonly="true"
        label="Notes from StudentAid BC"
        variant="outlined"
        hide-details="auto"
        class="mt-4"
        v-model="changeRequest.assessedNoteDescription"
      />
    </request-a-change-form>
  </full-page-container>
</template>

<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { computed, defineComponent, onMounted, ref } from "vue";
import { RouteLocationRaw } from "vue-router";
import RequestAChangeForm from "./RequestAChangeForm.vue";
import { ApplicationOfferingChangesAPIOutDTO } from "@/services/http/dto";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import { ApplicationOfferingChangeRequestStatus } from "@/types";

export default defineComponent({
  components: { RequestAChangeForm },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    applicationOfferingChangeRequestId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const changeRequest = ref({} as ApplicationOfferingChangesAPIOutDTO);

    onMounted(async () => {
      changeRequest.value =
        await ApplicationOfferingChangeRequestService.shared.getById(
          props.applicationOfferingChangeRequestId,
          { locationId: props.locationId },
        );
    });

    const subTitle = computed(() => {
      switch (changeRequest.value.status) {
        case ApplicationOfferingChangeRequestStatus.DeclinedBySABC:
        case ApplicationOfferingChangeRequestStatus.DeclinedByStudent:
          return "View Outcome";
        default:
          return "View Request";
      }
    });

    const goBackRouteParams = computed(
      () =>
        ({
          name: InstitutionRoutesConst.REQUEST_CHANGE,
          params: {
            locationId: props.locationId,
          },
        } as RouteLocationRaw),
    );

    return {
      subTitle,
      changeRequest,
      goBackRouteParams,
      ApplicationOfferingChangeRequestStatus,
    };
  },
});
</script>
