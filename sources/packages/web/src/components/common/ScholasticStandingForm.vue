<template>
  <formio-container
    formName="reportScholasticStandingChange"
    :formData="data"
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
  ScholasticStandingDataAPIInDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
} from "@/services/http/dto";
import { FormIOForm } from "@/types";
import { useFormatters } from "@/composables";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";

/**
 * Represents the scholastic standing submitted details.
 */
interface ScholasticStandingSubmittedDetails
  extends ScholasticStandingDataAPIInDTO,
    ActiveApplicationDataAPIOutDTO {
  showCompleteInfo?: boolean;
}
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
    scholasticStandingId: {
      type: Number,
      required: true,
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
      type: Object as PropType<ScholasticStandingSubmittedDetailsAPIOutDTO>,
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
    const initialData = ref({} as ScholasticStandingSubmittedDetails);
    const { dateOnlyLongString } = useFormatters();

    watchEffect(async () => {
      if (!props.initialData) {
        const applicationDetails =
          await ScholasticStandingService.shared.getScholasticStanding(
            props.scholasticStandingId,
          );
        initialData.value = {
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
        };
        return;
      }
      initialData.value = {
        ...props.initialData,
        showCompleteInfo: props.showCompleteInfo,
      };
    });
    const data = ref(
      {} as ScholasticStanding | ScholasticStandingBeforeSubmission,
    );

    const setReadOnlyData = () => {
      data.value = {
        ...initialData.value,
        readOnly: props.readOnly,
      };
    };

    watchEffect(async () => {
      setReadOnlyData();
    });

    const submitted = (form: FormIOForm<ScholasticStanding>) => {
      context.emit("submit", form.data);
    };

    const cancel = () => {
      context.emit("cancel");
    };

    return { data, submitted, cancel };
  },
});
</script>
