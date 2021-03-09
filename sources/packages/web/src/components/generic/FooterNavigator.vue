<template>
  <div class="p-d-flex p-jc-between p-m-2 p-pb-2">
    <div>
      <Button v-if="previous" @click="onPrevious" class="p-button-outlined"
        >Previous Section</Button
      >
    </div>
    <div>
      <Button v-if="next" @click="onNext">Next Section</Button>
    </div>
  </div>
</template>

<script lang="ts">
import { useRouter } from "vue-router";

export default {
  props: {
    previous: Symbol,
    next: Symbol,
  },
  setup(props: any) {
    const router = useRouter();
    const onPrevious = () => {
      if (props.previous) {
        router.push({ name: props.previous });
      }
    };
    const onNext = () => {
      if (props.next) {
        router.push({ name: props.next });
      }
    };

    return { onPrevious, onNext };
  },
};
</script>

<style lang="scss"></style>
