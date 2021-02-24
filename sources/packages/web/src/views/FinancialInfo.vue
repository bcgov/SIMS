<template>
  <div class="p-component">
    <div class="p-card p-m-4">
      <Section title="More questions to come..." />
      <ContentGroup>
        <Section :title="questions.previousYearTaxReturn.title">
          <template #sub-title>
            <StringToHtmlParagraphs
              :text="questions.previousYearTaxReturn.subTitle"
            />
          </template>
          <Question :text="questions.previousYearTaxReturn.question">
            <InputNumber
              class="p-m-2"
              mode="currency"
              currency="USD"
              :maxFractionDigits="0"
              v-model="financialInfoState.previousYearTaxReturn"
            />
          </Question>
        </Section>
      </ContentGroup>
      <Section title="More questions to come..." />
    </div>
  </div>
</template>

<script lang="ts">
import { reactive } from "vue";
import Section from "../components/fa-application/Section.vue";
import Question from "../components/fa-application/Question.vue";
import ContentGroup from "../components/fa-application/ContentGroup.vue";
import StringToHtmlParagraphs from "../components/fa-application/StringToHtmlParagraphs.vue";

const questions = {
  previousYearTaxReturn: {
    title: "2020 Tax Return Income",
    subTitle: `Enter your reported total income from line 15000 of your 2019 Income Tax Return. This income will be matched with Canada Revenue Agency records, which may affect your assessment of need and/or grant eligibility.\nIf you did not file a 2019 Income Tax Return, enter your total income from all sources both inside AND outside of Canada`,
    question: "My total income in 2020 was:",
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
    StringToHtmlParagraphs,
  },
  setup() {
    const financialInfoState = reactive({} as FinancialInfoState);
    return {
      questions,
      financialInfoState,
    };
  },
};
</script>

<style lang="scss"></style>
