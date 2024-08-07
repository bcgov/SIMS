<template>
  <full-page-container
    :layout-template="layoutTemplate"
    :full-width="fullWidth"
    v-bind="$attrs"
  >
    <template #header>
      <slot name="header"></slot>
    </template>
    <template #alerts>
      <restriction-banner v-if="!hideRestriction" />
      <check-valid-s-i-n-banner />
      <slot name="alerts"></slot>
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
    hideRestriction: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
});
</script>
