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
                <v-list-item :value="index" @click="item.command">
                  <v-list-item-title :class="item.textColor">
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
    <formio-container
      formName="confirmsStudentEnrollment"
      :formData="initialData"
    />
    <!-- Approve modal -->
    <approve-c-o-e ref="confirmCOEModal" />
    <!-- Deny modal -->
    <deny-c-o-e ref="denyCOEModal" />
  </full-page-container>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, watch } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import {
  COEStatus,
  ApiProcessError,
  MenuType,
  ApproveConfirmEnrollmentModel,
} from "@/types";
import { useSnackBar, ModalDialog, useCOE } from "@/composables";
import {
  FIRST_COE_NOT_COMPLETE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
} from "@/constants";

import {
  ApplicationDetailsForCOEAPIOutDTO,
  DenyConfirmationOfEnrollmentAPIInDTO,
} from "@/services/http/dto";
import ApproveCOE from "@/components/institutions/modals/confirmationOfEnrollment/ApproveCOE.vue";
import DenyCOE from "@/components/institutions/modals/confirmationOfEnrollment/DenyCOE.vue";

export default {
  components: {
    ApproveCOE,
    DenyCOE,
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
    const { mapCOEChipStatus } = useCOE();
    const router = useRouter();
    const snackBar = useSnackBar();
    const initialData = ref({} as ApplicationDetailsForCOEAPIOutDTO);
    const items = ref([] as MenuType[]);
    const denyCOEModal = ref(
      {} as ModalDialog<DenyConfirmationOfEnrollmentAPIInDTO | boolean>,
    );
    const confirmCOEModal = ref(
      {} as ModalDialog<ApproveConfirmEnrollmentModel | boolean>,
    );

    const loadInitialData = async () => {
      initialData.value =
        await ConfirmationOfEnrollmentService.shared.getApplicationForCOE(
          props.disbursementScheduleId,
          props.locationId,
        );
      initialData.value.coeStatusClass = mapCOEChipStatus(
        initialData.value.applicationCOEStatus,
      );
    };

    const showHideConfirmCOE = async () => {
      const modalResult = await confirmCOEModal.value.showModal();
      if (!modalResult) {
        return;
      }
      try {
        const payload = modalResult as ApproveConfirmEnrollmentModel;
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
          modalResult as DenyConfirmationOfEnrollmentAPIInDTO;
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

    return {
      initialData,
      items,
      COEStatus,
      showHideConfirmCOE,
      loadInitialData,
      denyCOEModal,
      InstitutionRoutesConst,
      confirmCOEModal,
    };
  },
};
</script>
