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
      <application-header-title
        v-if="currentApplicationId"
        :application-id="currentApplicationId"
      />
    </template>
    <history-bypassed-restrictions
      v-if="currentApplicationId"
      :applicationId="currentApplicationId"
    />
  </full-page-container>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { defineComponent, onMounted, ref } from "vue";
import { useFormatters } from "@/composables";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";
import HistoryBypassedRestrictions from "@/components/aest/students/bypassedRestrictions/HistoryBypassedRestrictions.vue";
import { ApplicationService } from "@/services/ApplicationService";

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
  setup(props) {
    const { emptyStringFiller } = useFormatters();
    const currentApplicationId = ref<number>(0);

    onMounted(async () => {
      // Get current application for the parent application.
      const currentApplication = await ApplicationService.shared.getApplication(
        props.applicationId,
        { loadDynamicData: false, isParentApplication: true },
      );
      currentApplicationId.value = currentApplication.id;
    });

    return {
      AESTRoutesConst,
      emptyStringFiller,
      currentApplicationId,
    };
  },
});
</script>
