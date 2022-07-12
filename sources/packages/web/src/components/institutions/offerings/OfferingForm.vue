<template>
  <formio
    formName="educationprogramoffering"
    :data="data"
    @submitted="saveOffering"
  ></formio>
</template>

<script lang="ts">
import { OfferingDTO } from "@/types";
import { SetupContext } from "vue";

export default {
  props: {
    data: {
      type: Object,
      required: true,
    },
  },
  emits: ["saveOffering"],
  setup(_props: any, context: SetupContext) {
    const saveOffering = (data: OfferingDTO) => {
      context.emit("saveOffering", data);
    };

    return {
      saveOffering,
    };
  },
};
</script>
