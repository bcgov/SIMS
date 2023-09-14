<template>
  <v-card>
    <v-container>
      <body-header :title="studentName" class="m-1" />
      <header-title-value
        class="mb-2"
        title="Application#"
        :value="applicationNumber"
      ></header-title-value>
      <header-title-value
        class="mb-6"
        title="Location"
        :value="locationName"
      ></header-title-value>
      <content-group-info
        ><div class="mb-2">
          <h3 class="category-header-medium primary-color">
            Reason for change
          </h3>
          <p>{{ reasonForChange }}</p>
        </div>
      </content-group-info>
      <content-group-info
        v-if="
          applicationOfferingChangeRequestStatus ===
            ApplicationOfferingChangeRequestStatus.Approved ||
          applicationOfferingChangeRequestStatus ===
            ApplicationOfferingChangeRequestStatus.DeclinedBySABC
        "
        ><div class="mb-2">
          <h3 class="category-header-medium primary-color">
            Notes from StudentAid BC
          </h3>
          <p>{{ accessedNoteDescription }}</p>
        </div>
      </content-group-info>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { PropType, defineComponent } from "vue";
import HeaderTitleValue from "@/components/generic/HeaderTitleValue.vue";
import { ApplicationOfferingChangeRequestStatus } from "@/types";

export default defineComponent({
  components: { HeaderTitleValue },
  props: {
    studentName: {
      type: String,
      required: true,
    },
    applicationNumber: {
      type: Number,
      required: true,
    },
    locationName: {
      type: String,
      required: true,
    },
    reasonForChange: {
      type: String,
      required: true,
    },
    accessedNoteDescription: {
      type: String,
      required: true,
    },
    applicationOfferingChangeRequestStatus: {
      type: String as PropType<ApplicationOfferingChangeRequestStatus>,
      required: true,
    },
  },
  setup() {
    return { ApplicationOfferingChangeRequestStatus };
  },
});
</script>
