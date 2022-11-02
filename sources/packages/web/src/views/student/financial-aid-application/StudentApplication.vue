<template>
  <v-form ref="startApplicationForm">
    <modal-dialog-base
      title="Application already in progress"
      dialogType="warning"
      :showDialog="showDialog"
      @dialogClosed="dialogClosed"
    >
      <template v-slot:content>
        <v-container>
          <form>
            <p>There is already a draft of an application in progress.</p>
            <p>Please continue your draft application or cancel it.</p>
          </form>
        </v-container>
      </template>
      <template v-slot:footer>
        <footer-buttons
          secondaryLabel="Close"
          :showPrimaryButton="false"
          @secondaryClick="dialogClosed"
        />
      </template>
    </modal-dialog-base>
    <student-page-container full-width="true">
      <template #header>
        <header-navigator
          title="Applications"
          subTitle="Start New Application"
          :routeLocation="{
            name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
          }"
        >
          <template #buttons>
            <start-application />
          </template>
        </header-navigator>
      </template>
      <h2 class="category-header-large primary-color pb-4">
        Apply for funding
      </h2>
      <content-group>
        <div class="category-header-medium-small pa-2">
          Financial Aid Application
        </div>
        <div class="pb-6 px-2">
          Apply to see if you are applicable for provincial or federal loans and
          grant. This is for students attending full-time or part-time
          post-secondary studies.
        </div>
        <div class="category-header-medium-small pb-3 px-2">
          Select program year
        </div>
        <v-select
          v-model="programYearId"
          :items="programYearOptions"
          variant="solo"
          density="compact"
          label="Select year"
          class="px-2 pb-4"
          :rules="[(v) => checkNullOrEmptyRule(v, 'Year')]"
          hide-details="auto"
        ></v-select>
        <v-btn
          class="ma-2"
          variant="elevated"
          data-cy="primaryFooterButton"
          color="primary"
          @click="startApplication"
          >Start Application</v-btn
        >
      </content-group>
    </student-page-container>
  </v-form>
</template>
<script lang="ts">
import { onMounted, ref } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useSnackBar, useModalDialog, useRules } from "@/composables";
import { useRouter } from "vue-router";
import { VForm, SelectItemType } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { ProgramYearService } from "@/services/ProgramYearService";
import ContentGroup from "@/components/generic/ContentGroup.vue";

export default {
  components: { ModalDialogBase, ContentGroup },
  setup() {
    const initialData = ref({});
    const router = useRouter();
    const snackBar = useSnackBar();
    const { showDialog, showModal } = useModalDialog<void>();
    const programYearOptions = ref([] as SelectItemType[]);
    const programYearId = ref();
    const startApplicationForm = ref({} as VForm);
    const { checkNullOrEmptyRule } = useRules();

    onMounted(async () => {
      const programYearOptionTmp =
        await ProgramYearService.shared.getProgramYearOptions();
      programYearOptions.value = programYearOptionTmp.map((yearOption) => {
        return {
          title: yearOption.description,
          value: yearOption.id.toString(),
        };
      });
    });

    const dialogClosed = () => {
      showDialog.value = false;
    };
    const startApplication = async () => {
      try {
        const validationResult = await startApplicationForm.value.validate();
        if (!validationResult.valid) {
          return;
        }
        if (programYearId.value) {
          const programYearNumberId = Number(programYearId.value);
          const createDraftResult =
            await ApplicationService.shared.createApplicationDraft({
              programYearId: programYearNumberId,
              data: {},
              associatedFiles: [],
            });
          if (createDraftResult.draftAlreadyExists) {
            showDialog.value = true;
            return;
          }
          const programYear =
            await ProgramYearService.shared.getActiveProgramYear(
              programYearNumberId,
            );
          if (programYear) {
            router.push({
              name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
              params: {
                selectedForm: programYear.formName,
                programYearId: programYearNumberId,
                id: Number(createDraftResult.draftId),
              },
            });
          }
        }
      } catch (error) {
        snackBar.error(
          "An error happened while trying to start a new application.",
        );
      }
    };

    return {
      initialData,
      showModal,
      showDialog,
      dialogClosed,
      StudentRoutesConst,
      programYearOptions,
      programYearId,
      startApplication,
      startApplicationForm,
      checkNullOrEmptyRule,
    };
  },
};
</script>
