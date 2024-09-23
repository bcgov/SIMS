<template>
  <full-page-container layout-template="centered">
    <template #header>
      <header-navigator
        title="Application history"
        :routeLocation="{
          name: AESTRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId },
        }"
        subTitle="Application Restriction Management"
      />
    </template>
    <history-bypassed-restrictions
      class="mb-5"
      :applicationId="applicationId"
      @viewBypassDetails="goToViewBypassDetails"
      @viewRemoveBypass="gotToViewRemoveBypass"
      :key="historyKey"
    />
  </full-page-container>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { defineComponent, ref } from "vue";
import HistoryBypassedRestrictions from "@/components/aest/students/bypassedRestrictions/HistoryBypassedRestrictions.vue";

export default defineComponent({
  components: {
    HistoryBypassedRestrictions,
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
    const historyKey = ref(0);

    const gotToViewRemoveBypass = (bypassRestrictionId: number) => {
      // ToDo: Build modal for when Ministry selects "View Details" and the Bypass is active.
      return bypassRestrictionId;
    };

    const goToViewBypassDetails = (bypassRestrictionId: number) => {
      // ToDo: Build modal for when Ministry selects "Remove Bypass".
      return bypassRestrictionId;
    };

    const reloadHistory = () => {
      // Changing component's key makes it to re-render/reload.
      historyKey.value++;
    };

    return {
      AESTRoutesConst,
      gotToViewRemoveBypass,
      goToViewBypassDetails,
      historyKey,
      reloadHistory,
    };
  },
});
</script>
