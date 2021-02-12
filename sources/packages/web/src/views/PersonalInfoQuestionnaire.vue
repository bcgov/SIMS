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
      <HorizontalSeparator />
      <Section
        :title="questionnaire.sections.bankruptcy.title"
        :sub-title="questionnaire.sections.bankruptcy.subTitle"
      >
        <Question
          :text="questionnaire.sections.bankruptcy.questions.bankruptcyQuestion"
        >
          <RadioButtonList
            name="residencyQuestion"
            v-model="personalInfoState.bankruptcySelectedValue"
            :options="
              questionnaire.sections.bankruptcy.questions
                .residencyQuestionOptions
            "
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionnaire.sections.relationship.title"
        :sub-title="questionnaire.sections.relationship.subTitle"
      >
        <Question
          :text="
            questionnaire.sections.relationship.questions.relationshipQuestion
          "
        >
          <RadioButtonList
            name="relationshipQuestion"
            v-model="personalInfoState.relationshipSelectedValue"
            :options="
              questionnaire.sections.relationship.questions.relationshipOptions
            "
          >
          </RadioButtonList>
        </Question>
      </Section>
    </div>
    <!-- Only to test the v-model binding, please remove -->
    <Button @click="printState" class="p-mx-5">Print</Button>
  </div>
</template>

<script lang="ts">
import { reactive } from "vue";
import Section from "../components/fa-application/Section.vue";
import Question from "../components/fa-application/Question.vue";
import RadioButtonList from "../components/fa-application/RadioButtonList.vue";
import HorizontalSeparator from "../components/fa-application/HorizontalSeparator.vue";

interface PersonalInfoState {
  residencySelectedValue: string;
  bcResidencySelectedValue: string;
  bankruptcySelectedValue: string;
  relationshipSelectedValue: string;
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
    bankruptcy: {
      title: "Bankruptcy",
      subTitle:
        "StudentAid BC requires that applicants have not previously declared bankruptcy.",
      questions: {
        bankruptcyQuestion:
          "Have you ever declared bankruptcy that included financial assistance?",
        residencyQuestionOptions: yesNoOptions,
      },
    },
    relationship: {
      title: "Relationship Status",
      subTitle: "We use your relationship status to ensure you will receive.",
      questions: {
        relationshipQuestion: "On my first day of class, I'll be:",
        relationshipOptions: [
          { text: "Single", value: "single" },
          { text: "Single parent", value: "singleparent" },
          { text: "Common law", value: "commonlaw" },
          { text: "Separated/divorced/widowed", value: "separated" },
        ],
      },
    },
  },
};

export default {
  components: {
    Section,
    Question,
    RadioButtonList,
    HorizontalSeparator,
  },
  setup() {
    const personalInfoState = reactive({} as PersonalInfoState);
    const printState = () => {
      console.log(personalInfoState.residencySelectedValue);
      console.log(personalInfoState.bcResidencySelectedValue);
      console.log(personalInfoState.bankruptcySelectedValue);
      console.log(personalInfoState.relationshipSelectedValue);
    };
    return {
      questionnaire,
      personalInfoState,
      printState,
    };
  },
};
</script>

<style lang="scss"></style>
