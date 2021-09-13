<template>
  <Card class="p-m-4">
    <template #content>
      <h1 class="d-flex justify-content-center">
        Report A change - Work in Progress
      </h1>
      <formio
        formName="reportachange"
        :data="initialData"
        @submitted="submitted"
      ></formio>
    </template>
  </Card>
</template>
<script lang="ts">
import { ref, onMounted } from "vue";
import formio from "@/components/generic/formio.vue";
export default {
  components: {
    formio,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const initialData = ref({});
    onMounted(async () => {
      initialData.value = { appId: props.applicationId };
    });
    return {
      initialData,
    };
  },
};
</script>
