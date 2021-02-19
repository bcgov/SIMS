<template>
  <div class="p-component">
    <div class="p-card p-m-4">
      <!-- Header -->
      <div class="p-grid">
        <h1 class="p-col-12 p-m-2">Tell us about your education plans…</h1>
        <div class="p-col-12 p-m-2">
          Please give us some more information about your education plans such
          us courses or programs you will be taking…
        </div>
      </div>
      <HorizontalSeparator />
      <!-- Header -->
      <!-- Body -->
      <!-- Institute -->
      <Section
        :title="questions.institute.title"
        :subTitle="questions.institute.subTitle"
      >
        <Question :text="questions.institute.question">
          <InstituteList
            v-model="response.instituteSelectValue"
            @change="onInstituteSelect"
          />
        </Question>
      </Section>
      <HorizontalSeparator />
      <!-- Institute -->
      <!-- Education Program-->
      <Section
        :title="questions.educationProgram.title"
        :subTitle="questions.educationProgram.subTitle"
      >
        <Question :text="questions.educationProgram.question">
          <EducationProgramList
            v-model="response.educationProgramSelectValue"
            :enable="enableEducationProgram"
            :institute="selectedInstitute"
          />
        </Question>
      </Section>
      <HorizontalSeparator />
      <!-- Education Program-->
      <!-- Body-->
    </div>
  </div>
</template>

<script lang="ts">
import { reactive, ref } from "vue";
import HorizontalSeparator from "../components/fa-application/HorizontalSeparator.vue";
import Section from "../components/fa-application/Section.vue";
import Question from "../components/fa-application/Question.vue";
import InstituteList from "../components/fa-application/InstituteList.vue";
import EducationProgramList from "../components/fa-application/EducationProgramList.vue";

const questions = {
  institute: {
    title: "Search for the institution you want to attend",
    subTitle: "Search for the institution you would like to attend",
    question: "The school I will be attending:",
  },
  educationProgram: {
    title: "Program Selection",
    subTitle: "Select the program that you will be attending",
    question: "The program I will be attending::",
  },
};

interface SelectProgramResponse {
  instituteSelectValue: any;
  educationProgramSelectValue: any;
}
export default {
  components: {
    HorizontalSeparator,
    Section,
    Question,
    InstituteList,
    EducationProgramList,
  },
  setup() {
    const response = reactive({} as SelectProgramResponse);
    const enableEducationProgram = ref(false);
    const selectedInstitute = ref(null);
    const onInstituteSelect = (event: any) => {
      enableEducationProgram.value = true;
      selectedInstitute.value = event.value;
    };
    return {
      questions,
      response,
      enableEducationProgram,
      onInstituteSelect,
      selectedInstitute,
    };
  },
};
</script>

<style lang="scss"></style>
