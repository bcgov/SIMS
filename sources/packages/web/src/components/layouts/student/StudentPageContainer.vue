<template>
  <full-page-container
    :layout-template="layoutTemplate"
    :full-width="fullWidth"
    :containerClass="containerClass"
  >
    <template #header>
      <slot name="header"></slot>
    </template>
    <template #alerts>
      <restriction-banner v-if="!hideRestriction" />
      <check-valid-s-i-n-banner />
    </template>
    <slot></slot>
  </full-page-container>
</template>
<script lang="ts">
import RestrictionBanner from "@/components/students/RestrictionBanner.vue";
import CheckValidSINBanner from "@/views/student/CheckValidSINBanner.vue";
import { LayoutTemplates } from "@/types";
import { PropType, defineComponent } from "vue";

export default defineComponent({
  components: { RestrictionBanner, CheckValidSINBanner },
  props: {
    layoutTemplate: {
      type: String as PropType<LayoutTemplates>,
      required: false,
      default: LayoutTemplates.CenteredCard,
    },
    fullWidth: {
      type: Boolean,
      required: false,
      default: false,
    },
    containerClass: {
      type: String,
      required: false,
      default: "",
    },
    hideRestriction: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
});
</script>
