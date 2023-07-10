<template>
  <h2 class="category-header-large primary-color">{{ studentName }}</h2>
  <detail-header :headerMap="headerDetailsData" />
  <hr class="horizontal-divider" />
  <h2 class="category-header-large primary-color">Application Details</h2>
  <p>Review the active program and offering details below.</p>
  <offering-view :offeringId="offeringId" :locationId="locationId" />
  <hr class="horizontal-divider" />
  <h2 class="category-header-large primary-color">Request details</h2>
  <p>
    Select a new program and offering below. This request will be shown to the
    student to allow or decline the change. If the change is allowed, the
    request will go to StudentAid BC for a final decision.
  </p>
  <!-- Submit or view content. -->
  <slot></slot>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import OfferingView from "@/components/common/OfferingView.vue";
import { useInstitutionState } from "@/composables";

export default defineComponent({
  components: { DetailHeader, OfferingView },
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
