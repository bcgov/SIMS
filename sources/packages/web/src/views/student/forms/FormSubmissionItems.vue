<template>
  <content-group
    v-for="submissionItem in submissionItems"
    :key="submissionItem.dynamicConfigurationId"
    class="mb-4"
  >
    <formio
      :form-key="submissionItem.dynamicConfigurationId"
      :form-name="submissionItem.formName"
      :data="submissionItem.formData"
      :read-only="readOnly"
      @loaded="formLoaded"
    ></formio>
    <slot name="approval-form" :approval="submissionItem.approval"></slot>
  </content-group>
  <div class="mt-4">
    <slot name="actions" :submit="submit"></slot>
  </div>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { defineComponent, PropType } from "vue";
import { useFormioUtils } from "@/composables";
import {
  FormIOForm,
  FormSubmissionItem,
  FormSubmissionItemSubmitted,
} from "@/types";

export default defineComponent({
  emits: ["submitted"],
  props: {
    submissionItems: {
      type: Array as PropType<FormSubmissionItem[]>,
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
    const forms = new Map<string, FormIOForm>();
    const formLoaded = (form: FormIOForm, formKey: string) => {
      console.log(formKey);
      forms.set(formKey, form);
    };

    const submit = async () => {
      const formsValues = [...forms.values()];
      if (await checkFormioValidity(formsValues)) {
        console.log(formsValues);
        const formsData = [...forms.entries()].map<FormSubmissionItemSubmitted>(
          ([formKey, formIOForm]) => ({
            dynamicConfigurationId: +formKey,
            formData: formIOForm.data,
            files: getAssociatedFiles(formIOForm),
          }),
        );
        console.log(formsData);
        context.emit("submitted", formsData);
      }
    };

    return {
      formLoaded,
      AESTRoutesConst,
      submit,
    };
  },
});
</script>
