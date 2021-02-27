<!--
Represents a section from the Student Application.
This section could be a primary one, a secondary one
(usualy a section inside a section) or some additional
section (usually a second section in a secondary).
-->
<template>
  <div class="p-component p-mx-4">
    <div class="p-grid">
      <div id="sectionTitle" :class="titleClassName" class="p-col">
        {{ title }}
      </div>
    </div>
    <div class="p-grid">
      <div class="p-col">
        <slot name="sub-title">{{ subTitle }}</slot>
      </div>
    </div>
    <div class="p-grid">
      <div class="p-col">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed } from "vue";

enum StyleTypes {
  primary = "primary",
  secondary = "secondary",
  additional = "additional",
}

export default {
  props: {
    title: String,
    subTitle: String,
    type: {
      type: String,
      default: StyleTypes.primary,
      validator: (prop: StyleTypes) => Object.values(StyleTypes).includes(prop),
    },
  },
  setup(props: any) {
    const titleClassName = computed(() => {
      switch (props.type) {
        case StyleTypes.secondary:
          return "fa-section-header-secondary";
        case StyleTypes.additional:
          return "fa-section-header-additional";
        default:
          return "fa-section-header";
      }
    });

    return { titleClassName };
  },
};
</script>

<style lang="scss">
.fa-section-header {
  font-family: Noto Sans;
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 27px;
  flex: none;
  order: 0;
  flex-grow: 0;
  margin: 4px 0px;
  color: #2965c5;
  line-height: 34px;
}
.fa-section-header-secondary {
  font-family: Noto Sans;
  font-style: normal;
  font-weight: bold;
  font-size: 17px;
  line-height: 22px;
  flex: none;
  order: 0;
  flex-grow: 0;
  margin: 8px 0px;
  color: #485363;
  line-height: 34px;
}
.fa-section-header-additional {
  font-family: Noto Sans;
  font-style: normal;
  font-weight: bold;
  font-size: 16px;
  line-height: 18px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #2965c5;
  flex: none;
  order: 4;
  align-self: stretch;
  flex-grow: 0;
  margin: 8px 0px;
}
</style>
