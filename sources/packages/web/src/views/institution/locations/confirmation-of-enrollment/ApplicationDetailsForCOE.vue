<template>
  <div class="p-m-4">
    <HeaderNavigator
      title="Confirmation of enrolment"
      :routeLocation="{
        name: InstitutionRoutesConst.COE_SUMMARY,
        params: {
          locationId: locationId,
        },
      }"
      subTitle="View Financial Aid Application"
      ><template #buttons>
        <v-btn
          v-if="initialData.applicationCOEStatus === COEStatus.required"
          color="primary"
          @click="toggle"
          ><v-icon size="25">mdi-arrow-down-bold-circle</v-icon>Application
          Actions
        </v-btn>
      </template>
    </HeaderNavigator>
    <Menu class="mt-n15" ref="menu" :model="items" :popup="true" />
    <v-container>
      <Information :data="initialData" />
      <formio formName="confirmsstudentenrollment" :data="initialData"></formio>
    </v-container>
    <formio-modal-dialog
      max-width="730"
      ref="confirmCOEModal"
      title="Confirm enrolment"
      formName="confirmcoe"
    >
      <template #actions="{ cancel, submit }">
        <v-btn color="primary" variant="outlined" @click="cancel">Cancel</v-btn>
        <v-btn class="float-right primary-btn-background" @click="submit"
          >Continue to confirmation</v-btn
        >
      </template>
    </formio-modal-dialog>
    <ConfirmCOEEditModal ref="editCOEModal" />
    <ConfirmCOEDenyModal ref="denyCOEModal" @submitData="submitCOEDeny" />
  </div>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, watch } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import FormioModalDialog from "@/components/generic/FormioModalDialog.vue";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import Menu from "primevue/menu";
import {
  COEStatus,
  ApplicationDetailsForCOEDTO,
  DenyConfirmationOfEnrollment,
  ProgramInfoStatus,
  ApiProcessError,
} from "@/types";
import ConfirmCOEEditModal from "@/components/institutions/confirmation-of-enrollment/modals/ConfirmCOEEditModal.vue";
import ConfirmCOEDenyModal from "@/components/institutions/confirmation-of-enrollment/modals/ConfirmCOEDenyModal.vue";
import { useToastMessage, ModalDialog } from "@/composables";
import Information from "@/components/institutions/confirmation-of-enrollment/information.vue";
import {
  FIRST_COE_NOT_COMPLETE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
} from "@/constants";
import { ConfirmationOfEnrollmentAPIInDTO } from "@/services/http/dto/ConfirmationOfEnrolment.dto";
/**
 * added MenuType interface for prime vue component menu,
 *  remove it when vuetify component is used
 */

export interface MenuType {
  label?: string;
  icon?: string;
  separator?: boolean;
  command?: any;
  class?: string;
}

export default {
  components: {
    Menu,
    ConfirmCOEEditModal,
    ConfirmCOEDenyModal,
    Information,
    FormioModalDialog,
  },
  props: {
    disbursementScheduleId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const toast = useToastMessage();
    const initialData = ref({} as ApplicationDetailsForCOEDTO);
    const menu = ref();
    const items = ref([] as MenuType[]);
    const showModal = ref(false);
    const editCOEModal = ref({} as ModalDialog<boolean>);
    const denyCOEModal = ref({} as ModalDialog<void>);
    const confirmCOEModal = ref(
      {} as ModalDialog<ConfirmationOfEnrollmentAPIInDTO | boolean>,
    );
    const loadInitialData = async () => {
      initialData.value =
        await ConfirmationOfEnrollmentService.shared.getApplicationForCOE(
          props.disbursementScheduleId,
          props.locationId,
        );
    };
    const showHideConfirmCOE = async () => {
      const modalResult = await confirmCOEModal.value.showModal();
      if (!modalResult) {
        return;
      }
      try {
        const payload = modalResult as ConfirmationOfEnrollmentAPIInDTO;
        await ConfirmationOfEnrollmentService.shared.confirmCOE(
          props.locationId,
          props.disbursementScheduleId,
          payload,
        );
        toast.success("Confirmed", "Confirmation of Enrollment Confirmed!");
      } catch (error: unknown) {
        let errorLabel = "Unexpected error!";
        let errorMsg = "An error happened while confirming the COE.";
        if (error instanceof ApiProcessError) {
          switch (error.errorType) {
            case FIRST_COE_NOT_COMPLETE:
              errorLabel = "First COE is not completed.";
              errorMsg = error.message;
              break;
            case INVALID_TUITION_REMITTANCE_AMOUNT:
              errorLabel = "Invalid tuition remittance amount.";
              errorMsg = error.message;
              break;
          }
        }
        toast.error(errorLabel, errorMsg);
      }
    };
    const editProgramInformation = async () => {
      if (await editCOEModal.value.showModal()) {
        try {
          await ConfirmationOfEnrollmentService.shared.rollbackCOE(
            props.locationId,
            props.disbursementScheduleId,
          );
          toast.success(
            "Edit Program Information",
            "Program Information Request is now available to be edited.",
          );
          router.push({
            name: InstitutionRoutesConst.COE_SUMMARY,
            params: {
              locationId: props.locationId,
            },
          });
        } catch {
          toast.error(
            "Unexpected error",
            "An error happened while updating Confirmation of Enrollment.",
          );
        }
      }
    };
    const submitCOEDeny = async (
      submissionData: DenyConfirmationOfEnrollment,
    ) => {
      try {
        await ConfirmationOfEnrollmentService.shared.denyConfirmationOfEnrollment(
          props.locationId,
          props.disbursementScheduleId,
          submissionData,
        );
        toast.success("COE is Denied", "Application Status Has Been Updated.");
        router.push({
          name: InstitutionRoutesConst.COE_SUMMARY,
          params: {
            locationId: props.locationId,
          },
        });
      } catch {
        toast.error(
          "Unexpected error",
          "An error happened while denying Confirmation of Enrollment.",
        );
      }
    };
    const denyProgramInformation = async () => {
      await denyCOEModal.value.showModal();
    };
    const loadMenu = () => {
      items.value = [
        {
          label: "Confirm Enrollment",
          class:
            COEStatus.required === initialData.value.applicationCOEStatus &&
            !initialData.value.applicationWithinCOEWindow
              ? "text-muted"
              : "font-weight-bold",
          command: () => {
            if (
              COEStatus.required === initialData.value.applicationCOEStatus &&
              initialData.value.applicationWithinCOEWindow
            ) {
              showHideConfirmCOE();
            }
          },
        },
        { separator: true },
        {
          label: "Decline Request",
          class: "font-weight-bold",
          command: denyProgramInformation,
        },
      ];

      if (
        ProgramInfoStatus.notRequired !== initialData.value.applicationPIRStatus
      ) {
        items.value.push({ separator: true });
        items.value.push({
          label: "Edit Program Information",
          class: "font-weight-bold",
          command: editProgramInformation,
        });
      }
    };

    watch(
      () => initialData.value,
      () => {
        //update the list
        loadMenu();
      },
    );

    onMounted(async () => {
      loadMenu();
      await loadInitialData();
    });

    const toggle = (event: any) => {
      menu?.value?.toggle(event);
    };
    return {
      toggle,
      initialData,
      menu,
      items,
      COEStatus,
      showHideConfirmCOE,
      showModal,
      loadInitialData,
      editCOEModal,
      denyCOEModal,
      submitCOEDeny,
      InstitutionRoutesConst,
      confirmCOEModal,
    };
  },
};
</script>
