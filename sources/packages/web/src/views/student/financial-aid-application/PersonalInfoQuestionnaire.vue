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
    <FooterNavigator
      :previous="studentRoutesConst.FINANCIAL_AID_APPLICATION"
      :next="studentRoutesConst.SELECT_PROGRAM"
    />
  </div>
</template>

<script lang="ts">
import { reactive } from "vue";
import { studentRoutesConst } from "../../../constants/routes/RouteConstants";
import Section from "../../../components/generic/Section.vue";
import Question from "../../../components/generic/Question.vue";
import RadioButtonList from "../../../components/generic/RadioButtonList.vue";
import HorizontalSeparator from "../../../components/generic/HorizontalSeparator.vue";
import ConfirmStudentAidBCProfileInfo from "../../../components/partial-view/student/financial-aid-application/ConfirmStudentAidBCProfileInfo.vue";
import FooterNavigator from "../../../components/generic/FooterNavigator.vue";
import { questionsPI } from "../../../constants/fa-application/questions-personalinfo";

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
    FooterNavigator,
  },
  setup() {
    const personalInfoState = reactive({} as PersonalInfoState);

    return {
      questionsPI,
      personalInfoState,
      studentRoutesConst,
    };
  },
};
</script>

<style lang="scss"></style>
