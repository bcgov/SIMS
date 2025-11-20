<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Applications"
        sub-title="Start New Application"
        :route-location="{
          name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
        }"
      >
      </header-navigator>
    </template>
    <v-form ref="startApplicationForm">
      <h2 class="category-header-large primary-color pb-4">
        Apply for funding
      </h2>
      <content-group
        ><p class="category-header-medium-small pa-2">
          Financial Aid Application
        </p>
        <p class="px-2">
          In what capacity will you be attending this program?
          <tooltip-icon
            >A student is considered to be in part-time studies when taking
            between 20% and 59% of a full-time course load in a course or
            continuous period of study.</tooltip-icon
          >
        </p>
        <v-select
          v-model="offeringIntensity"
          :items="offeringIntensityOptions"
          variant="outlined"
          density="compact"
          label="Select offering intensity"
          class="px-2 pb-4"
          :rules="[(v) => checkNullOrEmptyRule(v, 'Offering intensity')]"
          hide-details="auto"
          @update:model-value="offeringIntensityUpdated"
          required
        ></v-select>
        <p class="px-2">
          Please select your program year. This is for students attending
          full-time or part-time studies.
        </p>
        <v-select
          v-model="programYearId"
          :items="programYearOptions"
          variant="outlined"
          density="compact"
          label="Select program year"
          class="px-2 pb-4"
          :rules="[(v) => checkNullOrEmptyRule(v, 'Year')]"
          hide-details="auto"
          required
          :loading="loadingAvailableProgramYears"
        ></v-select>
        <v-btn
          class="ma-2"
          variant="elevated"
          data-cy="primaryFooterButton"
          color="primary"
          :disabled="sinValidStatus !== SINStatusEnum.VALID"
          @click="startApplication"
          >Start Application</v-btn
        >
      </content-group>
    </v-form>
  </student-page-container>
  <confirm-modal
    title="Application already in progress"
    text="There is already a draft of an application in progress. Please continue
        with your draft application or cancel it and start a new application."
    :show-secondary-button="false"
    ok-label="Close"
    ref="draftApplicationModal"
  >
  </confirm-modal>
</template>
<script lang="ts">
import { ref, defineComponent, computed, watchEffect } from "vue";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import {
  useSnackBar,
  useRules,
  ModalDialog,
  useOffering,
  useStudentStore,
} from "@/composables";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import {
  VForm,
  SelectItemType,
  LayoutTemplates,
  ApiProcessError,
  OfferingIntensity,
  DynamicFormType,
} from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { ProgramYearService } from "@/services/ProgramYearService";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import { MORE_THAN_ONE_APPLICATION_DRAFT_ERROR } from "@/types/contracts/ApiProcessError";
import {
  PrimaryIdentifierAPIOutDTO,
  ProgramYearApiOutDTO,
} from "@/services/http/dto";
import { AppConfigService } from "@/services/AppConfigService";
import { DynamicFormConfigurationService } from "@/services/DynamicFormConfigurationService";
import { SINStatusEnum } from "@/types";

export default defineComponent({
  components: { ConfirmModal, ContentGroup },
  setup() {
    const { hasFulltimeAccess, sinValidStatus } = useStudentStore();
    const initialData = ref({});
    const router = useRouter();
    const snackBar = useSnackBar();
    const programYearId = ref<number>();
    const offeringIntensity = ref<OfferingIntensity>();
    const startApplicationForm = ref({} as VForm);
    const { checkNullOrEmptyRule } = useRules();
    const { mapOfferingIntensities } = useOffering();
    const draftApplicationModal = ref({} as ModalDialog<boolean>);
    const offeringIntensityOptions = ref([] as SelectItemType[]);
    const programYearsOptions = ref([] as ProgramYearApiOutDTO[]);
    const loadingAvailableProgramYears = ref(false);

    watchEffect(async () => {
      const { isFulltimeAllowed } = await AppConfigService.shared.config();
      const intensities = mapOfferingIntensities(
        isFulltimeAllowed,
        hasFulltimeAccess.value,
      );
      offeringIntensityOptions.value = Object.keys(intensities).map((key) => ({
        title: intensities[key],
        value: key,
      }));
      try {
        loadingAvailableProgramYears.value = true;
        programYearsOptions.value =
          await ProgramYearService.shared.getProgramYears();
      } catch {
        snackBar.error("Unexpected error while loading program years.");
      } finally {
        loadingAvailableProgramYears.value = false;
      }
    });

    /**
     * Program years options available based on the
     * selected offering intensity.
     */
    const programYearOptions = computed(() => {
      const yearOptions = [] as SelectItemType[];
      if (!offeringIntensity.value) {
        return yearOptions;
      }
      for (const yearOption of programYearsOptions.value) {
        if (yearOption.offeringIntensity.includes(offeringIntensity.value)) {
          yearOptions.push({
            title: yearOption.description,
            value: yearOption.id.toString(),
          });
        }
      }
      return yearOptions;
    });

    const sinValidStatus = computed(
      () => store.state.student.sinValidStatus.sinStatus,
    ).value;

    const startApplication = async () => {
      try {
        const validationResult = await startApplicationForm.value.validate();
        if (!validationResult.valid) {
          return;
        }
        // When the form is valid, the selected offering intensity cannot be null.
        const selectedIntensity = offeringIntensity.value as OfferingIntensity;
        if (programYearId.value) {
          const { id }: PrimaryIdentifierAPIOutDTO =
            await ApplicationService.shared.createApplicationDraft({
              programYearId: programYearId.value,
              offeringIntensity: selectedIntensity,
              data: {},
              associatedFiles: [],
            });

          const createDraftResult = {
            draftAlreadyExists: false,
            draftId: id,
          };
          const dynamicFormConfiguration =
            await DynamicFormConfigurationService.shared.getDynamicFormConfiguration(
              DynamicFormType.StudentFinancialAidApplication,
              {
                programYearId: programYearId.value,
                offeringIntensity: selectedIntensity,
              },
            );
          router.push({
            name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
            params: {
              selectedForm: dynamicFormConfiguration.formDefinitionName,
              programYearId: programYearId.value,
              id: createDraftResult.draftId,
            },
          });
        }
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          if (error.errorType === MORE_THAN_ONE_APPLICATION_DRAFT_ERROR) {
            await draftApplicationModal.value.showModal();
            return;
          }
        }
        snackBar.error(
          "An error happened while starting an application or obtaining the dynamic form configuration.",
        );
      }
    };

    /**
     * Resets the available program years once the intensity changes.
     */
    const offeringIntensityUpdated = () => {
      programYearId.value = undefined;
    };

    return {
      initialData,
      StudentRoutesConst,
      programYearOptions,
      programYearId,
      offeringIntensity,
      startApplication,
      startApplicationForm,
      checkNullOrEmptyRule,
      LayoutTemplates,
      draftApplicationModal,
      offeringIntensityOptions,
      offeringIntensityUpdated,
      loadingAvailableProgramYears,
      SINStatusEnum,
      sinValidStatus,
    };
  },
});
</script>
