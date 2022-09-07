<template>
  <full-page-container layout-template="centered">
    <template #header>
      <header-navigator
        title="Confirm enrolment"
        :routeLocation="{
          name: InstitutionRoutesConst.COE_SUMMARY,
          params: {
            locationId: locationId,
          },
        }"
        subTitle="View Financial Aid Application"
        ><template #buttons>
          <v-menu
            v-if="initialData.applicationCOEStatus === COEStatus.required"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                color="primary"
                v-bind="props"
                prepend-icon="fa:fa fa-chevron-circle-down"
              >
                Application actions
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
    </template>
    <!-- TODO: ANN form definition -->
    <formio-container
      formName="confirmsStudentEnrollment"
      :formData="initialData"
    />
    <!-- Approve modal -->
    <formio-modal-dialog
      max-width="730"
      ref="confirmCOEModal"
      title="Confirm enrolment"
      formName="confirmCOE"
    >
      <template #actions="{ cancel, submit }">
        <v-row class="m-0 p-0">
          <v-btn color="primary" variant="outlined" @click="cancel"
            >Cancel</v-btn
          >
          <v-btn
            class="float-right"
            @click="submit"
            color="primary"
            variant="elevated"
            >Continue to confirmation</v-btn
          >
        </v-row>
      </template>
    </formio-modal-dialog>
    <!-- todo: ann confirm with if this form modals needs to be moved to vue??? -->
    <!-- Deny modal -->
    <formio-modal-dialog
      max-width="730"
      ref="denyCOEModal"
      title="Decline enrolment"
      formName="declineConfirmationOfEnrollment"
      @loaded="denyFormLoaded"
    >
      <template #actions="{ cancel, submit }">
        <v-row class="m-0 p-0">
          <v-btn color="primary" variant="outlined" @click="cancel"
            >Cancel</v-btn
          >
          <v-btn
            class="float-right"
            @click="submit"
            color="primary"
            variant="elevated"
            >Decline enrolment now</v-btn
          >
        </v-row>
      </template>
    </formio-modal-dialog>
  </full-page-container>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, watch } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import FormioModalDialog from "@/components/generic/FormioModalDialog.vue";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import { COEStatus, FormIOForm, ApiProcessError, MenuType } from "@/types";
import { useSnackBar, ModalDialog, useFormioUtils } from "@/composables";
import {
  FIRST_COE_NOT_COMPLETE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
} from "@/constants";

import {
  ApplicationDetailsForCOEAPIOutDTO,
  ConfirmationOfEnrollmentAPIInDTO,
  DenyConfirmationOfEnrollmentAPIInDTO,
} from "@/services/http/dto";
const COE_DENIAL_REASON_RADIO = "coeDenyReasonId";

export default {
  components: {
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
    const snackBar = useSnackBar();
    const initialData = ref({} as ApplicationDetailsForCOEAPIOutDTO);
    const items = ref([] as MenuType[]);
    const denyCOEModal = ref({} as ModalDialog<FormIOForm & boolean>);
    const confirmCOEModal = ref({} as ModalDialog<FormIOForm & boolean>);
    const formioUtils = useFormioUtils();

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
        await ConfirmationOfEnrollmentService.shared.confirmEnrollment(
          props.locationId,
          props.disbursementScheduleId,
          payload,
        );
        snackBar.success("Confirmation of Enrollment Confirmed!");
        router.push({
          name: InstitutionRoutesConst.COE_SUMMARY,
          params: {
            locationId: props.locationId,
          },
        });
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
        snackBar.error(`${errorLabel}. ${errorMsg}`);
      }
    };

    const denyProgramInformation = async () => {
      const modalResult = await denyCOEModal.value.showModal();
      if (!modalResult) {
        return;
      }
      try {
        const submissionData =
          modalResult.data as DenyConfirmationOfEnrollmentAPIInDTO;
        await ConfirmationOfEnrollmentService.shared.denyConfirmationOfEnrollment(
          props.locationId,
          props.disbursementScheduleId,
          submissionData,
        );
        snackBar.success("Application Status Has Been Updated.");
        router.push({
          name: InstitutionRoutesConst.COE_SUMMARY,
          params: {
            locationId: props.locationId,
          },
        });
      } catch {
        snackBar.error(
          "An error happened while denying Confirmation of Enrolment.",
        );
      }
    };

    const loadMenu = () => {
      items.value = [
        {
          label: "Confirm enrolment",
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
          label: "Decline enrolment",
          command: denyProgramInformation,
        },
      ];
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

    const denyFormLoaded = async (form: FormIOForm) => {
      formioUtils.setRadioOptions(
        form,
        COE_DENIAL_REASON_RADIO,
        await ConfirmationOfEnrollmentService.shared.getCOEDenialReasons(),
      );
    };

    return {
      initialData,
      items,
      COEStatus,
      showHideConfirmCOE,
      loadInitialData,
      denyCOEModal,
      InstitutionRoutesConst,
      confirmCOEModal,
      denyFormLoaded,
    };
  },
};
</script>
