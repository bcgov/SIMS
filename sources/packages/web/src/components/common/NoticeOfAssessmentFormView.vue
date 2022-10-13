<template>
  <formio-container formName="noticeOfAssessment" :formData="initialData" />
</template>

<script lang="ts">
import { watch, defineComponent, ref } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { AssessmentNOAAPIOutDTO } from "@/services/http/dto";

interface NoticeOfAssessment extends AssessmentNOAAPIOutDTO {
  viewOnly?: boolean;
}

export default defineComponent({
  props: {
    assessmentId: {
      type: Number,
      required: true,
    },
    viewOnly: {
      type: Boolean,
      required: false,
    },
  },
  setup(props) {
    const initialData = ref<NoticeOfAssessment>();
    watch(
      () => [props.assessmentId, props.viewOnly],
      async () => {
        const assessment =
          await StudentAssessmentsService.shared.getAssessmentNOA(
            props.assessmentId,
          );
        initialData.value = { ...assessment, viewOnly: props.viewOnly };
      },
      { immediate: true },
    );

    return {
      initialData,
    };
  },
});
</script>
