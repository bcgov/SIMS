<template>
  <banner
    class="my-2"
    :type="BannerTypes.Error"
    :header="props.blockedReason"
    :summary="getBlockedReasonMessage(props.blockedReason)"
  />
</template>

<script setup lang="ts">
import { useFormSubmission } from "@/composables";
import { FormSubmissionBlockedReason, BannerTypes } from "@/types";

interface Props {
  blockedReason: FormSubmissionBlockedReason;
}

const props = defineProps<Props>();
const { getBlockedReasonMessage } = useFormSubmission();
</script>
