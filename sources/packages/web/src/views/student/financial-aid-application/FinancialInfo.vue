<template>
  <div class="p-component">
    <div class="p-card p-m-4">
      <Section title="More questions to come..." />
      <ContentGroup>
        <Section
          type="secondary"
          :title="questionsFin.previousYearTaxReturn.title"
        >
          <template #sub-title>
            <StringToHtmlParagraphs
              :text="questionsFin.previousYearTaxReturn.subTitle"
            />
          </template>
          <Question :text="questionsFin.previousYearTaxReturn.question">
            <InputNumber
              class="p-m-2"
              mode="currency"
              currency="CAD"
              locale="en-CA"
              :maxFractionDigits="0"
              v-model="financialInfoState.previousYearTaxReturn"
            />
          </Question>
        </Section>
        <HorizontalSeparator />
        <Section type="additional" :title="questionsFin.craConsent.title">
          <template #sub-title>
            <ReadMoreContainer>
              <StringToHtmlParagraphs
                :text="questionsFin.craConsent.consentSummary"
              />
              <template #extended>
                <StringToHtmlParagraphs
                  :text="questionsFin.craConsent.consentExtended"
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
                      locale="en-CA"
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
      <FooterNavigator previous="select-program" next="confirm-submission" />
    </div>
  </div>
</template>

<script lang="ts">
import { reactive } from "vue";
import Section from "../../../components/generic/Section.vue";
import Question from "../../../components/generic/Question.vue";
import ContentGroup from "../../../components/generic/ContentGroup.vue";
import RadioButtonList from "../../../components/generic/RadioButtonList.vue";
import HorizontalSeparator from "../../../components/generic/HorizontalSeparator.vue";
import FooterNavigator from "../../../components/generic/FooterNavigator.vue";
import StringToHtmlParagraphs from "../../../components/generic/StringToHtmlParagraphs.vue";
import ReadMoreContainer from "../../../components/generic/ReadMoreContainer.vue";
import { questionsFin } from "../../../constants/fa-application/questions-financial";

interface FinancialInfoState {
  previousYearTaxReturn: number;
  craConsent: boolean;
  livingSituationValue: string;
  travelCostsValue: string;
  returnTripCostValue: number;
}

export default {
  components: {
    Section,
    Question,
    ContentGroup,
    HorizontalSeparator,
    StringToHtmlParagraphs,
    RadioButtonList,
    ReadMoreContainer,
    FooterNavigator,
  },
  setup() {
    const financialInfoState = reactive({} as FinancialInfoState);
    return {
      questionsFin,
      financialInfoState,
    };
  },
};
</script>

<style lang="scss"></style>
