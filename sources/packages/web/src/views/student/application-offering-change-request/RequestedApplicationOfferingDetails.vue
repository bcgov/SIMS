<template>
  <body-header-container>
    <template #header>
      <body-header :title="changeRequest.studentFullName">
        <template #subtitle
          ><detail-header :headerMap="headerDetailsData"
        /></template>
        <template #status-chip>
          <status-chip-application-offering-change
            v-if="changeRequest.status"
            :status="changeRequest.status"
          />
        </template>
      </body-header>
    </template>
    <hr class="horizontal-divider" />
    <h2 class="category-header-large primary-color">Application Details</h2>
    <p v-if="changeRequestNotApproved">
      Below displays the requested changes from your institution. You can
      compare your active application details by switching tabs located above.
    </p>
    <offering-view :offeringId="changeRequest.requestedOfferingId" />
    <hr class="horizontal-divider" />
    <h2 class="category-header-large primary-color">Request details</h2>
    <p v-if="changeRequestNotApproved">
      Contact your institution for more information if there are no differences
      in the requested change above. There may be proposed changes that aren't
      displayed such as study costs.
    </p>
    <v-textarea
      :readonly="true"
      label="Reason for change"
      variant="outlined"
      hide-details="auto"
      class="mt-4"
      v-model="changeRequest.reason"
    />
  </body-header-container>
</template>
<script lang="ts">
import { computed, defineComponent, ref, onMounted } from "vue";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import OfferingView from "@/components/common/OfferingView.vue";
import StatusChipApplicationOfferingChange from "@/components/generic/StatusChipApplicationOfferingChange.vue";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import { ApplicationOfferingChangesAPIOutDTO } from "@/services/http/dto";
import { ApplicationOfferingChangeRequestStatus } from "@/types";
export default defineComponent({
  components: {
    OfferingView,
    DetailHeader,
    StatusChipApplicationOfferingChange,
  },
  props: {
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
        );
    });
    const headerDetailsData = computed(
      () =>
        ({
          "Application #": changeRequest.value.applicationNumber ?? "",
          Location: changeRequest.value.locationName,
        } as Record<string, string>),
    );
    const changeRequestNotApproved = computed(() => {
      return (
        changeRequest.value.status !==
        ApplicationOfferingChangeRequestStatus.Approved
      );
    });
    return {
      changeRequest,
      headerDetailsData,
      changeRequestNotApproved,
      ApplicationOfferingChangeRequestStatus,
    };
  },
});
</script>
