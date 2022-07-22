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
        <v-btn class="float-right" @click="submit" color="primary"
          >Continue to confirmation</v-btn
        >
      </template>
    </formio-modal-dialog>
    <ConfirmCOEDenyModal ref="denyCOEModal" @submitData="submitCOEDeny" />
  </div>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, watch } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import FormioModalDialog from "@/components/generic/FormioModalDialog.vue";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import { COEStatus, FormIOForm, ApiProcessError, MenuType } from "@/types";
import ConfirmCOEDenyModal from "@/components/institutions/confirmation-of-enrollment/modals/ConfirmCOEDenyModal.vue";
import { useSnackBar, ModalDialog } from "@/composables";
import Information from "@/components/institutions/confirmation-of-enrollment/information.vue";
import {
  FIRST_COE_NOT_COMPLETE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
} from "@/constants";

import {
  ApplicationDetailsForCOEAPIOutDTO,
  ConfirmationOfEnrollmentAPIInDTO,
  DenyConfirmationOfEnrollmentAPIInDTO,
} from "@/services/http/dto";

export default {
  components: {
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
    const snackBar = useSnackBar();
    const initialData = ref({} as ApplicationDetailsForCOEAPIOutDTO);
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
        await ConfirmationOfEnrollmentService.shared.confirmEnrollment(
          props.locationId,
          props.disbursementScheduleId,
          payload,
        );
        snackBar.success("Confirmation of Enrollment Confirmed!");
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
    const submitCOEDeny = async (
      submissionData: DenyConfirmationOfEnrollmentAPIInDTO,
    ) => {
      try {
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
