<template>
  <div class="p-component">
    <div class="p-card p-m-4">
      <Section title="Confirm Submission Page..." />
      <FooterNavigator previous="financial-info" />
    </div>
  </div>
</template>

<script lang="ts">
import Section from "../../../components/generic/Section.vue";
import FooterNavigator from "../../../components/generic/FooterNavigator.vue";

export default {
  components: {
    Section,
    FooterNavigator,
  },
};
</script>

<style lang="scss"></style>
