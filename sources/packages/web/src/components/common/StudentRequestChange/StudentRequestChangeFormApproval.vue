<template>
  <student-request-change-form
    :studentAppealRequests="studentAppealRequests"
    :readOnly="true"
  >
    <template #sibling-form="{approval}">
      <formio
        formName="staffapprovalappeal"
        :data="approval"
        :readOnly="readOnly"
        :scoped="true"
        @loaded="approvalFormLoaded"
      ></formio>
    </template>
  </student-request-change-form>
  <slot name="approval-actions" :submit="submit"></slot>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import Formio from "@/components/generic/formio.vue";
import { SetupContext } from "vue";
import StudentRequestChangeForm from "./StudentRequestChangeForm.vue";
import { useFormioUtils } from "@/composables";

export default {
  emits: ["submitted"],
  components: {
    Formio,
    StudentRequestChangeForm,
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
        context.emit("submitted");
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
