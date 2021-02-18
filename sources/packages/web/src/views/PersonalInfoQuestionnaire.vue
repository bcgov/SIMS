<template>
  <div class="p-component p-m-8">
    <div class="p-grid">
      <ConfirmStudentAidBCProfileInfo />
    </div>
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
        <Question :text="questionnaire.sections.bankruptcy.question">
          <RadioButtonList
            name="residencyQuestion"
            v-model="personalInfoState.bankruptcySelectedValue"
            :options="questionnaire.sections.bankruptcy.options"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionnaire.sections.highschoolAttendance.title"
        :sub-title="questionnaire.sections.highschoolAttendance.subTitle"
      >
        <Question :text="questionnaire.sections.highschoolAttendance.question">
          <Calendar
            v-model="personalInfoState.highschoolAttendanceSelectedDate"
            view="month"
            dateFormat="mm/yy"
            class="p-mt-4"
          />
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionnaire.sections.relationship.title"
        :sub-title="questionnaire.sections.relationship.subTitle"
      >
        <Question :text="questionnaire.sections.relationship.question">
          <RadioButtonList
            name="relationshipQuestion"
            v-model="personalInfoState.relationshipSelectedValue"
            :options="questionnaire.sections.relationship.options"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionnaire.sections.employment.title"
        :sub-title="questionnaire.sections.employment.subTitle"
      >
        <Question :text="questionnaire.sections.employment.question">
          <RadioButtonList
            name="aboriginalStatusQuestion"
            v-model="personalInfoState.employmentStatusValue"
            :options="questionnaire.sections.employment.options"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionnaire.sections.aboriginalStatus.title"
        :sub-title="questionnaire.sections.aboriginalStatus.subTitle"
      >
        <Question :text="questionnaire.sections.aboriginalStatus.question">
          <RadioButtonList
            name="aboriginalStatusQuestion"
            v-model="personalInfoState.aboriginalStatusSelectedValue"
            :options="questionnaire.sections.aboriginalStatus.options"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionnaire.sections.youthInCare.title"
        :sub-title="questionnaire.sections.youthInCare.subTitle"
      >
        <Question :text="questionnaire.sections.youthInCare.question">
          <RadioButtonList
            name="youthInCareQuestion"
            v-model="personalInfoState.youthInCareSelectedValue"
            :options="questionnaire.sections.youthInCare.options"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionnaire.sections.permanentDisability.title"
        :sub-title="questionnaire.sections.permanentDisability.subTitle"
      >
        <Question :text="questionnaire.sections.permanentDisability.question">
          <RadioButtonList
            name="permanentDisabilityQuestion"
            v-model="personalInfoState.permanentDisabilitySelectedValue"
            :options="questionnaire.sections.permanentDisability.options"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionnaire.sections.dependentStatus.title"
        :sub-title="questionnaire.sections.dependentStatus.subTitle"
      >
        <Question :text="questionnaire.sections.dependentStatus.question">
          <RadioButtonList
            name="dependentStatusQuestion"
            v-model="personalInfoState.dependentStatusSelectedValue"
            :options="questionnaire.sections.dependentStatus.options"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
    </div>
    <Button @click="onNext" class="p-m-6">Next Section</Button>
  </div>
</template>

<script lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";
import Section from "../components/fa-application/Section.vue";
import Question from "../components/fa-application/Question.vue";
import RadioButtonList from "../components/fa-application/RadioButtonList.vue";
import HorizontalSeparator from "../components/fa-application/HorizontalSeparator.vue";
import ConfirmStudentAidBCProfileInfo from "../components/fa-application/ConfirmStudentAidBCProfileInfo.vue";

interface PersonalInfoState {
  residencySelectedValue: string;
  bcResidencySelectedValue: string;
  bankruptcySelectedValue: string;
  relationshipSelectedValue: string;
  employmentStatusValue: string;
  aboriginalStatusSelectedValue: string;
  youthInCareSelectedValue: string;
  permanentDisabilitySelectedValue: string;
  dependentStatusSelectedValue: string;
  highschoolAttendanceSelectedDate: Date;
}

const yesNoOptions = [
  { text: "Yes", value: "yes" },
  { text: "No", value: "no" },
];

// TODO: Refactor This into a simple static model
// TODO: Refactor import static texts from constant file
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
      question:
        "Have you ever declared bankruptcy that included financial assistance?",
      options: yesNoOptions,
    },
    highschoolAttendance: {
      title: "Date of Highschool Attendance",
      subTitle:
        "Please enter the date when you graduated or when you orginally left highschool before coming back to graduate.",
      question: " I graduated or left highschool on:",
    },
    relationship: {
      title: "Relationship Status",
      subTitle: "We use your relationship status to ensure you will receive.",
      question: "On my first day of class, I'll be:",
      options: [
        { text: "Single", value: "single" },
        { text: "Married", value: "married" },
        { text: "Common law", value: "commonlaw" },
        { text: "Separated/divorced/widowed", value: "separated" },
      ],
    },
    employment: {
      title: "Employment Information",
      subTitle:
        "StudentAid BC requires applicants not work a full-time of more than 32 hours per week for at least half of their study period.",
      question:
        "Will you be working a full-time job of 32 hours per week for more than half of your study period?",
      options: yesNoOptions,
    },
    aboriginalStatus: {
      title: "Aboriginal Status",
      subTitle: "Description of Indigenous heritage...",
      question: "Do you identify as an Aboriginal person?",
      options: yesNoOptions,
    },
    youthInCare: {
      title: "Youth In Care",
      subTitle:
        "If may be eligible to the following programs as a current/former youth in care (part of a foster family).",
      question:
        "I am a current/former youth in care and I want to apply for the Provincial Tuition Waiver Program and the Youth Educational Assistance Fund grants",
      options: yesNoOptions,
    },
    permanentDisability: {
      title: "Permanent Disability",
      subTitle:
        "Do you have a permanent disability that affects your studies on a daily basis?",
      question:
        "I have a permanent disability and want to apply for permanent disability grants:",
      options: yesNoOptions,
    },
    dependentStatus: {
      title: "Dependent",
      subTitle: "Please specify your dependent status",
      question: "Do you have any dependents?",
      options: yesNoOptions,
    },
  },
};

export default {
  components: {
    Section,
    Question,
    RadioButtonList,
    HorizontalSeparator,
    ConfirmStudentAidBCProfileInfo,
  },
  setup() {
    const personalInfoState = reactive({} as PersonalInfoState);
    const router = useRouter();
    const onNext = () => {
      console.log(`result: ${JSON.stringify(personalInfoState, null, 2)}`);
      router.push("/application/select-program");
    };
    return {
      questionnaire,
      personalInfoState,
      onNext,
    };
  },
};
</script>

<style lang="scss"></style>
