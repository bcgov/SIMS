<template>
  <!-- Banner for application scoped form submissions. -->
  <banner
    v-if="canShowApplicationScopedBanner"
    :type="BannerTypes.Warning"
    :header="applicationScopedBannerDetails!.header"
    :summary="applicationScopedBannerDetails!.summary"
  />
</template>
<script setup lang="ts">
import { BannerTypes, FormSubmissionCancellationReason } from "@/types";
import { computed } from "vue";

interface CancelledFormSubmissionBannerProps {
  isApplicationScoped: boolean;
  cancellationReason?: FormSubmissionCancellationReason;
}

interface BannerDetails {
  header: string;
  summary: string;
}

const props = withDefaults(defineProps<CancelledFormSubmissionBannerProps>(), {
  cancellationReason: undefined,
});
const canShowApplicationScopedBanner = computed(
  () => props.isApplicationScoped && !!props.cancellationReason,
);
const applicationScopedBannerDetails = computed<BannerDetails | undefined>(
  () => {
    if (!canShowApplicationScopedBanner.value) {
      return;
    }
    const header = "Appeal No Longer Active";
    switch (props.cancellationReason) {
      case FormSubmissionCancellationReason.StudentCancelledSubmission:
        return {
          header,
          summary:
            "Your appeal is no longer active and will not be considered when assessing your application. This is due to the appeal being cancelled by you. If you still require an appeal, you must submit a new appeal for your current application.",
        };
      case FormSubmissionCancellationReason.ApplicationCancelled:
        return {
          header,
          summary:
            "Your appeal is no longer active and will not be considered when assessing your application. This is due to you cancelling your application. If you still require an appeal, you must submit a new appeal for your current application.",
        };
      case FormSubmissionCancellationReason.ApplicationEdited:
        return {
          header,
          summary:
            "Your appeal is no longer active and will not be considered when assessing your application. This is due to you editing your application. If you still require an appeal, you must submit a new appeal for your current application.",
        };
      default:
        return {} as BannerDetails;
    }
  },
);
</script>
