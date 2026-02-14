<template>
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header
        title="Appeal forms"
        sub-title="There are two appeal paths available. Please review the options below and select the appropriate path."
      />
    </template>
    <v-expansion-panels class="mt-5" v-model="selectedAppealType">
      <v-expansion-panel :value="AppealTypes.Application">
        <template #title
          ><div>
            <span
              class="category-header-medium brand-gray-text application-appeals-header"
              >Application appeals</span
            >
            <div>Application appeals are assessment focused changes.</div>
          </div></template
        >
        <template #text>
          <v-form ref="appealsSelectionForm">
            <v-select
              hide-details="auto"
              label="Application Number"
              density="compact"
              color="primary"
              :items="eligibleApplications"
              v-model="selectedApplicationId"
              :loading="loadingEligibleApplications"
              item-value="id"
              item-title="applicationNumber"
              variant="outlined"
              class="mb-4"
              no-data-text="No eligible applications available"
              :rules="[(v) => checkNullOrEmptyRule(v, 'Application number')]"
            />
            <template v-if="applicationAppeals.length">
              <p>
                Please select the appropriate appeal(s) from the list below and
                click 'Fill appeal(s)' to provide the data. Multiple appeals can
                be submitted at a time and new appeals would not be allowed if
                there is already some appeal pending StudentAid BC decision.
              </p>
              <v-list
                lines="three"
                select-strategy="leaf"
                variant="elevated"
                v-model:selected="selectedApplicationAppealsForms"
              >
                <v-list-item
                  v-for="form in applicationAppeals"
                  :key="form.formDefinitionName"
                  :title="form.formType"
                  :value="form.id"
                  :subtitle="form.formDescription"
                  prepend-icon="mdi-scale-balance"
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
              <v-input
                :model-value="selectedApplicationAppealsForms"
                :rules="[(v) => checkNullOrEmptyRule(v, 'At least one appeal')]"
              >
              </v-input>
            </template>
          </v-form>
          <footer-buttons
            class="mt-4"
            primary-label="Fill appeal(s)"
            justify="end"
            @primary-click="fillApplicationAppeals"
            :show-secondary-button="false"
          />
        </template>
      </v-expansion-panel>
      <v-expansion-panel :value="AppealTypes.Other">
        <template #title
          ><div>
            <span class="category-header-medium brand-gray-text"
              >Other appeals</span
            >
            <div>Appeals that are profile and student specific.</div>
          </div></template
        >
        <template #text>
          <p>
            Please select one of the listed appeals and click 'Fill appeal' to
            provide the data. A single appeal in this category can be submitted
            at a time.
          </p>
          <v-form ref="standaloneAppealsSelectionForm">
            <v-list
              lines="three"
              select-strategy="single-leaf"
              variant="elevated"
              v-model:selected="selectedStandaloneAppealsForm"
            >
              <v-list-item
                v-for="form in standaloneAppealsForms"
                :key="form.formDefinitionName"
                :title="form.formType"
                :subtitle="form.formDescription"
                :value="form.id"
                prepend-icon="mdi-scale-balance"
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
            <v-input
              :model-value="selectedStandaloneAppealsForm"
              :rules="[(v) => checkNullOrEmptyRule(v, 'At least one appeal')]"
            >
            </v-input>
          </v-form>
          <footer-buttons
            class="mt-4"
            primary-label="Fill appeal"
            justify="end"
            @primary-click="fillStudentAppeals"
            :show-secondary-button="false"
          />
        </template>
      </v-expansion-panel>
    </v-expansion-panels>
  </body-header-container>
</template>
<script lang="ts">
import { useRules, useSnackBar } from "@/composables";
import { computed, defineComponent, ref, watch, PropType } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import {
  FormSubmissionConfigurationAPIOutDTO,
  EligibleApplicationForAppealAPIOutDTO,
} from "@/services/http/dto";
import { useRouter } from "vue-router";
import { FormCategory, BannerTypes, VForm } from "@/types";
import { StudentAppealService } from "@/services/StudentAppealService";

enum AppealTypes {
  Application = "Application",
  Other = "Other",
}

export default defineComponent({
  props: {
    formsConfigurations: {
      type: Array as PropType<FormSubmissionConfigurationAPIOutDTO[]>,
      required: true,
    },
    applicationId: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const router = useRouter();
    const { checkNullOrEmptyRule } = useRules();
    const appealsSelectionForm = ref({} as VForm);
    const standaloneAppealsSelectionForm = ref({} as VForm);
    // Forms Categories
    const bundleApplicationAppealsForms = ref<
      FormSubmissionConfigurationAPIOutDTO[]
    >([]);
    const standaloneAppealsForms = ref<FormSubmissionConfigurationAPIOutDTO[]>(
      [],
    );
    // Selected form(s)
    const selectedApplicationAppealsForms = ref<number[]>();
    const selectedStandaloneAppealsForm = ref<number[]>();
    // Appeal type (Applications or Others).
    const selectedAppealType = ref<AppealTypes | null>(null);
    // Eligible applications
    const eligibleApplications = ref<EligibleApplicationForAppealAPIOutDTO[]>();
    const selectedApplicationId = ref<number | null>();
    const loadingEligibleApplications = ref(false);
    const applicationAppeals = computed(() => {
      if (
        !eligibleApplications.value ||
        !selectedApplicationId.value ||
        !bundleApplicationAppealsForms.value.length
      ) {
        return [];
      }
      // Find application by selected application id.
      const application = eligibleApplications.value.find(
        (application) => application.id === selectedApplicationId.value,
      );
      if (!application) {
        return [];
      }
      // Map eligible appeals for the selected application.
      return application.eligibleApplicationAppeals.map((eligibleAppeal) => {
        const formConfig = bundleApplicationAppealsForms.value.find(
          (form) => form.formDefinitionName === eligibleAppeal,
        );
        if (!formConfig) {
          snackBar.error(
            "An unexpected error occurred while loading eligible application information",
          );
          throw new Error(
            `Form configuration not found for ${eligibleAppeal}.`,
          );
        }
        return formConfig!;
      });
    });

    watch(
      () => props.applicationId,
      async () => {
        try {
          loadingEligibleApplications.value = true;
          const eligibleApplicationForAppeal =
            await StudentAppealService.shared.getEligibleApplicationsForAppeal();
          eligibleApplications.value =
            eligibleApplicationForAppeal.applications;
        } catch {
          snackBar.error(
            "Unexpected error while loading eligible applications.",
          );
        } finally {
          loadingEligibleApplications.value = false;
        }
        selectedApplicationId.value = props.applicationId;
        selectedAppealType.value = props.applicationId
          ? AppealTypes.Application
          : null;
      },
      { immediate: true },
    );

    // Clear selected appeals when selected application changes.
    watch(
      () => selectedApplicationId.value,
      () => {
        selectedApplicationAppealsForms.value = undefined;
      },
    );

    watch(
      () => props.formsConfigurations,
      () => {
        const applicationAppeals = props.formsConfigurations.filter(
          (form) => form.formCategory === FormCategory.StudentAppeal,
        );
        bundleApplicationAppealsForms.value = applicationAppeals.filter(
          (form) => form.allowBundledSubmission && form.hasApplicationScope,
        );
        standaloneAppealsForms.value = applicationAppeals.filter(
          (form) => !form.hasApplicationScope && !form.allowBundledSubmission,
        );
      },
      { deep: true },
    );

    const fillApplicationAppeals = async (): Promise<void> => {
      const formIsValid = appealsSelectionForm.value.validate();
      if (!formIsValid) {
        return;
      }
      await router.push({
        name: StudentRoutesConst.STUDENT_FORM_SUBMIT,
        params: {
          category: FormCategory.StudentAppeal,
          formDefinitionIds: selectedApplicationAppealsForms.value?.toString(),
        },
        query: {
          applicationId: selectedApplicationId.value,
        },
      });
    };

    const fillStudentAppeals = async (): Promise<void> => {
      const formIsValid = standaloneAppealsSelectionForm.value.validate();
      if (!formIsValid) {
        return;
      }
      await router.push({
        name: StudentRoutesConst.STUDENT_FORM_SUBMIT,
        params: {
          formDefinitionIds: selectedStandaloneAppealsForm.value?.toString(),
        },
      });
    };

    return {
      BannerTypes,
      appealsSelectionForm,
      standaloneAppealsSelectionForm,
      checkNullOrEmptyRule,
      StudentRoutesConst,
      selectedAppealType,
      eligibleApplications,
      selectedApplicationId,
      loadingEligibleApplications,
      AppealTypes,
      applicationAppeals,
      standaloneAppealsForms,
      selectedApplicationAppealsForms,
      selectedStandaloneAppealsForm,
      fillApplicationAppeals,
      fillStudentAppeals,
    };
  },
});
</script>
