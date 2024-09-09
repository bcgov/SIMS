<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header
          title="CAS Supplier Information"
          subTitle="The top row in the table below is the most current CAS information for the student."
        >
          <template #actions>
            <check-permission-role :role="Role.AESTEditCASSupplierInfo">
              <template #="{ notAllowed }">
                <v-btn
                  class="float-right"
                  color="primary"
                  data-cy="editCASSupplierInfoButton"
                  :disabled="notAllowed"
                  @click="addCASSupplierInfo"
                  prepend-icon="fa:fa fa-plus-circle"
                  >Edit info</v-btn
                >
              </template>
            </check-permission-role>
          </template>
        </body-header>
      </template>
      <content-group>
        <toggle-content :toggled="!casSupplierInfo?.items?.length">
          <v-data-table
            :headers="CASSupplierInformationHeaders"
            :items="casSupplierInfo.items"
            :items-per-page="DEFAULT_PAGE_LIMIT"
          >
            <template #[`item.dateCreated`]="{ item }">
              {{ dateOnlyLongString(item.dateCreated) }}
            </template>
            <template #[`item.supplierNumber`]="{ item }">
              {{ item.supplierNumber }}
            </template>
            <template #[`item.supplierProtected`]="{ item }">
              {{ booleanToYesNo(item.supplierProtected) }}
            </template>
            <template #[`item.supplierStatus`]="{ item }">
              <status-chip-supplier :status="item.supplierStatus" />
            </template>
            <template #[`item.isValid`]="{ item }">
              {{ booleanToYesNo(item.isValid) }}
            </template>
            <template #[`item.supplierSiteCode`]="{ item }">
              {{ item.supplierSiteCode }}
            </template>
            <template #[`item.addressLine1`]="{ item }">
              {{ emptyStringFiller(item.addressLine1) }}
            </template>
            <template #[`item.siteStatus`]="{ item }">
              {{ emptyStringFiller(item.siteStatus) }}
            </template>
            <template #[`item.siteProtected`]="{ item }">
              {{ emptyStringFiller(item.siteProtected) }}
            </template>
          </v-data-table>
        </toggle-content>
      </content-group>
      <edit-c-a-s-supplier-info-modal
        ref="addCASSupplierModal"
        :allowedRole="Role.AESTEditCASSupplierInfo"
      />
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect } from "vue";
import {
  DEFAULT_PAGE_LIMIT,
  Role,
  CASSupplierInformationHeaders,
} from "@/types";
import { ModalDialog, useSnackBar, useFormatters } from "@/composables";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import EditCASSupplierInfoModal from "@/components/aest/students/EditCASSupplierInfoModal.vue";
import {
  AddCASSupplierAPIInDTO,
  CASSupplierInfoAPIOutDTO,
} from "@/services/http/dto";
import { CASSupplierService } from "@/services/CASSupplierService";
import StatusChipSupplier from "@/components/generic/StatusChipSupplier.vue";

export default defineComponent({
  components: {
    CheckPermissionRole,
    EditCASSupplierInfoModal,
    StatusChipSupplier,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { dateOnlyLongString, emptyStringFiller } = useFormatters();
    const { booleanToYesNo } = useFormatters();
    const showModal = ref(false);
    const casSupplierInfo = ref({} as CASSupplierInfoAPIOutDTO);
    const addCASSupplierModal = ref(
      {} as ModalDialog<AddCASSupplierAPIInDTO | boolean>,
    );
    const snackBar = useSnackBar();
    const loadCASSuppliers = async (studentId: number) => {
      try {
        casSupplierInfo.value =
          await CASSupplierService.shared.getSupplierInfoByStudentId(studentId);
      } catch {
        snackBar.error(
          "Unexpected error while loading CAS supplier information.",
        );
      }
    };
    watchEffect(() => loadCASSuppliers(props.studentId));

    const addCASSupplierInfo = async () => {
      const addCASSupplierData = await addCASSupplierModal.value.showModal();
      if (addCASSupplierData) {
        try {
          await CASSupplierService.shared.addCASSupplier(
            props.studentId,
            addCASSupplierData as AddCASSupplierAPIInDTO,
          );
          snackBar.success("CAS supplier information has been updated.");
          await loadCASSuppliers(props.studentId);
        } catch {
          snackBar.error(
            "Unexpected error while updating CAS supplier information.",
          );
          addCASSupplierModal.value.loading = false;
        }
      }
    };

    return {
      casSupplierInfo,
      DEFAULT_PAGE_LIMIT,
      Role,
      showModal,
      CASSupplierInformationHeaders,
      addCASSupplierInfo,
      dateOnlyLongString,
      addCASSupplierModal,
      booleanToYesNo,
      emptyStringFiller,
    };
  },
});
</script>
