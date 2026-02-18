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
      :value="submissionItem.dynamicConfigurationId"
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
          :form-key="submissionItem.dynamicConfigurationId"
          :form-name="submissionItem.formName"
          :data="submissionItem.formData"
          :loading="!allFormsLoaded"
          :read-only="readOnly"
          @loaded="formLoaded"
        ></formio>
        <div class="my-4">
          <!-- Allow the component to be shared with the approval view for the Ministry, also
           allowing institutions to shared the approvals statuses visualization. -->
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
import { defineComponent, PropType, ref, watch } from "vue";
import { useFormioUtils, useSnackBar } from "@/composables";
import {
  FormIOComponent,
  FormIOForm,
  FormSubmissionItem,
  FormSubmissionItemSubmitted,
} from "@/types";
import StatusChipFormSubmissionDecision from "@/components/generic/StatusChipFormSubmissionDecision.vue";
import { FormSubmissionService } from "@/services/FormSubmissionService";

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
    applicationId: {
      type: Number,
      default: null,
      required: false,
    },
    readOnly: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, context) {
    const snackBar = useSnackBar();
    const expandAllModel = ref(true);
    const expansionPanelsModel = ref<number[]>([]);
    const { checkFormioValidity, getAssociatedFiles } = useFormioUtils();
    const forms = new Map<number, FormIOForm>();
    const allFormsLoaded = ref(false);
    const { recursiveSearch } = useFormioUtils();

    const getSupplementaryData = async (supplementaryDataKeys: string[]) => {
      try {
        return await FormSubmissionService.shared.getSupplementaryData({
          dataKeys: supplementaryDataKeys,
          applicationId: props.applicationId,
        });
      } catch (error: unknown) {
        snackBar.error("Unexpected error while loading supplementary data.");
        throw error;
      }
    };

    /**
     * Check if all expected forms were loaded.
     */
    const updateFormsLoadState = () => {
      allFormsLoaded.value = forms.size === props.submissionItems.length;
    };

    /**
     * Keep track of all forms that will be part of the submission.
     * @param form form.io form.
     * @param formKey associated identifier of the form.
     */
    const formLoaded = async (form: FormIOForm, formKey: number) => {
      forms.set(formKey, form);
      if (props.readOnly) {
        updateFormsLoadState();
        return;
      }
      // Check if the form has any know supplementary key that must be loaded.
      const supplementaryComponentsSearch = recursiveSearch(
        form,
        (component: FormIOComponent) =>
          component.component.tags?.includes("supplementary-data"),
      );
      if (!supplementaryComponentsSearch.length) {
        updateFormsLoadState();
        return;
      }
      // Group the key to retrieve supplementary data from the API.
      const supplementaryDataKeys = supplementaryComponentsSearch.map(
        (component) => component.component.key,
      );
      if (supplementaryDataKeys.length) {
        const supplementaryData = await getSupplementaryData(
          supplementaryDataKeys,
        );
        for (const componentSearch of supplementaryComponentsSearch) {
          componentSearch.component.setValue(
            supplementaryData.formData[componentSearch.component.key],
          );
        }
      }
      updateFormsLoadState();
    };

    /**
     * Validate and emits an event if all forms are valid.
     */
    const submit = async () => {
      // TODO: Consider not allowing the submission if all the forms were not loaded.
      const invalidFormKeys: number[] = [];
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
          invalidFormKeys.push(+key);
        }
      }
      if (invalidFormKeys.length) {
        // Ensure forms with invalid data will be visible.
        expansionPanelsModel.value = invalidFormKeys;
        expansionPanelsUpdated();
        return;
      }
      // Emit the event with the valid forms.
      context.emit("submitted", validItems);
    };

    /**
     * Force all panels to be expanded once data is loaded.
     */
    watch(
      () => props.submissionItems,
      () => expandAllUpdated(),
    );

    /**
     * Ensure all expandable panels are expanded or collapsed
     * based on the "expand all" switch.
     */
    const expandAllUpdated = () => {
      if (expandAllModel.value) {
        expansionPanelsModel.value = props.submissionItems.map(
          (item) => item.dynamicConfigurationId,
        );
      } else {
        expansionPanelsModel.value = [];
      }
    };

    /**
     * Ensures the "expand all" switch stays in sync with the expanded panels
     * once they actioned by the user or a result of validations.
     */
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
      allFormsLoaded,
    };
  },
});
</script>
