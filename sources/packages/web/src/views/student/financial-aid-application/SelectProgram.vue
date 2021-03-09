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
        :title="questionsSelectProgram.institute.title"
        :subTitle="questionsSelectProgram.institute.subTitle"
      >
        <Question :text="questionsSelectProgram.institute.question">
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
        :title="questionsSelectProgram.educationProgram.title"
        :subTitle="questionsSelectProgram.educationProgram.subTitle"
      >
        <Question :text="questionsSelectProgram.educationProgram.question">
          <EducationProgramList
            v-model="response.educationProgramSelectValue"
            :enable="enableEducationProgram"
            :institute="selectedInstitute"
          />
          <br />
          <div :class="{ 'p-disabled': !enableEducationProgram }">
            <div class="p-grid p-formgrid">
              <div class="p-field p-col-12 p-md-6">
                <label for="education-start-date"
                  >Select Program Start Date</label
                >
                <br />
                <Calendar
                  v-model="response.programStartDate"
                  view="date"
                  dateFormat="dd/mm/yy"
                  class="p-mt-4"
                />
              </div>
              <div class="p-field p-col-12 p-md-6">
                <label for="education-end-date">Select Program End Date</label>
                <br />
                <Calendar
                  v-model="response.programEndDate"
                  view="date"
                  dateFormat="dd/mm/yy"
                  class="p-mt-4"
                />
              </div>
            </div>
          </div>
        </Question>
      </Section>
      <HorizontalSeparator />
      <!-- Education Program-->
      <!-- Body-->
      <!-- Footer-->
      <FooterNavigator
        v-bind:previous="personalInfo"
        v-bind:next="financialInfo"
      />
      <!-- Footer -->
    </div>
  </div>
</template>

<script lang="ts">
import { reactive, ref } from "vue";
import { routeConstants } from "../../../constants/routes/RouteConstants";
import HorizontalSeparator from "../../../components/generic/HorizontalSeparator.vue";
import Section from "../../../components/generic/Section.vue";
import Question from "../../../components/generic/Question.vue";
import InstituteList from "../../../components/partial-view/student/financial-aid-application/InstituteList.vue";
import EducationProgramList from "../../../components/partial-view/student/financial-aid-application/EducationProgramList.vue";
import FooterNavigator from "../../../components/generic/FooterNavigator.vue";
import { questionsSelectProgram } from "../../../constants/fa-application/questions-selectProgram";

interface SelectProgramResponse {
  instituteSelectValue: any;
  educationProgramSelectValue: any;
  programStartDate: any;
  programEndDate: any;
}
export default {
  components: {
    HorizontalSeparator,
    Section,
    Question,
    InstituteList,
    EducationProgramList,
    FooterNavigator,
  },
  setup() {
    const response = reactive({} as SelectProgramResponse);
    const enableEducationProgram = ref(false);
    const selectedInstitute = ref(null);
    const onInstituteSelect = (event: any) => {
      enableEducationProgram.value = true;
      selectedInstitute.value = event.value;
    };
    const financialInfo = routeConstants.FINANCIALINFO;
    const personalInfo = routeConstants.PERSONALINFO;
    return {
      questionsSelectProgram,
      response,
      enableEducationProgram,
      onInstituteSelect,
      selectedInstitute,
      financialInfo,
      personalInfo,
    };
  },
};
</script>

<style lang="scss"></style>
