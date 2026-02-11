<template>
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header
        title="Standard forms"
        sub-title="Standard forms to be submitted for StudentAid Bc review."
      />
    </template>
    <v-expansion-panels class="mt-5">
      <v-expansion-panel>
        <template #title
          ><div>
            <span class="category-header-medium brand-gray-text">General</span>
            <div>
              Forms for diverse types of requests for StudentAid BC decision.
            </div>
          </div></template
        >
        <template #text>
          <v-list lines="three" select-strategy="leaf" variant="elevated">
            <v-list-item
              v-for="form in standaloneForms"
              :key="form.formDefinitionName"
              :title="form.formType"
              :subtitle="form.formDescription"
              :elevation="1"
              :value="form.id"
              prepend-icon="mdi-subtitles-outline"
            >
              <template #prepend="{ isSelected, select }">
                <v-list-item-action start>
                  <v-checkbox-btn
                    color="primary"
                    :model-value="isSelected"
                    @update:model-value="select"
                  ></v-checkbox-btn>
                </v-list-item-action>
              </template>
            </v-list-item>
          </v-list>
          <footer-buttons
            class="mt-4"
            primary-label="Fill form"
            justify="end"
            @primary-click="fillStudentForm"
            :show-secondary-button="false"
          />
        </template>
      </v-expansion-panel>
    </v-expansion-panels>
  </body-header-container>
</template>
<script lang="ts">
import { useRules } from "@/composables";
import { defineComponent, watchEffect, ref, PropType } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { FormCategory } from "@/types";
import { useRouter } from "vue-router";
import { SubmissionFormConfigurationAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  props: {
    formsConfigurations: {
      type: Object as PropType<SubmissionFormConfigurationAPIOutDTO[]>,
      required: true,
      default: [] as SubmissionFormConfigurationAPIOutDTO[],
    },
  },
  setup(props) {
    const router = useRouter();
    const { checkNullOrEmptyRule } = useRules();
    const standaloneForms = ref<SubmissionFormConfigurationAPIOutDTO[]>([]);
    const selectedStandaloneForm = ref<string>();

    watchEffect(async () => {
      // Forms
      standaloneForms.value = props.formsConfigurations.filter(
        (form) => form.formCategory === FormCategory.StudentForm,
      );
    });

    const fillStudentForm = async (): Promise<void> => {
      await router.push({
        name: StudentRoutesConst.STUDENT_FORM_SUBMIT,
        params: {
          formDefinitionIds: selectedStandaloneForm.value?.toString(),
        },
      });
    };

    return {
      checkNullOrEmptyRule,
      StudentRoutesConst,
      standaloneForms,
      selectedStandaloneForm,
      fillStudentForm,
    };
  },
});
</script>
