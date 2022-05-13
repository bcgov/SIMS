<template>
  <formio formName="noticeofassessment" :data="initialData"></formio>
</template>

<script lang="ts">
import { ref, watch } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { AssessmentNOAAPIOutDTO } from "@/services/http/dto";

export default {
  props: {
    assessmentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const initialData = ref({} as AssessmentNOAAPIOutDTO);

    watch(
      () => props.assessmentId,
      async () => {
        initialData.value =
          await StudentAssessmentsService.shared.getAssessmentNOA(
            props.assessmentId,
          );
      },
      { immediate: true },
    );

    return {
      initialData,
    };
  },
};
</script>
