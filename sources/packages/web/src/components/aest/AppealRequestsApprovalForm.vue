<template>
  <appeal-requests-form
    :studentAppealRequests="studentAppealRequests"
    :readOnly="true"
  >
    <template #sibling-form="{ approval }">
      <formio
        formName="staffapprovalappeal"
        :data="approval"
        :readOnly="readOnly"
        :scoped="true"
        @loaded="approvalFormLoaded"
      ></formio>
    </template>
  </appeal-requests-form>
  <slot name="approval-actions" :submit="submit"></slot>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import Formio from "@/components/generic/formio.vue";
import { SetupContext } from "vue";
import AppealRequestsForm from "@/components/common/AppealRequestsForm.vue";
import { useFormioUtils } from "@/composables";
import { StudentAppealApproval } from "@/types";

export default {
  emits: ["submitted"],
  components: {
    Formio,
    AppealRequestsForm,
  },
  props: {
    studentAppealRequests: {
      type: Object,
      required: true,
    },
    readOnly: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  setup(_props: any, context: SetupContext) {
    const { checkFormioValidity } = useFormioUtils();
    const approvalForms: any[] = [];
    const approvalFormLoaded = (form: any) => {
      approvalForms.push(form);
    };

    const submit = () => {
      if (checkFormioValidity(approvalForms)) {
        const approvals = approvalForms.map(
          (form) =>
            ({
              id: form.data.id,
              appealStatus: form.data.appealStatus,
              noteDescription: form.data.noteDescription,
            } as StudentAppealApproval),
        );
        context.emit("submitted", approvals);
      }
    };

    return {
      approvalFormLoaded,
      AESTRoutesConst,
      submit,
    };
  },
};
</script>
