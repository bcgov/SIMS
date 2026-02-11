<template>
  <v-switch
    class="float-right mr-2"
    v-model="expandAllModel"
    label="Expand all"
    hide-details
    color="primary"
    @update:model-value="expandAllUpdated"
  />
  <v-expansion-panels
    class="mt-5"
    multiple
    v-model="expansionPanelsModel"
    @update:model-value="expansionPanelsUpdated"
  >
    <v-expansion-panel
      :eager="true"
      v-for="submissionItem in submissionItems"
      :key="submissionItem.dynamicConfigurationId"
      :value="submissionItem.dynamicConfigurationId.toString()"
    >
      <template #title>
        <v-row>
          <v-col>
            <span class="category-header-medium color-blue">{{
              submissionItem.formType
            }}</span>
          </v-col>
          <v-col>
            <status-chip-form-submission-decision
              v-if="submissionItem.approval"
              class="float-right mr-4"
              :status="submissionItem.approval.status"
            />
          </v-col>
        </v-row>
      </template>
      <template #text>
        <formio
          :form-key="submissionItem.dynamicConfigurationId.toString()"
          :form-name="submissionItem.formName"
          :data="submissionItem.formData"
          :read-only="readOnly"
          @loaded="formLoaded"
        ></formio>
        <div class="my-4">
          <slot name="approval-form" :approval="submissionItem.approval"></slot>
        </div>
      </template>
    </v-expansion-panel>
  </v-expansion-panels>
  <div class="mt-4">
    <slot name="actions" :submit="submit"></slot>
  </div>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { defineComponent, PropType, ref } from "vue";
import { useFormioUtils } from "@/composables";
import {
  FormIOForm,
  FormSubmissionItem,
  FormSubmissionItemSubmitted,
} from "@/types";
import StatusChipFormSubmissionDecision from "@/components/generic/StatusChipFormSubmissionDecision.vue";

export default defineComponent({
  emits: ["submitted"],
  components: {
    StatusChipFormSubmissionDecision,
  },
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
  setup(props, context) {
    const expandAllModel = ref(false);
    const expansionPanelsModel = ref<string[]>([]);
    const { checkFormioValidity, getAssociatedFiles } = useFormioUtils();
    const forms = new Map<string, FormIOForm>();

    /**
     * Keep track of all forms that will be part of the submission.
     * @param form form.io form.
     * @param formKey associated identifier of the form.
     */
    const formLoaded = (form: FormIOForm, formKey: string) => {
      forms.set(formKey, form);
    };

    /**
     * Validate and emits an event if all forms are valid.
     */
    const submit = async () => {
      const invalidFormKeys: string[] = [];
      const validItems: FormSubmissionItemSubmitted[] = [];
      for (const [key, form] of forms) {
        const isValid = await checkFormioValidity([form]);
        if (isValid) {
          validItems.push({
            dynamicConfigurationId: +key,
            formData: form.data,
            files: getAssociatedFiles(form),
          });
        } else {
          invalidFormKeys.push(key);
        }
      }
      if (invalidFormKeys.length) {
        // Ensure forms with invalid data will be visible.
        expansionPanelsModel.value = invalidFormKeys;
        return;
      }
      // Emit the event with the valid forms.
      context.emit("submitted", validItems);
    };

    const expandAllUpdated = () => {
      if (expandAllModel.value) {
        expansionPanelsModel.value = props.submissionItems.map((item) =>
          item.dynamicConfigurationId.toString(),
        );
      } else {
        expansionPanelsModel.value = [];
      }
    };

    const expansionPanelsUpdated = () => {
      expandAllModel.value =
        expansionPanelsModel.value.length === props.submissionItems.length;
    };

    return {
      formLoaded,
      AESTRoutesConst,
      submit,
      expandAllModel,
      expandAllUpdated,
      expansionPanelsModel,
      expansionPanelsUpdated,
    };
  },
});
</script>
