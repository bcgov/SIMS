<template>
  <full-page-container layout-template="centered">
    <template #header>
      <header-navigator
        title="Application history"
        :routeLocation="{
          name: AESTRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId },
        }"
        subTitle="Application Status"
      />
      <application-header-title :application-id="currentApplicationId" />
    </template>
    <application-progress-bar
      :application-id="currentApplicationId"
    ></application-progress-bar>
  </full-page-container>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { defineComponent, onMounted, ref } from "vue";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";
import ApplicationProgressBar from "@/components/common/applicationTracker/ApplicationProgressBar.vue";
import { ApplicationService } from "@/services/ApplicationService";

export default defineComponent({
  components: {
    ApplicationProgressBar,
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
    const currentApplicationId = ref<number>();

    onMounted(async () => {
      // Get current application for the parent application.
      const currentApplication =
        await ApplicationService.shared.getCurrentApplicationFromParent(
          props.applicationId,
        );
      currentApplicationId.value = currentApplication.id;
    });
    return {
      AESTRoutesConst,
      currentApplicationId,
    };
  },
});
</script>
