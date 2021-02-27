<template>
  <div class="p-component">
    <div class="p-card p-m-4">
      <Section title="More questions to come..." />
      <ContentGroup>
        <Section
          type="secondary"
          :title="questions.previousYearTaxReturn.title"
        >
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
        <HorizontalSeparator />
        <Section type="additional" :title="questions.craConsent.title">
          <template #sub-title>
            <ReadMoreContainer>
              <StringToHtmlParagraphs
                :text="questions.craConsent.consentSummary"
              />
              <template #extended>
                <StringToHtmlParagraphs
                  :text="questions.craConsent.consentExtended"
                />
              </template>
            </ReadMoreContainer>
          </template>
          <div class="p-field-checkbox p-mt-3">
            <Checkbox
              id="craConsent"
              v-model="financialInfoState.craConsent"
              :binary="true"
            />
            <label for="craConsent"
              >I give the Canadian Revenue Agency consent to verify the data I
              have provided in my application.</label
            >
          </div>
        </Section>
      </ContentGroup>
      <ContentGroup>
        <Section
          :title="questionsFin.livingSituation.title"
          :sub-title="questionsFin.livingSituation.subTitle"
        >
          <Question :text="questionsFin.livingSituation.question">
            <RadioButtonList
              name="livingSituation"
              v-model="financialInfoState.livingSituationValue"
            >
            </RadioButtonList>
          </Question>
          <ContentGroup v-if="financialInfoState.livingSituationValue === 'no'">
            <Section>
              <Question :text="questionsFin.travelCosts.question">
                <RadioButtonList
                  name="travelCosts"
                  v-model="financialInfoState.travelCostsValue"
                >
                </RadioButtonList>
              </Question>

              <ContentGroup
                v-if="financialInfoState.travelCostsValue === 'yes'"
              >
                <Section>
                  <Question :text="questionsFin.returnTripCosts.question">
                    <InputNumber
                      class="p-m-2"
                      mode="currency"
                      currency="CAD"
                      :maxFractionDigits="2"
                      v-model="financialInfoState.returnTripCostValue"
                    />
                  </Question>
                </Section>
              </ContentGroup>
            </Section>
          </ContentGroup>
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
import ContentGroup from "../components/ContentGroup.vue";
import RadioButtonList from "../components/fa-application/RadioButtonList.vue";
import HorizontalSeparator from "../components/fa-application/HorizontalSeparator.vue";
import StringToHtmlParagraphs from "../components/StringToHtmlParagraphs.vue";
import ReadMoreContainer from "../components/ReadMoreContainer.vue";
import { questionsFin } from "../helpers/questions-financial";

interface FinancialInfoState {
  previousYearTaxReturn: number;
  craConsent: boolean;
  livingSituationValue: string;
  travelCostsValue: string;
  returnTripCostValue: number;
}
const questions = {
  previousYearTaxReturn: {
    title: "2020 Tax Return Income",
    subTitle:
      "Enter your reported total income from line 15000 of your 2020 Income Tax Return. This income will be matched with Canada Revenue Agency records, which may affect your assessment of need and/or grant eligibility.\nIf you did not file a 2020 Income Tax Return, enter your total income from all sources both inside AND outside of Canada",
    question: "My total income in 2020 was:",
  },
  craConsent: {
    title: "Canada Revenue Agency consent",
    consentSummary:
      "For the purpose of verifying the data provided in this application for student assistance, I hereby consent to the release, by the Canada Revenue Agency, to the Ministry of Advanced Education, Skills and Training (or a person delegated by the ministry), of taxpayer information from any portion of my income tax records that pertains to information given by me on any StudentAid BC application.",
    consentExtended:
      "The information will be relevant to, and used solely for the purpose of determining and verifying my information and for my spouse’s eligibility for and entitlement to the following programs: Canada Student Grant for students with Permanent Disabilities, the BC Supplemental Bursary for Students with a Permanent Disability, Canada Student Grant for Part-time Students, Canada Student Loan for Part-time Studies, and if eligible, Canada Student Grant for Part-time Students with Dependants under the Canada Student Financial Assistance Act.\nThis information will not be disclosed to any other person or organization without my prior approval. This authorization is valid for the two taxation years prior to the year of signature of this consent, the year of signature of this consent and for any other subsequent consecutive taxation year for which assistance is requested.",
  },
};

export default {
  components: {
    Section,
    Question,
    ContentGroup,
    HorizontalSeparator,
    StringToHtmlParagraphs,
    RadioButtonList,
    ReadMoreContainer,
  },
  setup() {
    const financialInfoState = reactive({} as FinancialInfoState);
    return {
      questions,
      questionsFin,
      financialInfoState,
    };
  },
};
</script>

<style lang="scss"></style>
