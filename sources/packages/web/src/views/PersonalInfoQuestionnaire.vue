<template>
  <div class="p-component">
    <div class="p-grid">
      <Section
        :title="questionnaire.sections.residency.title"
        :sub-title="questionnaire.sections.residency.subTitle"
      >
        <Question
          :text="questionnaire.sections.residency.questions.residencyQuestion"
        >
          <RadioButtonList
            name="residencyQuestion"
            v-model="personalInfoState.residencySelectedValue"
            :options="
              questionnaire.sections.residency.questions
                .residencyQuestionOptions
            "
          >
          </RadioButtonList>
        </Question>
        <Question
          :text="questionnaire.sections.residency.questions.bcResidencyQuestion"
        >
          <RadioButtonList
            name="bcResidencyQuestion"
            v-model="personalInfoState.bcResidencySelectedValue"
            :options="
              questionnaire.sections.residency.questions
                .bcResidencyQuestionOptions
            "
          >
          </RadioButtonList>
        </Question>
      </Section>
    </div>
  </div>
</template>

<script lang="ts">
import { reactive } from "vue";
import Section from "../components/fa-application/Section.vue";
import Question from "../components/fa-application/Question.vue";
import RadioButtonList from "../components/fa-application/RadioButtonList.vue";

interface PersonalInfoState {
  residencySelectedValue: string;
  bcResidencySelectedValue: string;
}

const yesNoOptions = [
  { text: "Yes", value: "yes" },
  { text: "No", value: "no" },
];

const questionnaire = {
  sections: {
    residency: {
      title: "Citizen and Residency",
      subTitle:
        "You must meet B.C. residency requirements to receive funding through StudentAid BC",
      questions: {
        residencyQuestion: "On my first day of class, I'll be a:",
        residencyQuestionOptions: [
          { text: "Canadian citizen", value: "canadian" },
          { text: "Protected person", value: "protected" },
          { text: "Permanent resident", value: "pr" },
        ],
        bcResidencyQuestion:
          "I have lived in B.C. for at least 12 consecutive months without being a full-time post-secondary student",
        bcResidencyQuestionOptions: yesNoOptions,
      },
    },
  },
};

export default {
  components: {
    Section,
    Question,
    RadioButtonList,
  },
  setup() {
    const personalInfoState = reactive({} as PersonalInfoState);
    return {
      questionnaire,
      personalInfoState,
    };
  },
};
</script>

<style lang="scss"></style>
