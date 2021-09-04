<template>
  <div class="p-m-4">
    <h5 class="text-muted">
      <a @click="goBack()">
        <v-icon left> mdi-arrow-left </v-icon> Back to Programs</a
      >
    </h5>
    <p class="font-weight-bold h2 color-blue">
      View Financial Aid Application
    </p>
    <v-btn
      color="primary"
      class="float-right ml-2"
      @click="toggle"
      v-if="COEStatus.required === initialData.applicationCOEStatus"
    >
      <v-icon size="25" class="pr-2"> mdi-format-list-bulleted</v-icon
      >Application Actions</v-btn
    >
    <Menu
      class="mt-n15 coe-menu-option"
      ref="menu"
      :model="items"
      :popup="true"
    />
    <v-container>
      <div
        class="bg-white coe-info-border mt-10 mb-4"
        v-if="
          COEStatus.submitted === initialData.applicationCOEStatus ||
            COEStatus.completed === initialData.applicationCOEStatus
        "
      >
        <p>
          <v-icon color="green darken-2">mdi-information </v-icon
          ><span class="pl-2 font-weight-bold"
            >This application has been confirmed</span
          >
        </p>
        <span class="mt-4">
          This applicant has been confirmed as enrolled at your institution.
          Funding will be disbursed on the study start date shown below. If the
          applicant will be recieving after the study start date listed below
          funds will be disbursed 48 hours after enrollment as been confirmed.
        </span>
      </div>
      <div
        class="bg-white coe-ocw-info-border mt-10 mb-4"
        v-if="
          COEStatus.required === initialData.applicationCOEStatus &&
            !initialData.applicationWithinCOEWindow
        "
      >
        <p>
          <v-icon color="primary">mdi-information </v-icon
          ><span class="pl-2 font-weight-bold color-blue"
            >This application is currently outside the 21 day confirmation
            window</span
          >
        </p>
        <span class="mt-4"
          >You will be able to confirm this application when you are within 21
          days of the study start date. You can edit this application if needed
          from the Application Actions”.
        </span>
      </div>
      <div
        class="bg-white coe-icw-info-border  mt-10 mb-4"
        v-if="
          COEStatus.required === initialData.applicationCOEStatus &&
            initialData.applicationWithinCOEWindow
        "
      >
        <p>
          <v-icon color="primary">mdi-information </v-icon
          ><span class="pl-2 font-weight-bold"
            >This application requires confirmation of enrollment so funding can
            be dispersed</span
          >
        </p>
        <span class="mt-4"
          >Confirm the program and intake information below by confirming,
          declining or editing this application from the "Application Actions".
        </span>
      </div>
      <formio formName="confirmsstudentenrollment" :data="initialData"></formio>
    </v-container>
    <ConfirmCOE
      :showModal="showModal"
      :applicationId="initialData.applicationId"
      :locationId="initialData.applicationLocationId"
      @showHideConfirmCOE="showHideConfirmCOE"
      @reloadData="loadInitialData"
    />
    <ConfirmCOEEditModal ref="editCOEModal" />
    <ConfirmCOEDenyModal ref="denyCOEModal" @submitData="submitCOEDeny" />
  </div>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, watch } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import formio from "@/components/generic/formio.vue";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import Menu from "primevue/menu";
import { COEStatus, ApplicationDetailsForCOEDTO } from "@/types";
import ConfirmCOE from "@/components/institutions/modals/ConfirmCOEModal.vue";
import ConfirmCOEEditModal from "@/components/institutions/modals/ConfirmCOEEditModal.vue";
import ConfirmCOEDenyModal from "@/components/institutions/modals/ConfirmCOEDenyModal.vue";
import { useToastMessage, ModalDialog } from "@/composables";
import { DenyConfirmationOfEnrollment } from "@/types";

/**
 * added MenuType interface for prime vue component menu,
 *  remove it when vuetify componnt is used
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
    formio,
    Menu,
    ConfirmCOE,
    ConfirmCOEEditModal,
    ConfirmCOEDenyModal,
  },
  props: {
    applicationId: {
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
    const denyCOEModal = ref({} as ModalDialog<boolean>);
    const showHideConfirmCOE = () => {
      showModal.value = !showModal.value;
    };

    const goBack = () => {
      router.push({
        name: InstitutionRoutesConst.COE_SUMMARY,
      });
    };

    const loadInitialData = async () => {
      initialData.value = await ConfirmationOfEnrollmentService.shared.getApplicationForCOE(
        props.applicationId,
        props.locationId,
      );
    };

    const editProgramInformation = async () => {
      if (await editCOEModal.value.showModal()) {
        try {
          await ConfirmationOfEnrollmentService.shared.rollbackCOE(
            props.locationId,
            props.applicationId,
          );
          toast.success(
            "Edit Program Information",
            "Program Information Request is now available to be edited.",
          );
          router.push({
            name: InstitutionRoutesConst.COE_SUMMARY,
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
      console.log(submissionData, "############");
      try {
        await ConfirmationOfEnrollmentService.shared.denyConfirmationOfEnrollment(
          props.locationId,
          props.applicationId,
          submissionData,
        );
        toast.success("COE is Denied", "Application Status Has Been Updated.");
        router.push({
          name: InstitutionRoutesConst.COE_SUMMARY,
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
        { separator: true },
        {
          label: "Edit Program Information",
          class: "font-weight-bold",
          command: editProgramInformation,
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

    const toggle = (event: any) => {
      menu?.value?.toggle(event);
    };
    return {
      toggle,
      goBack,
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
    };
  },
};
</script>
