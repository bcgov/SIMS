<template>
  <div class="p-m-4">
    <header-navigator
      title="Confirmation of enrolment"
      :routeLocation="{
        name: InstitutionRoutesConst.COE_SUMMARY,
        params: {
          locationId: locationId,
        },
      }"
      subTitle="View Financial Aid Application"
      ><template #buttons>
        <v-menu v-if="initialData.applicationCOEStatus === COEStatus.required">
          <template v-slot:activator="{ props }">
            <v-btn color="primary" v-bind="props">
              <v-icon size="25">mdi-arrow-down-bold-circle</v-icon>
              Application Actions
            </v-btn>
          </template>
          <v-list>
            <template v-for="(item, index) in items" :key="index">
              <v-list-item :value="index">
                <v-list-item-title
                  @click="item.command"
                  :class="item.textColor"
                >
                  <span class="label-bold">{{ item.label }}</span>
                </v-list-item-title>
              </v-list-item>
              <v-divider
                v-if="index < items.length - 1"
                :key="index"
                inset
              ></v-divider>
            </template>
          </v-list>
        </v-menu>
      </template>
    </header-navigator>

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
import {
  COEStatus,
  ApplicationDetailsForCOEDTO,
  DenyConfirmationOfEnrollment,
  ProgramInfoStatus,
  FormIOForm,
  ApiProcessError,
  MenuType,
} from "@/types";
import ConfirmCOEEditModal from "@/components/institutions/confirmation-of-enrollment/modals/ConfirmCOEEditModal.vue";
import ConfirmCOEDenyModal from "@/components/institutions/confirmation-of-enrollment/modals/ConfirmCOEDenyModal.vue";
import { useSnackBar, ModalDialog } from "@/composables";
import Information from "@/components/institutions/confirmation-of-enrollment/information.vue";
import {
  FIRST_COE_NOT_COMPLETE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
} from "@/constants";
import { ConfirmationOfEnrollmentAPIInDTO } from "@/services/http/dto/ConfirmationOfEnrolment.dto";
import useEmitter from "@/composables/useEmitter";

export default {
  components: {
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
    const emitter = useEmitter();
    const router = useRouter();
    const toast = useSnackBar();
    const initialData = ref({} as ApplicationDetailsForCOEDTO);
    const items = ref([] as MenuType[]);
    const showModal = ref(false);
    const editCOEModal = ref({} as ModalDialog<boolean>);
    const denyCOEModal = ref({} as ModalDialog<void>);
    const confirmCOEModal = ref({} as ModalDialog<FormIOForm & boolean>);
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
        const payload = modalResult.data as ConfirmationOfEnrollmentAPIInDTO;
        payload.tuitionRemittanceAmount = payload.tuitionRemittanceAmount ?? 0;
        await ConfirmationOfEnrollmentService.shared.confirmCOE(
          props.locationId,
          props.disbursementScheduleId,
          payload,
        );
        emitter.emit(
          "snackBar",
          toast.success("Confirmation of Enrollment Confirmed!"),
        );
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
        emitter.emit("snackBar", toast.error(`${errorLabel}. ${errorMsg}`));
      }
    };
    const editProgramInformation = async () => {
      if (await editCOEModal.value.showModal()) {
        try {
          await ConfirmationOfEnrollmentService.shared.rollbackCOE(
            props.locationId,
            props.disbursementScheduleId,
          );
          emitter.emit(
            "snackBar",
            toast.success(
              "Program Information Request is now available to be edited.",
            ),
          );
          router.push({
            name: InstitutionRoutesConst.COE_SUMMARY,
            params: {
              locationId: props.locationId,
            },
          });
        } catch {
          emitter.emit(
            "snackBar",
            toast.error(
              "An error happened while updating Confirmation of Enrollment.",
            ),
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
        emitter.emit(
          "snackBar",
          toast.success("Application Status Has Been Updated."),
        );
        router.push({
          name: InstitutionRoutesConst.COE_SUMMARY,
          params: {
            locationId: props.locationId,
          },
        });
      } catch {
        emitter.emit(
          "snackBar",
          toast.error(
            "An error happened while denying Confirmation of Enrollment.",
          ),
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
          textColor:
            COEStatus.required === initialData.value.applicationCOEStatus &&
            !initialData.value.applicationWithinCOEWindow
              ? "text-muted"
              : "",
          command: () => {
            if (
              COEStatus.required === initialData.value.applicationCOEStatus &&
              initialData.value.applicationWithinCOEWindow
            ) {
              showHideConfirmCOE();
            }
          },
        },
        {
          label: "Decline Request",
          command: denyProgramInformation,
        },
      ];

      if (
        ProgramInfoStatus.notRequired !== initialData.value.applicationPIRStatus
      ) {
        items.value.push({
          label: "Edit Program Information",
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

    return {
      initialData,
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
