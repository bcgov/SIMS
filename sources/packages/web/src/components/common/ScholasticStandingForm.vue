<template>
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
        :disablePrimaryButton="isReadOnlyUser($props.locationId)"
      /> </template
  ></formio-container>
</template>

<script lang="ts">
import { ref, watch, defineComponent, PropType } from "vue";
import {
  ActiveApplicationDataAPIOutDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
} from "@/services/http/dto";
import { FormIOForm } from "@/types";
import { useInstitutionAuth } from "@/composables";

interface ScholasticStanding
  extends ScholasticStandingSubmittedDetailsAPIOutDTO {
  readOnly: boolean;
}
interface ScholasticStandingBeforeSubmission
  extends ActiveApplicationDataAPIOutDTO {
  readOnly: boolean;
}
export default defineComponent({
  emits: ["submit", "cancel"],
  props: {
    initialData: {
      type: Object as PropType<ScholasticStandingSubmittedDetailsAPIOutDTO>,
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
    locationId: {
      type: Number,
      required: false,
    },
  },
  setup(props, context) {
    const { isReadOnlyUser } = useInstitutionAuth();
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

    const submitted = (form: FormIOForm<ScholasticStanding>) => {
      context.emit("submit", form.data);
    };

    const cancel = () => {
      context.emit("cancel");
    };

    return { data, submitted, cancel, isReadOnlyUser };
  },
});
</script>
