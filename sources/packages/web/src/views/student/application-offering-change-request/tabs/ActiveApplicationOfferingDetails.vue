<template>
  <tab-container :enableCardView="false" class="mt-n1">
    <body-header-container>
      <template #header>
        <body-header :title="studentFullName" >
          <template #subtitle
            ><detail-header
              :headerMap="activeApplicationOfferingHeaderDetailsData"
          /></template>
        </body-header>
      </template>
      <hr class="horizontal-divider" />
      <h2 class="category-header-large primary-color">Application Details</h2>
      <offering-view
        :offeringId="activeApplicationOfferingDetails.activeOfferingId"
      />
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
    const activeApplicationOfferingDetails = ref(
      {} as ApplicationOfferingDetailsAPIOutDTO,
    );
    onMounted(async () => {
      activeApplicationOfferingDetails.value =
        await ApplicationOfferingChangeRequestService.shared.getApplicationOfferingDetails(
          props.applicationOfferingChangeRequestId,
        );
    });
    const activeApplicationOfferingHeaderDetailsData = computed(
      () =>
        ({
          "Application #":
            activeApplicationOfferingDetails.value.applicationNumber ?? "",
          Location: activeApplicationOfferingDetails.value.locationName,
        } as Record<string, string>),
    );
    return {
      activeApplicationOfferingDetails,
      studentFullName,
      activeApplicationOfferingHeaderDetailsData,
    };
  },
});
</script>
