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
      <Information :data="initialData" />
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
import {
  COEStatus,
  ApplicationDetailsForCOEDTO,
  DenyConfirmationOfEnrollment,
} from "@/types";
import ConfirmCOE from "@/components/institutions/confirmation-of-enrollment/modals/ConfirmCOEModal.vue";
import ConfirmCOEEditModal from "@/components/institutions/confirmation-of-enrollment/modals/ConfirmCOEEditModal.vue";
import ConfirmCOEDenyModal from "@/components/institutions/confirmation-of-enrollment/modals/ConfirmCOEDenyModal.vue";
import { useToastMessage, ModalDialog } from "@/composables";
import Information from "@/components/institutions/confirmation-of-enrollment/information.vue";

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
    Information,
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
    const denyCOEModal = ref({} as ModalDialog<void>);
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
