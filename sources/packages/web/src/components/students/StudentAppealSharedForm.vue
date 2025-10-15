<template>
  <body-header-container>
    <template #header>
      <body-header
        title="Appeals"
        sub-title="You can submit two types of appeals for Student Aid BC to review. Select the appropriate appeals type below."
      />
    </template>
    <error-summary :errors="appealsSelectionForm.errors" />
    <content-group>
      <v-form ref="appealsSelectionForm">
        <v-radio-group
          color="primary"
          density="compact"
          v-model="selectedAppealType"
          label="Appeal type"
          hide-details="auto"
          class="radio-align-top"
          :rules="[(v) => checkNullOrEmptyRule(v, 'Appeal type')]"
        >
          <v-radio :value="AppealTypes.Application" class="mt-2">
            <template #label>
              <div class="ml-1">
                <strong>Application</strong>
                <p>
                  Application specific appeals that will only impact a single
                  application like income changes, room and board, etc.
                </p>
              </div>
            </template>
          </v-radio>
          <v-radio :value="AppealTypes.Other">
            <template #label>
              <div class="ml-1">
                <strong>Other</strong>
                <p>
                  Appeals that are student related (restriction or status) that
                  don't apply to a single application.
                </p>
              </div>
            </template>
          </v-radio>
        </v-radio-group>
        <template v-if="selectedAppealType === AppealTypes.Application">
          <v-select
            hide-details="auto"
            label="Application Number"
            density="compact"
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
          <v-select
            hide-details="auto"
            label="Appeal(s)"
            density="compact"
            multiple
            :items="applicationAppeals"
            item-title="description"
            item-value="formName"
            v-model="selectedApplicationAppeals"
            variant="outlined"
            class="mb-4"
            :rules="[(v) => checkNullOrEmptyRule(v, 'Appeal(s)')]"
          />
        </template>
        <v-select
          v-if="
            selectedAppealType === AppealTypes.Other && isOtherOptionAvailable
          "
          hide-details="auto"
          label="Appeal form"
          density="compact"
          :items="otherAppeals"
          item-title="description"
          item-value="formName"
          v-model="selectedOtherAppeal"
          variant="outlined"
          class="mb-4"
          :rules="[(v) => checkNullOrEmptyRule(v, 'Appeal')]"
        />
        <banner
          v-if="
            selectedAppealType === AppealTypes.Other && !isOtherOptionAvailable
          "
          class="mb-2"
          type="info"
          header="Other appeal types will be available for submission soon."
        />
      </v-form>
    </content-group>
    <footer-buttons
      class="mt-4"
      primary-label="Next"
      justify="end"
      @primary-click="goToAppealFormsRequests"
      :show-secondary-button="false"
      :show-primary-button="selectedAppealType === AppealTypes.Application"
    />
  </body-header-container>
</template>
<script lang="ts">
import { useRules, useSnackBar } from "@/composables";
import { defineComponent, onMounted, ref, watch } from "vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentAppealService } from "../../services/StudentAppealService";
import { EligibleApplicationForAppealAPIOutDTO } from "@/services/http/dto";
import { useRouter } from "vue-router";
import { VForm } from "@/types";

enum AppealTypes {
  Application = "Application",
  Other = "Other",
}

interface AppealForm {
  formName: string;
  description: string;
}

export default defineComponent({
  props: {
    applicationId: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    // TODO: Variable to be removed once the "Others" option is implemented.
    const isOtherOptionAvailable = ref(false);
    const snackBar = useSnackBar();
    const router = useRouter();
    const { checkNullOrEmptyRule } = useRules();
    const appealsSelectionForm = ref({} as VForm);
    const eligibleApplications = ref<EligibleApplicationForAppealAPIOutDTO[]>();
    const loadingEligibleApplications = ref(false);
    const selectedAppealType = ref<AppealTypes | null>(AppealTypes.Application);
    const selectedApplicationId = ref<number | null>();
    const selectedApplicationAppeals = ref<string[]>();
    const applicationAppeals = ref<AppealForm[]>([
      {
        formName: "roomandboardcostsappeal",
        description: "Room and board costs",
      },
      {
        formName: "roomandboardcostsappeal1",
        description: "Room and board costs 1",
      },
    ]);
    const selectedOtherAppeal = ref<string>();
    const otherAppeals = ref<AppealForm[]>([
      {
        formName: "not-available",
        description: "Not available at this moment",
      },
    ]);

    onMounted(async () => {
      try {
        loadingEligibleApplications.value = true;
        const eligibleApplicationForAppeal =
          await StudentAppealService.shared.getEligibleApplicationsForAppeal();
        eligibleApplications.value = eligibleApplicationForAppeal.applications;
      } catch {
        snackBar.error("Unexpected error while loading eligible applications.");
      } finally {
        loadingEligibleApplications.value = false;
      }
    });

    watch(
      () => props.applicationId,
      () => {
        selectedApplicationId.value = props.applicationId;
      },
      { immediate: true },
    );

    const goToAppealFormsRequests = async (): Promise<void> => {
      const formIsValid = appealsSelectionForm.value.validate();
      if (!formIsValid) {
        return;
      }
      if (selectedAppealType.value === AppealTypes.Application) {
        await router.push({
          name: StudentRoutesConst.STUDENT_APPLICATION_APPEAL_SUBMIT,
          params: {
            applicationId: selectedApplicationId.value,
            appealForms: selectedApplicationAppeals.value?.toString(),
          },
        });
        return;
      }
      await router.push({
        name: StudentRoutesConst.STUDENT_APPEAL_SUBMIT,
        params: {
          appealForms: selectedOtherAppeal.value,
        },
      });
    };

    return {
      isOtherOptionAvailable,
      appealsSelectionForm,
      checkNullOrEmptyRule,
      StudentRoutesConst,
      selectedAppealType,
      eligibleApplications,
      selectedApplicationId,
      loadingEligibleApplications,
      AppealTypes,
      applicationAppeals,
      selectedApplicationAppeals,
      selectedOtherAppeal,
      otherAppeals,
      goToAppealFormsRequests,
    };
  },
});
</script>
