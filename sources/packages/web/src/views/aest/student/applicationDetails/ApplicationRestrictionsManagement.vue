<template>
  <full-page-container layout-template="centered">
    <template #header>
      <header-navigator
        title="Student Applications"
        :routeLocation="{
          name: AESTRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId },
        }"
        subTitle="Application Restriction Management"
      />
      <application-header-title :application-id="applicationId" />
    </template>
    <history-bypassed-restrictions :applicationId="applicationId" />
  </full-page-container>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { defineComponent } from "vue";
import { useFormatters } from "@/composables";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";
import HistoryBypassedRestrictions from "@/components/aest/students/bypassedRestrictions/HistoryBypassedRestrictions.vue";

export default defineComponent({
  components: {
    HistoryBypassedRestrictions,
    ApplicationHeaderTitle,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const { emptyStringFiller } = useFormatters();

    return {
      AESTRoutesConst,
      emptyStringFiller,
    };
  },
});
</script>
