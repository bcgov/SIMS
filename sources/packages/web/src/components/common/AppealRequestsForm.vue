<template>
  <content-group
    v-for="appealRequest in studentAppealRequests"
    :key="appealRequest.formName"
    class="mb-4"
  >
    <formio
      :formName="appealRequest.formName"
      :data="appealRequest.data"
      :readOnly="readOnly"
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
import Formio from "@/components/generic/formio.vue";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import { SetupContext } from "vue";
import { useFormioUtils } from "@/composables";
import { StudentAppealRequest } from "@/types";

export default {
  emits: ["submitted"],
  components: {
    Formio,
    ContentGroup,
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
    const appealForms: any[] = [];
    const appealFormLoaded = (form: any) => {
      appealForms.push(form);
    };

    const submit = () => {
      console.log(appealForms);
      if (checkFormioValidity(appealForms)) {
        const formsData = appealForms.map(
          (form) =>
            ({
              formName: form.name,
              data: form.data,
            } as StudentAppealRequest),
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
};
</script>
