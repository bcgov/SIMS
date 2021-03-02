<template>
  <div class="p-component">
    <div class="p-card p-m-4">
      <Section title="Confirm Submission Page..." />
      <FooterNavigator previous="financial-info" />
    </div>
  </div>
</template>

<script lang="ts">
import Section from "../components/fa-application/Section.vue";
import FooterNavigator from "../components/fa-application/FooterNavigator.vue";

export default {
  components: {
    Section,
    FooterNavigator,
  },
};
</script>

<style lang="scss"></style>
