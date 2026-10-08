<template>
  <full-page-container
    :full-width="true"
    :layout-template="LayoutTemplates.Centered"
  >
    <template #header>
      <header-navigator
        title="Back to batch reassessment"
        :route-location="{ name: AESTRoutesConst.BATCH_REASSESSMENT }"
        sub-title="Batch manual reassessment results"
      />
    </template>
    <body-header-container :enable-card-view="true">
      <template #header>
        <body-header
          title="Batch manual reassessment results"
          sub-title="Review which applications were successfully reassessed and which failed, including any applicable error details."
        />
      </template>
      <content-group>
        <!-- TODO: Display the results for the batch manual reassessment. -->
        <p>Batch reassessment ID: {{ batchReassessmentId }}</p>
      </content-group>
    </body-header-container>
  </full-page-container>
</template>

<script setup lang="ts">
import { LayoutTemplates } from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

defineProps({
  batchReassessmentId: {
    type: Number,
    required: true,
  },
});
</script>
