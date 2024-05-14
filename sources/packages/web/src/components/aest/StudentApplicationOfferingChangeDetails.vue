<template>
  <body-header-container :enableCardView="true"
    ><template #header>
      <body-header
        :title="applicationOfferingChangeDetails.studentName"
        title-header-level="2"
      />
      <header-title-value
        class="mb-2"
        title="Application #"
        :value="applicationOfferingChangeDetails.applicationNumber"
      ></header-title-value>
    </template>
    <content-group-info>
      <h3 class="category-header-medium primary-color">Reason for change</h3>
      <p>{{ applicationOfferingChangeDetails.reasonForChange }}</p>
    </content-group-info>
    <content-group-info
      v-if="
        applicationOfferingChangeDetails.applicationOfferingChangeRequestStatus ===
          ApplicationOfferingChangeRequestStatus.Approved ||
        applicationOfferingChangeDetails.applicationOfferingChangeRequestStatus ===
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC
      "
    >
      <h3 class="category-header-medium primary-color">
        Notes from StudentAid BC
      </h3>
      <p>{{ applicationOfferingChangeDetails.accessedNoteDescription }}</p>
    </content-group-info>
  </body-header-container>
</template>

<script lang="ts">
import { PropType, defineComponent } from "vue";
import { ApplicationOfferingChangeRequestStatus } from "@/types";
import { ApplicationOfferingDetails } from "@/types/contracts/StudentApplicationOfferingChangeContract";

export default defineComponent({
  props: {
    applicationOfferingChangeDetails: {
      type: Object as PropType<ApplicationOfferingDetails>,
      required: true,
    },
  },
  setup() {
    return { ApplicationOfferingChangeRequestStatus };
  },
});
</script>
