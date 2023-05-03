<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header
          title="Social Insurance Number"
          subTitle="The first row will always be the student's current active SIN."
          :recordsCount="studentSINValidations?.length"
        >
          <template #actions>
            <check-permission-role :role="Role.StudentAddNewSIN">
              <template #="{ notAllowed }">
                <v-btn
                  class="float-right"
                  color="primary"
                  data-cy="addNewSINButton"
                  :disabled="processingNewSIN || notAllowed"
                  @click="addNewSIN"
                  prepend-icon="fa:fa fa-plus-circle"
                  >Add new SIN</v-btn
                >
              </template>
            </check-permission-role>
          </template>
        </body-header>
      </template>
      <content-group>
        <toggle-content :toggled="!studentSINValidations?.length">
          <DataTable
            :value="studentSINValidations"
            :paginator="true"
            :rows="DEFAULT_PAGE_LIMIT"
            :rowsPerPageOptions="PAGINATION_LIST"
            breakpoint="1380px"
          >
            <Column field="createdAtFormatted" header="Date created" />
            <Column field="sinFormatted" header="SIN" bodyClass="text-nowrap" />
            <Column field="isValidSINFormatted" header="SIN validated" />
            <Column field="sinStatus" header="Response code"></Column>
            <Column field="validSINCheckFormatted" header="SIN accepted" />
            <Column field="validFirstNameCheckFormatted" header="First name" />
            <Column field="validLastNameCheckFormatted" header="Last name" />
            <Column
              field="validBirthdateCheckFormatted"
              header="Date of birth"
            />
            <Column field="validGenderCheckFormatted" header="Gender" />
            <Column field="sinExpiryDateFormatted" header="Expiry date" />
            <Column header="Action">
              <template #body="slotProps">
                <check-permission-role :role="Role.StudentAddSINExpiry">
                  <template #="{ notAllowed }">
                    <v-btn
                      color="primary"
                      :disabled="
                        !slotProps.data.temporarySIN ||
                        !!slotProps.data.sinExpiryDate ||
                        processingEditExpiryDate ||
                        notAllowed
                      "
                      @click="addExpiryDate(slotProps.data.id)"
                      >Add expiry date</v-btn
                    >
                  </template>
                </check-permission-role>
              </template></Column
            >
          </DataTable>
        </toggle-content>
      </content-group>
      <add-new-s-i-n
        ref="addNewSINModal"
        :allowedRole="Role.StudentAddNewSIN"
      />
      <add-expiry-date
        ref="addExpiryDateModal"
        :allowedRole="Role.StudentAddSINExpiry"
      />
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { ref, watch, defineComponent } from "vue";
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  SINValidations,
  LayoutTemplates,
  Role,
} from "@/types";
import { StudentService } from "@/services/StudentService";
import { useFileUtils, ModalDialog, useSnackBar } from "@/composables";
import {
  CreateSINValidationAPIInDTO,
  UpdateSINValidationAPIInDTO,
} from "@/services/http/dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import AddNewSIN from "@/components/common/sin/AddNewSIN.vue";
import AddExpiryDate from "@/components/common/sin/AddExpiryDate.vue";

export default defineComponent({
  components: {
    CheckPermissionRole,
    AddNewSIN,
    AddExpiryDate,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const showModal = ref(false);
    const studentSINValidations = ref([] as SINValidations[]);
    const addNewSINModal = ref(
      {} as ModalDialog<CreateSINValidationAPIInDTO | boolean>,
    );
    const addExpiryDateModal = ref(
      {} as ModalDialog<UpdateSINValidationAPIInDTO | boolean>,
    );
    const snackBar = useSnackBar();
    const fileUtils = useFileUtils();
    const initialData = ref({ studentId: props.studentId });
    const processingNewSIN = ref(false);
    const processingEditExpiryDate = ref(false);

    const loadSINValidations = async () => {
      studentSINValidations.value =
        await StudentService.shared.getStudentSINValidations(props.studentId);
    };

    watch(() => props.studentId, loadSINValidations, { immediate: true });

    const addNewSIN = async () => {
      const addNewSINData = await addNewSINModal.value.showModal();
      if (addNewSINData)
        try {
          processingNewSIN.value = true;
          await StudentService.shared.createStudentSINValidation(
            props.studentId,
            addNewSINData as CreateSINValidationAPIInDTO,
          );
          snackBar.success(
            "New SIN record created and associated to the student.",
          );
          await loadSINValidations();
        } catch {
          snackBar.error("Unexpected error while creating a new SIN record.");
        } finally {
          processingNewSIN.value = false;
        }
    };

    const addExpiryDate = async (sinValidationId: number) => {
      const addExpiryDateData = await addExpiryDateModal.value.showModal();
      if (addExpiryDateData) {
        try {
          processingEditExpiryDate.value = true;
          await StudentService.shared.updateStudentSINValidation(
            props.studentId,
            sinValidationId,
            addExpiryDateData as UpdateSINValidationAPIInDTO,
          );
          snackBar.success("Temporary SIN expiry date updated.");
          await loadSINValidations();
        } catch {
          snackBar.error("Unexpected error while updating the expiry date.");
        } finally {
          processingEditExpiryDate.value = false;
        }
      }
    };

    return {
      studentSINValidations,
      fileUtils,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      addNewSIN,
      addNewSINModal,
      addExpiryDateModal,
      initialData,
      addExpiryDate,
      processingNewSIN,
      processingEditExpiryDate,
      LayoutTemplates,
      Role,
      showModal,
    };
  },
});
</script>
