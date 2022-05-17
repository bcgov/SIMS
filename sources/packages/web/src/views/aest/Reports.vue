<template>
  <v-container>
    <div class="mb-4">
      <header-navigator title="Assessment" subTitle="Notice of Assessment" />
    </div>
  </v-container>
  <full-page-container>
    <formio formName="exportfinancialreports"></formio>
  </full-page-container>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    assessmentId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    return { AESTRoutesConst };
  },
};
</script>
