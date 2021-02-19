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
                  view="month"
                  dateFormat="mm/yy"
                  class="p-mt-4"
                />
              </div>
              <div class="p-field p-col-12 p-md-6">
                <label for="education-end-date">Select Program End Date</label>
                <br />
                <Calendar
                  v-model="response.programEndDate"
                  view="month"
                  dateFormat="mm/yy"
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
      <div class="p-grid">
        <Button @click="onPrevious" class="p-col-2 p-m-6 p-button-outlined">
          Previous Section
        </Button>
        <Button @click="onNext" class="p-col-2 p-m-6">Next Section</Button>
      </div>
      <!-- Footer -->
    </div>
  </div>
</template>

<script lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
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
  },
  setup() {
    const response = reactive({} as SelectProgramResponse);
    const enableEducationProgram = ref(false);
    const selectedInstitute = ref(null);
    const onInstituteSelect = (event: any) => {
      enableEducationProgram.value = true;
      selectedInstitute.value = event.value;
    };
    // TODO: Create Reuseable interface in FAApplication view or some custom component to handle Next | Previous
    const router = useRouter();
    const onNext = () => {
      router.push("/application/financial-info");
    };
    const onPrevious = () => {
      router.push("/application/personal-info");
    };
    return {
      questions,
      response,
      enableEducationProgram,
      onInstituteSelect,
      selectedInstitute,
      onNext,
      onPrevious,
    };
  },
};
</script>

<style lang="scss"></style>
