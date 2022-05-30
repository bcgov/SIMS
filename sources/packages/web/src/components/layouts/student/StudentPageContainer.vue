<template>
  <full-page-container
    :layout-template="layoutTemplate"
    :full-width="fullWidth"
  >
    <template #header>
      <slot name="header"></slot>
    </template>
    <template #alerts>
      <restriction-banner />
      <CheckValidSINBanner />
    </template>
    <slot name="content"></slot>
  </full-page-container>
</template>
<script lang="ts">
import { computed } from "vue";
import RestrictionBanner from "@/views/student/RestrictionBanner.vue";
import CheckValidSINBanner from "@/views/student/CheckValidSINBanner.vue";
enum LayoutTemplates {
  Centered = "centered",
  CenteredCard = "centered-card",
}

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
  },
  setup(props: any) {
    const widthClass = computed(() => {
      return props.fullWidth ? "" : "full-page-container-size";
    });
    return { LayoutTemplates, widthClass };
  },
};
</script>
