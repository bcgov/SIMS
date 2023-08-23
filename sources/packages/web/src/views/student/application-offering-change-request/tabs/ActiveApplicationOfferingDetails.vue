<template>
  <tab-container :enableCardView="false" class="mt-n1">
    <body-header-container>
      <template #header>
        <body-header :title="changeRequest.studentFullName">
          <template #subtitle
            ><detail-header :headerMap="headerDetailsData"
          /></template>
        </body-header>
      </template>
      <hr class="horizontal-divider" />
      <h2 class="category-header-large primary-color">Application Details</h2>
      <offering-view :offeringId="changeRequest.activeOfferingId" />
    </body-header-container>
  </tab-container>
</template>
<script lang="ts">
import { computed, defineComponent, ref, onMounted } from "vue";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import OfferingView from "@/components/common/OfferingView.vue";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import { ApplicationOfferingChangesAPIOutDTO } from "@/services/http/dto";
export default defineComponent({
  components: {
    OfferingView,
    DetailHeader,
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
    return {
      changeRequest,
      headerDetailsData,
    };
  },
});
</script>
