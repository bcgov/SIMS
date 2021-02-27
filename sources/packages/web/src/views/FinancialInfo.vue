<template>
  <div class="p-component">
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

    <ContentGroup>
      <Section
        :title="questions.livingSituationTravelCosts.title"
        :sub-title="questions.livingSituationTravelCosts.subTitle"
      >
        <Question :text="questions.livingSituationTravelCosts.question">
          <RadioButtonList
            name="livingSituationTravelCosts"
            v-model="financialInfoState.livingSituationTravelCostsValue"
          >
          </RadioButtonList>
        </Question>
      </Section>
    </ContentGroup>
  </div>
</template>

<script lang="ts">
import { reactive } from "vue";
import Section from "../components/fa-application/Section.vue";
import Question from "../components/fa-application/Question.vue";
import ContentGroup from "../components/ContentGroup.vue";
import RadioButtonList from "../components/fa-application/RadioButtonList.vue";
import StringToHtmlParagraphs from "../components/StringToHtmlParagraphs.vue";
import { questions } from "../helpers/questions-financial";

interface FinancialInfoState {
  previousYearTaxReturn: number;
  livingSituationTravelCostsValue: string;
}
export default {
  components: {
    Section,
    Question,
    ContentGroup,
    StringToHtmlParagraphs,
    RadioButtonList,
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
