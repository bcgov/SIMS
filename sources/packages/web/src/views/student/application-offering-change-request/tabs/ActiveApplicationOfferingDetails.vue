<template>
  <tab-container :enableCardView="false" class="mt-n1">
    <body-header-container>
      <template #header>
        <body-header :title="studentFullName">
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
import { useStore } from "vuex";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import OfferingView from "@/components/common/OfferingView.vue";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import { ApplicationOfferingDetailsAPIOutDTO } from "@/services/http/dto";
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
    const store = useStore();
    const studentFullName = computed(() => store.state.student.fullName);
    const changeRequest = ref({} as ApplicationOfferingDetailsAPIOutDTO);
    onMounted(async () => {
      changeRequest.value =
        await ApplicationOfferingChangeRequestService.shared.getApplicationOfferingDetailsById(
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
      studentFullName,
      headerDetailsData,
    };
  },
});
</script>
