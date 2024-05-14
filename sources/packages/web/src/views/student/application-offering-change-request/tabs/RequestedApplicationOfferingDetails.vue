<template>
  <tab-container :enableCardView="false" class="mt-n1">
    <body-header-container>
      <template #header>
        <body-header :title="studentFullName" title-header-level="2">
          <template #subtitle
            ><detail-header :headerMap="headerDetailsData"
          /></template>
          <template #status-chip>
            <status-chip-application-offering-change
              :status="changeRequest.status"
            />
          </template>
        </body-header>
      </template>
      <hr class="horizontal-divider" />
      <h2 class="category-header-large primary-color">Application Details</h2>
      <p v-if="changeRequestInProgressWithStudent">
        Below displays the requested changes from your institution. You can
        compare your
        <span class="font-bold">active application details</span> by switching
        tabs located above.
      </p>
      <offering-view :offeringId="changeRequest.requestedOfferingId" />
      <hr class="horizontal-divider" />
      <h2 class="category-header-large primary-color">Request details</h2>
      <p v-if="changeRequestInProgressWithStudent">
        Contact your institution for more information if there are no
        differences in the requested change above. There may be proposed changes
        that aren't displayed such as study costs.
      </p>
      <content-group-info
        ><div class="mb-2">
          <h3 class="category-header-medium primary-color">
            Reason for change
          </h3>
          <p>{{ changeRequest.reason }}</p>
        </div>
      </content-group-info>
    </body-header-container>
  </tab-container>
</template>
<script lang="ts">
import { computed, defineComponent, ref, onMounted } from "vue";
import { useStore } from "vuex";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import OfferingView from "@/components/common/OfferingView.vue";
import StatusChipApplicationOfferingChange from "@/components/generic/StatusChipApplicationOfferingChange.vue";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import { ApplicationOfferingDetailsAPIOutDTO } from "@/services/http/dto";
import { ApplicationOfferingChangeRequestStatus } from "@/types";
import ContentGroupInfo from "@/components/generic/ContentGroupInfo.vue";
export default defineComponent({
  components: {
    OfferingView,
    DetailHeader,
    StatusChipApplicationOfferingChange,
    ContentGroupInfo,
  },
  props: {
    applicationOfferingChangeRequestId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();
    const studentFullName = computed(() => store.state.student.fullName);
    const changeRequest = ref({} as ApplicationOfferingDetailsAPIOutDTO);
    onMounted(async () => {
      changeRequest.value =
        await ApplicationOfferingChangeRequestService.shared.getApplicationOfferingDetails(
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
    const changeRequestInProgressWithStudent = computed(() => {
      return (
        changeRequest.value.status ===
        ApplicationOfferingChangeRequestStatus.InProgressWithStudent
      );
    });
    return {
      changeRequest,
      studentFullName,
      headerDetailsData,
      changeRequestInProgressWithStudent,
      ApplicationOfferingChangeRequestStatus,
    };
  },
});
</script>
