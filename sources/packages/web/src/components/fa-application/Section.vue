<template>
  <div class="p-component p-mx-4">
    <div class="p-grid">
      <div class="p-col fa-section-header">{{ title }}</div>
    </div>
    <div class="p-grid">
      <div class="p-col">{{ subTitle }}</div>
    </div>
    <div class="p-grid">
      <div class="p-col">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    title: String,
    subTitle: String,
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
</style>
