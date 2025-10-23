<template>
  <content-group
    v-for="appealRequest in studentAppealRequests"
    :key="appealRequest.formName"
    class="mb-4"
  >
    <formio
      :form-name="appealRequest.formName"
      :data="appealRequest.data"
      :read-only="readOnly"
      @loaded="appealFormLoaded"
    ></formio>
    <slot name="approval-form" :approval="appealRequest.approval"></slot>
  </content-group>
  <div class="mt-4">
    <slot name="actions" :submit="submit"></slot>
  </div>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { defineComponent, PropType } from "vue";
import { useFormioUtils } from "@/composables";
import { FormIOForm, StudentAppealRequest } from "@/types";

export default defineComponent({
  emits: ["submitted"],
  props: {
    studentAppealRequests: {
      type: Array as PropType<StudentAppealRequest[]>,
      required: true,
    },
    readOnly: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(_props, context) {
    const { checkFormioValidity, getAssociatedFiles } = useFormioUtils();
    const appealForms: FormIOForm[] = [];
    const appealFormLoaded = (form: FormIOForm) => {
      appealForms.push(form);
    };

    const submit = async () => {
      if (await checkFormioValidity(appealForms)) {
        const formsData = appealForms.map<StudentAppealRequest>(
          (appealForm) => ({
            formName: appealForm.form.path,
            data: appealForm.data,
            files: getAssociatedFiles(appealForm),
          }),
        );
        context.emit("submitted", formsData);
      }
    };

    return {
      appealFormLoaded,
      AESTRoutesConst,
      submit,
    };
  },
});
</script>
