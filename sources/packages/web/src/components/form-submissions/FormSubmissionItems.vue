<template>
  <v-switch
    class="float-right mr-2"
    v-model="expandAll"
    label="Expand all"
    hide-details
    color="primary"
    @update:model-value="expandAllUpdated"
  />
  <v-expansion-panels class="mt-5" multiple v-model="expandedPanels">
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
    const expandAll = ref(false);
    const expandedPanels = ref<string[]>([]);
    const { checkFormioValidity, getAssociatedFiles } = useFormioUtils();
    const forms = new Map<string, FormIOForm>();
    const formLoaded = (form: FormIOForm, formKey: string) => {
      console.log(formKey);
      forms.set(formKey, form);
    };

    const submit = async () => {
      const formsValues = [...forms.values()];
      if (await checkFormioValidity(formsValues)) {
        const formsData = [...forms.entries()].map<FormSubmissionItemSubmitted>(
          ([formKey, formIOForm]) => ({
            dynamicConfigurationId: +formKey,
            formData: formIOForm.data,
            files: getAssociatedFiles(formIOForm),
          }),
        );
        context.emit("submitted", formsData);
      }
    };

    const expandAllUpdated = () => {
      if (expandAll.value) {
        expandedPanels.value = props.submissionItems.map((item) =>
          item.dynamicConfigurationId.toString(),
        );
      } else {
        expandedPanels.value = [];
      }
    };

    return {
      formLoaded,
      AESTRoutesConst,
      submit,
      expandAll,
      expandedPanels,
      expandAllUpdated,
    };
  },
});
</script>
