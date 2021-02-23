<template>
  <div class="p-component">
    <div class="p-card p-m-4">
      <div class="p-grid">
        <Section title="More questions to come..." />
        <ContentGroup>
          <Section
            :title="questions.previousYearTaxReturn.title"
            :sub-title="questions.previousYearTaxReturn.subTitle"
          >
            <Question :text="questions.previousYearTaxReturn.question">
              <span class="p-input-icon-left p-m-2">
                <i class="pi pi-dollar" />
                <InputText
                  type="number"
                  v-model.number="financialInfoState.previousYearTaxReturn"
                />
              </span>
            </Question>
          </Section>
        </ContentGroup>
        <Section title="More questions to come..." />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";
import Section from "../components/fa-application/Section.vue";
import Question from "../components/fa-application/Question.vue";
import ContentGroup from "../components/fa-application/ContentGroup.vue";

const questions = {
  previousYearTaxReturn: {
    title: "2019 Tax Return Income",
    subTitle: `Enter your reported total income from line 15000 of your 2019 Income Tax Return. This income will be matched with Canada Revenue Agency records, which may affect your assessment of need and/or grant eligibility. 
               If you did not file a 2019 Income Tax Return, enter your total income from all sources both inside AND outside of Canada`,
    question: "My total income in 2019 was:",
  },
};

interface FinancialInfoState {
  previousYearTaxReturn: number;
}
export default {
  components: {
    Section,
    Question,
    ContentGroup,
  },
  setup() {
    const financialInfoState = reactive({} as FinancialInfoState);
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
      financialInfoState,
      onNext,
      onPrevious,
    };
  },
};
</script>

<style lang="scss"></style>
