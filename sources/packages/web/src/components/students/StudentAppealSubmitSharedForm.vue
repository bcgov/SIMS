<!-- Appeals submission, should not be confused with "legacy appeals" (a.k.a. "change request"). -->
<template>
  <body-header-container>
    <template #header>
      <body-header title="Complete all question(s) below">
        <template #subtitle>
          All requested changes will be reviewed by StudentAid BC after you
          submit for review.
          <slot name="submit-appeal-header"> </slot>
        </template>
      </body-header>
    </template>
    <appeal-requests-form
      :student-appeal-requests="appealRequestsForms"
      @submitted="$emit('submitted', $event)"
    >
      <template #actions="{ submit }">
        <footer-buttons
          justify="space-between"
          :processing="processing"
          @secondary-click="$.emit('cancel')"
          secondary-label="Back"
          @primary-click="submit"
          primary-label="Submit for review"
        ></footer-buttons>
      </template>
    </appeal-requests-form>
  </body-header-container>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { StudentAppealRequest } from "@/types";
import AppealRequestsForm from "@/components/common/AppealRequestsForm.vue";

export default defineComponent({
  emits: {
    cancel: null,
    submitted: (appealRequests: StudentAppealRequest[]) =>
      !!appealRequests.length,
  },
  components: {
    AppealRequestsForm,
  },
  props: {
    appealForms: {
      type: Array as PropType<string[]>,
      required: true,
    },
    applicationId: {
      type: Number,
      default: null,
      required: false,
    },
    processing: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  setup(props) {
    const appealRequestsForms = computed(() =>
      props.appealForms.map(
        (formName) => ({ formName }) as StudentAppealRequest,
      ),
    );

    return {
      appealRequestsForms,
    };
  },
});
</script>
