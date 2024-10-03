<template>
  <application-status-tracker-banner
    label="Draft application"
    content="Your application has not been submitted to StudentAid BC yet. Please complete and submit your application when you are ready."
    icon="fa:fas fa-pencil-alt"
    ><template #actions>
      <v-btn
        color="primary"
        @click="$emit('editApplication')"
        :disabled="!areApplicationActionsAllowed"
        >Continue application
      </v-btn>
    </template>
  </application-status-tracker-banner>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import ApplicationStatusTrackerBanner from "@/components/common/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
export default defineComponent({
  emits: ["editApplication"],
  components: {
    ApplicationStatusTrackerBanner,
  },
  props: {
    areApplicationActionsAllowed: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
});
</script>
