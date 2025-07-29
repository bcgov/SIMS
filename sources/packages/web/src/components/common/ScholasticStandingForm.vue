<template>
  <formio-container
    formName="reportScholasticStandingChange"
    :formData="formData"
    @submitted="submitted"
  >
    <template #actions="{ submit }">
      <footer-buttons
        v-if="showFooter"
        :processing="processing"
        @primaryClick="submit"
        primaryLabel="Submit update"
        @secondaryClick="cancel"
        :disablePrimaryButton="readOnly"
      />
    </template>
  </formio-container>
</template>

<script lang="ts">
import { ref, defineComponent, PropType, watchEffect } from "vue";
import {
  ActiveApplicationDataAPIOutDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
} from "@/services/http/dto";
import { FormIOForm } from "@/types";
import { useFormatters } from "@/composables";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";

/**
 * Represents the scholastic standing details.
 */
type ScholasticStandingData =
  | (
      | ScholasticStandingSubmittedDetailsAPIOutDTO
      | ActiveApplicationDataAPIOutDTO
    ) & {
      showCompleteInfo?: boolean;
      readOnly: boolean;
    };

export default defineComponent({
  emits: ["submit", "cancel"],
  props: {
    scholasticStandingId: {
      type: Number,
      required: false,
    },
    showFooter: {
      type: Boolean,
      required: false,
      default: false,
    },
    showCompleteInfo: {
      type: Boolean,
      required: false,
      default: false,
    },
    initialData: {
      type: Object as PropType<ActiveApplicationDataAPIOutDTO>,
      required: false,
    },
    readOnly: {
      type: Boolean,
      required: true,
      default: false,
    },
    processing: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, context) {
    const formData = ref({} as ScholasticStandingData);
    const { dateOnlyLongString } = useFormatters();

    watchEffect(async () => {
      if (props.scholasticStandingId) {
        const applicationDetails =
          await ScholasticStandingService.shared.getScholasticStanding(
            props.scholasticStandingId,
          );
        formData.value = {
          ...applicationDetails,
          applicationOfferingStartDate: dateOnlyLongString(
            applicationDetails.applicationOfferingStartDate,
          ),
          applicationOfferingEndDate: dateOnlyLongString(
            applicationDetails.applicationOfferingEndDate,
          ),
          applicationOfferingStudyBreak:
            applicationDetails.applicationOfferingStudyBreak?.map(
              (studyBreak) => ({
                breakStartDate: dateOnlyLongString(studyBreak.breakStartDate),
                breakEndDate: dateOnlyLongString(studyBreak.breakEndDate),
              }),
            ),
          showCompleteInfo: props.showCompleteInfo,
          readOnly: props.readOnly,
        };
        return;
      }
      formData.value = {
        ...props.initialData,
        showCompleteInfo: props.showCompleteInfo,
        readOnly: props.readOnly,
      } as ScholasticStandingData;
    });

    const submitted = (form: FormIOForm<ScholasticStandingData>) => {
      context.emit("submit", form.data);
    };

    const cancel = () => {
      context.emit("cancel");
    };

    return { formData, submitted, cancel };
  },
});
</script>
