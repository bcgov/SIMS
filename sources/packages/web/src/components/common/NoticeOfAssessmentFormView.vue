<template>
  <formio formName="noticeofassessment" :data="initialData"></formio>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import { ref, watch } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { AssessmentNOAAPIOutDTO } from "@/services/http/dto";

export default {
  components: { formio },
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
