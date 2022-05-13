<template>
  <Card class="p-m-4">
    <template #title> {{ title }} </template>
    <template #content>
      <formio
        :formName="formName"
        @submitted="submitted"
        @loaded="onLoaded"
      ></formio>
    </template>
  </Card>
</template>

<script lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
export default {
  setup() {
    const route = useRoute();
    const query = route.params;
    const formName = query.formName || "unknown";
    const title = ref(`Form ${formName} is loading ....`);

    const onLoaded = () => {
      title.value = `${formName}`;
    };
    const submitted = async (args: any) => {
      console.dir(args);
    };
    return {
      title,
      formName,
      submitted,
      onLoaded,
    };
  },
};
</script>

<style></style>
