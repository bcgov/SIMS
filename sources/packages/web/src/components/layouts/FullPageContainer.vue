<template>
  <div :class="noSidebar ? 'no-sidebar' : ''">
    <header>
      <slot name="header"></slot>
      <slot name="sub-header"></slot>
    </header>
    <slot name="alerts"></slot>
    <v-container :fluid="fullWidth">
      <template v-if="layoutTemplate === LayoutTemplates.CenteredCard">
        <v-row justify="center">
          <v-card class="mt-4 p-4 w-100" :class="widthClass">
            <slot></slot>
          </v-card>
        </v-row>
      </template>
      <template v-else-if="layoutTemplate === LayoutTemplates.Centered">
        <v-row justify="center">
          <div class="mt-4 w-100" :class="widthClass">
            <slot></slot>
          </div>
        </v-row>
      </template>
      <template v-else-if="layoutTemplate === LayoutTemplates.CenteredTab">
        <v-row justify="center">
          <div class="mt-4 p-4 w-100" :class="widthClass">
            <slot name="tab-header"></slot><slot></slot>
          </div> </v-row
      ></template>
      <template v-else-if="layoutTemplate === LayoutTemplates.CenteredCardTab">
        <v-row justify="center">
          <div class="mt-4 p-4 w-100" :class="widthClass">
            <slot name="tab-header"></slot>
            <v-card class="mt-4 p-4"><slot></slot></v-card>
          </div>
        </v-row>
      </template>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed } from "vue";
import { LayoutTemplates } from "@/types";

export default {
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
    // Set noSidebar to true, when the page does not have a sidebar.
    noSidebar: {
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
<style scoped>
/* todo: ann move the style */
/* todo: ann for consistency safe create a const and use in all n-nav-drawer and style */
.no-sidebar {
  /* 256px is the default width of v-navigation-drawer, if its changes, adjust here too */
  margin-inline-start: 256px;
}
</style>
