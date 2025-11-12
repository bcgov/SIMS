<template>
  <formio-container
    form-name="reportScholasticStandingChange"
    :form-data="formData"
    :is-data-ready="isDataReady || isParentDataReady"
    @submitted="submitted"
  >
    <template #actions="{ submit }">
      <footer-buttons
        v-if="showFooter"
        :processing="processing"
        @primary-click="submit"
        primary-label="Submit update"
        @secondary-click="cancel"
        :disable-primary-button="readOnly"
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
type ScholasticStandingData = (
  | ScholasticStandingSubmittedDetailsAPIOutDTO
  | ActiveApplicationDataAPIOutDTO
) & {
  showCompleteInfo?: boolean;
  readOnly: boolean;
};

export default defineComponent({
  emits: ["submit", "cancel", "dataLoaded"],
  props: {
    scholasticStandingId: {
      type: Number,
      required: false,
      default: undefined,
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
      default: undefined,
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
    // This indicator is used to determine if the parent data is ready
    // when the initial data is provided by the parent component.
    isParentDataReady: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, context) {
    const formData = ref({} as ScholasticStandingData);
    const { dateOnlyLongString } = useFormatters();
    const isDataReady = ref(false);

    watchEffect(async () => {
      if (props.scholasticStandingId) {
        isDataReady.value = false;
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
        isDataReady.value = true;
        context.emit("dataLoaded", applicationDetails);
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

    return { formData, submitted, cancel, isDataReady };
  },
});
</script>
