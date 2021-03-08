<template>
  <div class="fa-question p-m-2">
    <div class="p-grid">
      <div class="fa-question-text">{{ text }}</div>
    </div>
    <div class="p=grid">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
interface QuestionProp {
  text: string;
}
export default {
  props: {
    text: String,
  },
};
</script>

<style lang="scss">
.fa-question {
  margin-top: 20px;
}
.fa-question-text {
  font-family: Noto Sans;
  font-style: normal;
  font-weight: bold;
  font-size: 18px;
  line-height: 20px;
  /* identical to box height, or 129% */

  letter-spacing: -0.25px;

  color: #606c7f;

  mix-blend-mode: normal;

  /* Inside Auto Layout */

  flex: none;
  order: 0;
  flex-grow: 1;
}
</style>
