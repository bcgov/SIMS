<template>
  <full-page-container v-if="applicationDetail.data" class="my-2">
    <template #header>
      <header-navigator
        title="Back to student applications"
        :routeLocation="{
          name: AESTRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId },
        }"
        subTitle="Financial Aid Application"
        ><template
          #buttons
          v-if="
            applicationDetail.applicationEditStatus ===
              ApplicationEditStatus.ChangePendingApproval &&
            showApplicationChangeAssessButtons
          "
        >
          <check-permission-role :role="Role.StudentApproveDeclineAppeals">
            <template #="{ notAllowed }">
              <v-btn
                color="primary"
                variant="outlined"
                @click="
                  assessApplicationChangeRequest(
                    ApplicationEditStatus.ChangeDeclined,
                  )
                "
                :disabled="notAllowed"
                >Decline</v-btn
              >
              <v-btn
                class="ml-2"
                color="primary"
                @click="
                  assessApplicationChangeRequest(
                    ApplicationEditStatus.ChangedWithApproval,
                  )
                "
                :disabled="notAllowed"
                >Approve</v-btn
              >
            </template>
          </check-permission-role>
        </template>
      </header-navigator>
      <application-header-title :application-id="applicationId" />
    </template>
    <h2 class="color-blue pb-4">Student Application Details</h2>
    <StudentApplication
      @render="formRender"
      :selectedForm="selectedForm"
      :initialData="initialData"
      :programYearId="applicationDetail.applicationProgramYearID"
      :isReadOnly="true"
      :is-data-ready="isDataReady"
    />
    <assess-application-change-request-modal
      ref="assessApplicationChangeRequestModal"
    />
  </full-page-container>
  <router-view />
</template>
<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import {
  ApplicationBaseAPIOutDTO,
  ApplicationDataChangeAPIOutDTO,
  ApplicationSupplementalDataAPIOutDTO,
  ApplicationChangeRequestAPIInDTO,
} from "@/services/http/dto";
import { ApplicationService } from "@/services/ApplicationService";
import { ApplicationChangeRequestService } from "@/services/ApplicationChangeRequestService";
import { useFormatters } from "@/composables/useFormatters";
import StudentApplication from "@/components/common/StudentApplication.vue";
import { ModalDialog, useFormioUtils, useSnackBar } from "@/composables";
import {
  ApiProcessError,
  ApplicationEditStatus,
  ChangeTypes,
  FormIOComponent,
  FormIOForm,
  FromIOComponentTypes,
  Role,
  StudentApplicationFormData,
} from "@/types";
import router from "@/router";
import AssessApplicationChangeRequestModal from "@/components/aest/students/modals/AssessApplicationChangeRequestModal.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import useEmitterEvents from "@/composables/useEmitterEvents";
import { INVALID_APPLICATION_EDIT_STATUS } from "@/constants";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";

export default defineComponent({
  components: {
    StudentApplication,
    AssessApplicationChangeRequestModal,
    CheckPermissionRole,
    ApplicationHeaderTitle,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    versionApplicationId: {
      type: Number,
      required: false,
    },
  },
  setup(props) {
    const { emptyStringFiller } = useFormatters();
    const { searchByKey } = useFormioUtils();
    const applicationDetail = ref({} as ApplicationSupplementalDataAPIOutDTO);
    const initialData = ref({} as StudentApplicationFormData);
    const selectedForm = ref();
    let applicationWizard: FormIOForm;
    const assessApplicationChangeRequestModal = ref(
      {} as ModalDialog<ApplicationChangeRequestAPIInDTO>,
    );
    const snackBar = useSnackBar();
    // Event emitter for application sidebar refresh.
    const { refreshApplicationSidebar } = useEmitterEvents();
    const showApplicationChangeAssessButtons = ref(true);
    const isDataReady = ref(false);

    /**
     * Happens when all the form components are rendered, including lists.
     */
    const formRender = async (form: FormIOForm) => {
      applicationWizard = form;
      // Highlight changes in the form after all the components are rendered.
      // List components are ready only after the form is rendered.
      highlightChanges();
    };

    /**
     * Loads the initial application data.
     */
    onMounted(async () => {
      // When the application version is present load the given application version instead of the current application version.
      const applicationId = props.versionApplicationId ?? props.applicationId;
      let application: ApplicationBaseAPIOutDTO;
      application = await ApplicationService.shared.getApplicationDetail(
        applicationId,
      );
      applicationDetail.value =
        application as ApplicationSupplementalDataAPIOutDTO;
      selectedForm.value = applicationDetail.value.applicationFormName;
      initialData.value = {
        ...applicationDetail.value.data,
        applicationOfferingIntensityValue:
          applicationDetail.value.applicationOfferingIntensity,
        isReadOnly: true,
      };
      isDataReady.value = true;
    });

    /**
     * Check if the application has changes to be highlighted.
     * Changes are expected after applications are edited after submitted at least once.
     */
    function highlightChanges() {
      if (!applicationWizard || !applicationDetail.value.changes?.length) {
        return;
      }
      highlightChangesRecursive(
        applicationWizard,
        applicationDetail.value.changes,
      );
    }

    /**
     * Apply the style class to the components that have changes.
     * @param parentComponent component to have the changes highlighted.
     * @param changes list of changes to be highlighted.
     */
    function highlightChangesRecursive(
      parentComponent: FormIOComponent,
      changes: ApplicationDataChangeAPIOutDTO[],
    ) {
      for (const change of changes) {
        let searchComponent: FormIOComponent | undefined;
        if (typeof change.index === "number") {
          // The item to be processed is an array item.
          searchComponent = processArrayItem(
            parentComponent,
            change.index,
            change,
          );
        } else if (change.key) {
          // The item to be processed is a component.
          searchComponent = parentComponent;
        }
        if (!change.key || !searchComponent?.components?.length) {
          continue;
        }
        const [component] = searchByKey(searchComponent.components, change.key);
        if (component) {
          applyChangedValueStyleClass(component, change.changeType);
          if (change.changes) {
            // Should check further for nested changes.
            highlightChangesRecursive(component, change.changes);
          }
        }
      }
    }

    /**
     * Process an array item component.
     * @param parentComponent component that contains the array item.
     * @param changeIndex index of the array item that has the change.
     * @param change change object that contains the change details.
     * @returns component if it exists, otherwise undefined.
     */
    function processArrayItem(
      parentComponent: FormIOComponent,
      changeIndex: number,
      change: ApplicationDataChangeAPIOutDTO,
    ): FormIOComponent | undefined {
      const searchComponent = parentComponent?.components?.length
        ? parentComponent.components[changeIndex]
        : undefined;
      if (searchComponent && change.changes) {
        // Should check further for nested changes.
        highlightChangesRecursive(searchComponent, change.changes);
      } else if (searchComponent) {
        // searchComponent has a change, but no nested changes.
        // It also does not have a key because it is a child in a list.
        applyChangedValueStyleClass(searchComponent, change.changeType);
      }
      return searchComponent;
    }

    /**
     * Apply the proper highlight style to a changed component.
     * @param component component to received the style.
     * @param changeType indicates the operation that has changed the value,
     * which may required a different style to be applied.
     */
    function applyChangedValueStyleClass(
      component: FormIOComponent,
      changeType: ChangeTypes,
    ) {
      if (
        component.type === FromIOComponentTypes.Hidden ||
        component._visible === false
      ) {
        return;
      }
      let cssClass: string;
      switch (changeType) {
        case ChangeTypes.ItemsAppended:
          cssClass = "changed-list-item-appended";
          break;
        case ChangeTypes.ItemsRemoved:
          cssClass = "changed-list-item-removed";
          break;
        default:
          cssClass = "changed-value";
          break;
      }
      document.getElementById(component.id)?.classList.add(cssClass);
    }

    /**
     * Show the modal for Ministry user confirmation of the
     * change request assessment.
     * @param applicationChangeRequestStatus change request status.
     */
    const assessApplicationChangeRequest = async (
      applicationChangeRequestStatus:
        | ApplicationEditStatus.ChangedWithApproval
        | ApplicationEditStatus.ChangeDeclined,
    ) => {
      await assessApplicationChangeRequestModal.value.showModal(
        applicationChangeRequestStatus,
        processAssessApplicationChangeRequest,
      );
    };

    /**
     * Process the Ministry change request assessment.
     * @param payload payload with the Ministry assessment.
     * @returns returns true if the operation was succeeded and
     * the modal can be close, otherwise keeps the modal open.
     */
    const processAssessApplicationChangeRequest = async (
      payload: ApplicationChangeRequestAPIInDTO,
    ): Promise<boolean> => {
      try {
        await ApplicationChangeRequestService.shared.assessApplicationChangeRequest(
          props.versionApplicationId as number,
          payload,
        );
        if (
          payload.applicationEditStatus ===
          ApplicationEditStatus.ChangedWithApproval
        ) {
          snackBar.success("Change approved.");
          // Redirect to the application details page with the current application ID only when the change is approved.
          router.push({
            name: AESTRoutesConst.APPLICATION_DETAILS,
            params: {
              // When the change request is approved, the version application becomes the current application.
              applicationId: props.versionApplicationId,
              studentId: props.studentId,
            },
          });
        } else {
          snackBar.success("Change declined.");
        }
        // Hide the buttons after the change request is assessed.
        showApplicationChangeAssessButtons.value = false;
        // Emit the event to refresh the application sidebar after the application change request is assessed.
        refreshApplicationSidebar();
        return true;
      } catch (error: unknown) {
        if (
          error instanceof ApiProcessError &&
          error.errorType === INVALID_APPLICATION_EDIT_STATUS
        ) {
          snackBar.warn("Change cancelled by student.");
        } else {
          snackBar.error(
            "Unexpected error while updating the application change request.",
          );
        }
        return false;
      }
    };

    return {
      formRender,
      applicationDetail,
      initialData,
      selectedForm,
      AESTRoutesConst,
      emptyStringFiller,
      ApplicationEditStatus,
      Role,
      assessApplicationChangeRequest,
      assessApplicationChangeRequestModal,
      showApplicationChangeAssessButtons,
      isDataReady,
    };
  },
});
</script>
