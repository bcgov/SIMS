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
      <Section
        :title="questions.sectionInstitute.title"
        :subTitle="questions.sectionInstitute.subTitle"
      >
        <Question :text="questions.sectionInstitute.question">
          <InstituteList v-model="response.instituteSelectValue" />
        </Question>
      </Section>
      <HorizontalSeparator />
      <!-- Body-->
    </div>
  </div>
</template>

<script lang="ts">
import { reactive } from "vue";
import HorizontalSeparator from "../components/fa-application/HorizontalSeparator.vue";
import Section from "../components/fa-application/Section.vue";
import Question from "../components/fa-application/Question.vue";
import InstituteList from "../components/fa-application/InstituteList.vue";

const questions = {
  sectionInstitute: {
    title: "Search for the institution you want to attend",
    subTitle: "Search for the institution you would like to attend",
    question: "The school I will be attending:",
  },
};

interface SelectProgramResponse {
  instituteSelectValue: any;
  programSelectValue: any;
}
export default {
  components: {
    HorizontalSeparator,
    Section,
    Question,
    InstituteList,
  },
  setup() {
    const response = reactive({} as SelectProgramResponse);
    return {
      questions,
      response,
    };
  },
};
</script>

<style lang="scss"></style>
