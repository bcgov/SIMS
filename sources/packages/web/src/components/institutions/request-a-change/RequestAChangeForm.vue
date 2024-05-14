<template>
  <body-header-container>
    <template #header>
      <body-header :title="studentName" title-header-level="2">
        <template #subtitle
          ><detail-header :headerMap="headerDetailsData"
        /></template>
        <template #status-chip>
          <status-chip-application-offering-change
            v-if="status"
            :status="status"
          />
        </template>
      </body-header>
    </template>
    <hr class="horizontal-divider" />
    <h2 class="category-header-large primary-color">Application Details</h2>
    <p>Review the active program and offering details below.</p>
    <offering-view
      :offeringId="offeringId"
      :locationId="locationId"
      :studyCostAccess="true"
    />
    <hr class="horizontal-divider" />
    <h2 class="category-header-large primary-color">Request details</h2>
    <p>
      Select a new program and offering below. This request will be shown to the
      student to allow or decline the change. If the change is allowed, the
      request will go to StudentAid BC for a final decision.
    </p>
    <!-- Submit or view content. -->
    <slot></slot>
  </body-header-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from "vue";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import OfferingView from "@/components/common/OfferingView.vue";
import { useInstitutionState } from "@/composables";
import StatusChipApplicationOfferingChange from "@/components/generic/StatusChipApplicationOfferingChange.vue";
import { ApplicationOfferingChangeRequestStatus } from "@/types";

export default defineComponent({
  components: {
    DetailHeader,
    OfferingView,
    StatusChipApplicationOfferingChange,
  },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    offeringId: {
      type: Number,
      required: false,
    },
    studentName: {
      type: String,
      required: false,
    },
    applicationNumber: {
      type: String,
      required: false,
    },
    status: {
      type: String as PropType<ApplicationOfferingChangeRequestStatus>,
      required: false,
    },
  },
  setup(props) {
    const activeOfferingId = ref<number>();
    const { getLocationName } = useInstitutionState();
    const headerDetailsData = computed(
      () =>
        ({
          "Application #": props.applicationNumber ?? "",
          Location: getLocationName(props.locationId),
        } as Record<string, string>),
    );
    return {
      headerDetailsData,
      activeOfferingId,
    };
  },
});
</script>
