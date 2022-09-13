<template>
  <!-- TODO: ANN form definition -->
  <formio-container
    formName="reportScholasticStandingChange"
    :formData="data"
    @submitted="submitted"
  >
    <template #actions="{ submit }" v-if="!readOnly">
      <footer-buttons
        :processing="processing"
        @primaryClick="submit"
        primaryLabel="Submit update"
        @secondaryClick="cancel"
      /> </template
  ></formio-container>
</template>

<script lang="ts">
import { ref, SetupContext, watch } from "vue";
import {
  ActiveApplicationDataAPIOutDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
} from "@/services/http/dto";

interface ScholasticStanding
  extends ScholasticStandingSubmittedDetailsAPIOutDTO {
  readonly: boolean;
}
interface ScholasticStandingBeforeSubmission
  extends ActiveApplicationDataAPIOutDTO {
  readonly: boolean;
}
export default {
  emits: ["submit", "cancel"],
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
    processing: {
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

    const submitted = (args: ScholasticStanding) => {
      context.emit("submit", args);
    };

    const cancel = () => {
      context.emit("cancel");
    };

    return { data, submitted, cancel };
  },
};
</script>
