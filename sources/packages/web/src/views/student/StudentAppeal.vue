<template>
  <student-page-container class="overflow-visible">
    <template #header>
      <header-navigator
        title="Applications"
        subTitle="Submit Appeal"
        :routeLocation="{
          name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
        }"
      />
    </template>
    <student-appeal-submit
      :application-id="applicationId"
      appeals-form-name="studentAppeals"
      ><template #select-appeal-header>
        <body-header
          title="When to submit an appeal"
          subTitle="After your school has confirmed your enrolment, you must inform StudentAid BC of any changes to the information you provided in your application."
        >
        </body-header>
        <student-appeal-instructions />
      </template>
      <template #submit-appeal-header>
        <body-header
          title="Complete all question(s) below"
          subTitle="All requested changes will be reviewed by StudentAid BC after you submit for review."
        >
        </body-header>
        <student-appeal-instructions /> </template
    ></student-appeal-submit>
  </student-page-container>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import StudentAppealSubmit from "@/components/students/StudentAppealSubmit.vue";
import StudentAppealInstructions from "@/components/students/StudentAppealInstructions.vue";

export default defineComponent({
  components: {
    StudentAppealSubmit,
    StudentAppealInstructions,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    return {
      StudentRoutesConst,
    };
  },
});
</script>
