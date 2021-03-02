<template>
  <div class="p-component p-m-8">
    <div class="p-grid">
      <ConfirmStudentAidBCProfileInfo />
    </div>
    <div class="p-grid">
      <Section
        :title="questionsPI.sections.residency.title"
        :sub-title="questionsPI.sections.residency.subTitle"
      >
        <Question
          :text="questionsPI.sections.residency.questions.residencyQuestion"
        >
          <RadioButtonList
            name="residencyQuestion"
            v-model="personalInfoState.residencySelectedValue"
            :options="questionsPI.sections.residency.questions.options"
          >
          </RadioButtonList>
        </Question>
        <Question
          :text="questionsPI.sections.residency.questions.bcResidencyQuestion"
        >
          <RadioButtonList
            name="bcResidencyQuestion"
            v-model="personalInfoState.bcResidencySelectedValue"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionsPI.sections.bankruptcy.title"
        :sub-title="questionsPI.sections.bankruptcy.subTitle"
      >
        <Question :text="questionsPI.sections.bankruptcy.question">
          <RadioButtonList
            name="residencyQuestion"
            v-model="personalInfoState.bankruptcySelectedValue"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionsPI.sections.highschoolAttendance.title"
        :sub-title="questionsPI.sections.highschoolAttendance.subTitle"
      >
        <Question :text="questionsPI.sections.highschoolAttendance.question">
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
        :title="questionsPI.sections.relationship.title"
        :sub-title="questionsPI.sections.relationship.subTitle"
      >
        <Question :text="questionsPI.sections.relationship.question">
          <RadioButtonList
            name="relationshipQuestion"
            v-model="personalInfoState.relationshipSelectedValue"
            :options="questionsPI.sections.relationship.options"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionsPI.sections.employment.title"
        :sub-title="questionsPI.sections.employment.subTitle"
      >
        <Question :text="questionsPI.sections.employment.question">
          <RadioButtonList
            name="aboriginalStatusQuestion"
            v-model="personalInfoState.employmentStatusValue"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionsPI.sections.aboriginalStatus.title"
        :sub-title="questionsPI.sections.aboriginalStatus.subTitle"
      >
        <Question :text="questionsPI.sections.aboriginalStatus.question">
          <RadioButtonList
            name="aboriginalStatusQuestion"
            v-model="personalInfoState.aboriginalStatusSelectedValue"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionsPI.sections.youthInCare.title"
        :sub-title="questionsPI.sections.youthInCare.subTitle"
      >
        <Question :text="questionsPI.sections.youthInCare.question">
          <RadioButtonList
            name="youthInCareQuestion"
            v-model="personalInfoState.youthInCareSelectedValue"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionsPI.sections.permanentDisability.title"
        :sub-title="questionsPI.sections.permanentDisability.subTitle"
      >
        <Question :text="questionsPI.sections.permanentDisability.question">
          <RadioButtonList
            name="permanentDisabilityQuestion"
            v-model="personalInfoState.permanentDisabilitySelectedValue"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
      <Section
        :title="questionsPI.sections.dependentStatus.title"
        :sub-title="questionsPI.sections.dependentStatus.subTitle"
      >
        <Question :text="questionsPI.sections.dependentStatus.question">
          <RadioButtonList
            name="dependentStatusQuestion"
            v-model="personalInfoState.dependentStatusSelectedValue"
          >
          </RadioButtonList>
        </Question>
      </Section>
      <HorizontalSeparator />
    </div>
    <div class="p-grid">
      <Button
        @click="onPrevious"
        class="p-col-2 p-m-6 p-button-outlined"
        style="text-color: "
      >
        Previous Section
      </Button>
      <Button @click="onNext" class="p-col-2 p-m-6">Next Section</Button>
    </div>
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
import { questionsPI } from "../constants/fa-application/questions-personalinfo";

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

// TODO: Refactor This into a simple static model

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
      router.push("/application/select-program");
    };
    const onPrevious = () => {
      router.push("/application");
    };
    return {
      questionsPI,
      personalInfoState,
      onNext,
      onPrevious,
    };
  },
};
</script>

<style lang="scss"></style>
