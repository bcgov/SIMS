<template>
  <full-page-container
    :layout-template="layoutTemplate"
    :full-width="fullWidth"
    :class="{ 'mobile-container': isMobile }"
  >
    <template #header>
      <slot name="header"></slot>
    </template>
    <template #alerts>
      <!-- Until the student account is created, the restriction and SIN banners are hidden. -->
      <restriction-banner v-if="!hideRestriction && hasStudentAccount" />
      <check-valid-s-i-n-banner v-if="hasStudentAccount" />
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
import { useStudentStore } from "@/composables";
import { useDisplay } from "vuetify";

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
  setup() {
    const { hasStudentAccount } = useStudentStore();
    const { mobile: isMobile } = useDisplay();
    return { hasStudentAccount, isMobile };
  },
});
</script>

<style scoped>
.mobile-container :deep(.v-container.v-container--fluid.v-locale--is-ltr) {
  padding: 0 !important;
}
</style>
