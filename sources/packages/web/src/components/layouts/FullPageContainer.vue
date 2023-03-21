<template>
  <div class="mx-5">
    <header>
      <slot name="header"></slot>
      <slot name="sub-header"></slot>
    </header>
    <div class="ml-5 mb-2">
      <slot name="details-header"></slot>
    </div>
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
          <div class="w-100" :class="widthClass">
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
import { computed, defineComponent, PropType } from "vue";
import { LayoutTemplates } from "@/types";

export default defineComponent({
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
  },
  setup(props) {
    const widthClass = computed(() => {
      return props.fullWidth ? "" : "full-page-container-size";
    });
    return { LayoutTemplates, widthClass };
  },
});
</script>
