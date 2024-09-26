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
    <history-bypassed-restrictions
      class="mb-5"
      :applicationId="applicationId"
      :key="historyKey"
    />
  </full-page-container>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { defineComponent, ref } from "vue";
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
    const historyKey = ref(0);

    return {
      AESTRoutesConst,
      emptyStringFiller,
      historyKey,
    };
  },
});
</script>
