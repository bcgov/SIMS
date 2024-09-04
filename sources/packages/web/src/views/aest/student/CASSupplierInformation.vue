<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header title="CAS Supplier Information">
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
        <toggle-content :toggled="!casSuppliers?.length">
          <v-data-table
            :headers="CASSupplierInformationHeaders"
            :items="casSuppliers"
            :items-per-page="DEFAULT_PAGE_LIMIT"
          >
            <template #[`item.dateCreated`]="{ item }">
              {{ dateOnlyLongString(item.dateCreated) }}
            </template>
            <template #[`item.supplierNumber`]="{ item }">
              {{ item.supplierNumber }}
            </template>
            <template #[`item.supplierProtected`]="{ item }">
              {{ item.supplierProtected ? "Yes" : "No" }}
            </template>
            <template #[`item.supplierStatus`]="{ item }">
              <status-chip-supplier :status="item.supplierStatus" />
            </template>
            <template #[`item.isValid`]="{ item }">
              {{ item.isValid ? "Yes" : "No" }}
            </template>
            <template #[`item.supplierSiteCode`]="{ item }">
              {{ item.supplierSiteCode }}
            </template>
            <template #[`item.addressLine1`]="{ item }">
              {{ item.addressLine1 || "-" }}
            </template>
            <template #[`item.siteStatus`]="{ item }">
              {{ item.siteStatus }}
            </template>
            <template #[`item.siteProtected`]="{ item }">
              {{ item.siteProtected || "-" }}
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
import { ref, watch, defineComponent } from "vue";
import {
  DEFAULT_PAGE_LIMIT,
  LayoutTemplates,
  Role,
  CASSupplierInformationHeaders,
} from "@/types";
import {
  useFileUtils,
  ModalDialog,
  useSnackBar,
  useFormatters,
} from "@/composables";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import EditCASSupplierInfoModal from "@/components/aest/students/EditCASSupplierInfoModal.vue";
import { CASSupplierInformation } from "@/types/contracts/student/CASSupplierInformation";
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
    const { dateOnlyLongString } = useFormatters();
    const showModal = ref(false);
    const casSuppliers = ref([] as CASSupplierInfoAPIOutDTO[]);
    const addCASSupplierModal = ref(
      {} as ModalDialog<AddCASSupplierAPIInDTO | boolean>,
    );
    const snackBar = useSnackBar();
    const fileUtils = useFileUtils();
    const initialData = ref({ studentId: props.studentId });
    const processingAddCASSupplierInfo = ref(false);
    const casSupplierResults = ref([] as CASSupplierInformation[]);
    const loadCASSuppliers = async () => {
      casSuppliers.value =
        await CASSupplierService.shared.getSupplierInfoByStudentId(
          props.studentId,
        );
    };
    watch(() => props.studentId, loadCASSuppliers, { immediate: true });

    const addCASSupplierInfo = async () => {
      const addCASSupplierData = await addCASSupplierModal.value.showModal();
      if (addCASSupplierData) {
        try {
          await CASSupplierService.shared.addCASSupplier(
            props.studentId,
            addCASSupplierData as AddCASSupplierAPIInDTO,
          );
          snackBar.success("CAS supplier information has been updated.");
          await loadCASSuppliers();
        } catch {
          snackBar.error(
            "Unexpected error while updating CAS supplier information.",
          );
        }
      }
    };

    return {
      casSuppliers,
      fileUtils,
      DEFAULT_PAGE_LIMIT,
      initialData,
      processingEditExpiryDate: processingAddCASSupplierInfo,
      LayoutTemplates,
      Role,
      showModal,
      CASSupplierInformationHeaders,
      casSupplierResults,
      addCASSupplierInfo,
      dateOnlyLongString,
      addCASSupplierModal,
    };
  },
});
</script>
