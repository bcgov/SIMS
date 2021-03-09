<template>
  <div class="p-component">
    <div class="p-card p-m-4">
      <Section title="Confirm Submission Page..." />
      <FooterNavigator v-bind:previous="financialInfo" />
    </div>
  </div>
</template>

<script lang="ts">
import Section from "../../../components/generic/Section.vue";
import FooterNavigator from "../../../components/generic/FooterNavigator.vue";
import { routeConstants } from "../../../constants/routes/RouteConstants";

export default {
  components: {
    Section,
    FooterNavigator,
  },
  setup() {
    const financialInfo = routeConstants.FINANCIALINFO;
    return {
      financialInfo,
    };
  },
};
</script>

<style lang="scss"></style>
