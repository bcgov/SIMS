<template>
  <v-tabs color="primary">
    <v-tab
      :to="{
        name: applicationId
          ? StudentRoutesConst.STUDENT_APPLICATION_APPEAL_SUBMISSION
          : StudentRoutesConst.STUDENT_APPEAL_SUBMISSION,
        params: applicationId ? { applicationId } : undefined,
      }"
      value="appeal-submission"
    >
      <div>
        <v-icon start icon="mdi-scale-balance"></v-icon>
        <span class="mx-2 label-bold">Appeal Submission</span>
      </div>
    </v-tab>
    <v-tab
      :to="{
        name: applicationId
          ? StudentRoutesConst.STUDENT_APPLICATION_APPEAL_HISTORY
          : StudentRoutesConst.STUDENT_APPEAL_HISTORY,
        params: applicationId ? { applicationId } : undefined,
      }"
      value="appeal-history"
    >
      <div>
        <v-icon start icon="mdi-history"></v-icon>
        <span class="mx-2 label-bold">Appeal History</span>
      </div>
    </v-tab>
  </v-tabs>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";

export default defineComponent({
  props: {
    applicationId: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup() {
    return {
      StudentRoutesConst,
    };
  },
});
</script>
