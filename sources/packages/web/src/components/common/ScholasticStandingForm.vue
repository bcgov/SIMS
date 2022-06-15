<template>
  <formio
    formName="reportscholasticstandingchange"
    :data="data"
    @submitted="submitted"
    @customEvent="customEvent"
  ></formio>
</template>

<script lang="ts">
import { ref, SetupContext, watch } from "vue";
import {
  ActiveApplicationDataAPIOutDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
} from "@/services/http/dto";
import { FormIOCustomEvent } from "@/types";

interface ScholasticStanding
  extends ScholasticStandingSubmittedDetailsAPIOutDTO {
  readonly: boolean;
}
interface ScholasticStandingBeforeSubmission
  extends ActiveApplicationDataAPIOutDTO {
  readonly: boolean;
}
export default {
  emits: ["submit", "customEventCallback"],
  props: {
    initialData: {
      type: Object,
      required: true,
    },
    readOnly: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  setup(props: any, context: SetupContext) {
    const data = ref(
      {} as ScholasticStanding | ScholasticStandingBeforeSubmission,
    );

    const setReadOnlyData = () => {
      data.value = { ...props.initialData, readOnly: props.readOnly };
    };

    watch(
      () => [props.initialData, props.readOnly],
      async () => {
        setReadOnlyData();
      },
      { immediate: true },
    );

    const submitted = async (args: ScholasticStanding) => {
      context.emit("submit", args);
    };

    const customEvent = async (form: any, event: FormIOCustomEvent) => {
      context.emit("customEventCallback", form, event);
    };

    return { data, submitted, customEvent };
  },
};
</script>
