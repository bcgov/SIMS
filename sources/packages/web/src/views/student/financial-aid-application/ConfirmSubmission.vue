<template>
  <div class="p-component">
    <div class="p-card p-m-4">
      <Section title="Confirm Submission Page..." />
      <FooterNavigator :previous="StudentRoutesConst.FINANCIAL_INFO" />
    </div>
  </div>
</template>

<script lang="ts">
import Section from "../../../components/generic/Section.vue";
import FooterNavigator from "../../../components/generic/FooterNavigator.vue";
import { StudentRoutesConst } from "../../../constants/routes/RouteConstants";

export default {
  components: {
    Section,
    FooterNavigator,
  },
  setup() {
    return {
      StudentRoutesConst,
    };
  },
};
</script>

<style lang="scss"></style>
