<template>
  <div class="p-component">
    <div class="p-grid">
      <Section
        :title="questionnaire.sections.residency.title"
        :sub-title="questionnaire.sections.residency.subTitle"
      >
        <Question
          :text="questionnaire.sections.residency.questions.residencyQuestion"
        ></Question>
        <Question
          :text="questionnaire.sections.residency.questions.bcResidencyQuestion"
        ></Question>
      </Section>
    </div>
  </div>
</template>

<script lang="ts">
import Section from "../components/fa-application/Section.vue";
import Question from "../components/fa-application/Question.vue";

const questionnaire = {
  sections: {
    residency: {
      title: "Citizen and Residency",
      subTitle:
        "You must meet B.C. residency requirements to receive funding through StudentAid BC",
      questions: {
        residencyQuestion: "On my first day of class, I'll be a:",
        bcResidencyQuestion:
          "I have lived in B.C. for at least 12 consecutive months without being a full-time post-secondary student",
      },
    },
  },
};

export default {
  components: {
    Section,
    Question,
  },
  setup() {
    return {
      questionnaire,
    };
  },
};
</script>

<style lang="scss">
</style>