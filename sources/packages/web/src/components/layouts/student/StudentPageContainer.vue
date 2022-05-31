<template>
  <full-page-container
    :layout-template="layoutTemplate"
    :full-width="fullWidth"
  >
    <template #header>
      <slot name="header"></slot>
    </template>
    <template #alerts>
      <restriction-banner v-if="!hideRestriction" />
      <CheckValidSINBanner />
    </template>
    <slot name="content"></slot>
  </full-page-container>
</template>
<script lang="ts">
import RestrictionBanner from "@/components/students/RestrictionBanner.vue";
import CheckValidSINBanner from "@/views/student/CheckValidSINBanner.vue";
import { LayoutTemplates } from "@/types";

export default {
  components: { RestrictionBanner, CheckValidSINBanner },
  props: {
    layoutTemplate: {
      type: String,
      required: false,
      default: LayoutTemplates.CenteredCard,
      validator: (val: string) => val in LayoutTemplates,
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
};
</script>
