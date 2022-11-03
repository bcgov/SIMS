<template>
  <student-page-container :layout-template="LayoutTemplates.Centered">
    <template #header>
      <header-navigator
        title="Applications"
        subTitle="Start New Application"
        :routeLocation="{
          name: StudentRoutesConst.STUDENT_APPLICATION_SUMMARY,
        }"
      >
      </header-navigator>
    </template>
    <v-form ref="startApplicationForm">
      <h2 class="category-header-large primary-color pb-4">
        Apply for new funding
      </h2>
      <content-group>
        <h3 class="category-header-medium-small pa-2">
          Financial Aid Application
        </h3>
        <p class="px-2">
          Apply to see if you are applicable for provincial or federal loans and
          grant. This is for students attending full-time or part-time
          post-secondary studies.
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
    </v-form>
  </student-page-container>
  <modal-dialog-base
    title="Application already in progress"
    dialogType="warning"
    :showDialog="showDialog"
    @dialogClosed="closeDialog"
  >
    <template #content>
      <v-container>
        <p>
          There is already an application selected with this program year.
          Please continue with that application or cancel it to start a new
          application.
        </p>
      </v-container>
    </template>
    <template #footer>
      <footer-buttons
        primaryLabel="Close"
        :showSecondaryButton="false"
        @primaryClick="closeDialog"
      />
    </template>
  </modal-dialog-base>
</template>
<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useSnackBar, useModalDialog, useRules } from "@/composables";
import { useRouter } from "vue-router";
import { VForm, SelectItemType, LayoutTemplates } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { ProgramYearService } from "@/services/ProgramYearService";
import ContentGroup from "@/components/generic/ContentGroup.vue";

export default defineComponent({
  components: { ModalDialogBase, ContentGroup },
  setup() {
    const initialData = ref({});
    const router = useRouter();
    const snackBar = useSnackBar();
    const { showDialog, showModal } = useModalDialog<void>();
    const programYearOptions = ref([] as SelectItemType[]);
    const programYearId = ref<number>();
    const startApplicationForm = ref({} as VForm);
    const { checkNullOrEmptyRule } = useRules();

    onMounted(async () => {
      const programYearOptionTmp =
        await ProgramYearService.shared.getProgramYearOptions();
      programYearOptions.value = programYearOptionTmp.map((yearOption) => ({
        title: yearOption.description,
        value: yearOption.id.toString(),
      }));
    });

    const closeDialog = () => {
      showDialog.value = false;
    };
    const startApplication = async () => {
      try {
        const validationResult = await startApplicationForm.value.validate();
        if (!validationResult.valid) {
          return;
        }
        if (programYearId.value) {
          const createDraftResult =
            await ApplicationService.shared.createApplicationDraft({
              programYearId: programYearId.value,
              data: {},
              associatedFiles: [],
            });
          if (createDraftResult.draftAlreadyExists) {
            showDialog.value = true;
            return;
          }
          const programYear =
            await ProgramYearService.shared.getActiveProgramYear(
              programYearId.value,
            );
          if (programYear) {
            router.push({
              name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM,
              params: {
                selectedForm: programYear.formName,
                programYearId: programYearId.value,
                id: createDraftResult.draftId,
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
      closeDialog,
      StudentRoutesConst,
      programYearOptions,
      programYearId,
      startApplication,
      startApplicationForm,
      checkNullOrEmptyRule,
      LayoutTemplates,
    };
  },
});
</script>
