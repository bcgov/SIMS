<template>
  <formio-container formName="noticeOfAssessment" :formData="initialData" />
</template>

<script lang="ts">
import { watch, defineComponent, ref, onMounted } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { AssessmentNOAAPIOutDTO } from "@/services/http/dto";

interface NoticeOfAssessment extends AssessmentNOAAPIOutDTO {
  viewOnly?: boolean;
}

export default defineComponent({
  emits: ["assessmentData"],
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
  setup(props, { emit }) {
    const initialData = ref<NoticeOfAssessment>();

    // onMounted(async () => {});
    // ann : to chached  forms

    watch(
      () => [props.assessmentId, props.viewOnly],
      async () => {
        const assessment =
          await StudentAssessmentsService.shared.getAssessmentNOA(
            props.assessmentId,
          );
        initialData.value = { ...assessment, viewOnly: props.viewOnly };
        // emit(
        //   "assessmentData",
        //   initialData.value?.applicationStatus,
        //   initialData.value.noaApprovalStatus,
        // );
        // initialData.value = {
        //   ...(initialData.value as NoticeOfAssessment),
        //   viewOnly: props.viewOnly,
        // };
        console.log(initialData?.value, props.viewOnly);
        emit(
          "assessmentData",
          initialData.value?.applicationStatus,
          initialData.value.noaApprovalStatus,
        );
      },
    );
    return {
      initialData,
    };
  },
});
</script>
