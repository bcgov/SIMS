<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <content-group>
        <body-header
          title="Social Insurance Number"
          subTitle="The first row will always be the student's current active SIN."
          :recordsCount="studentSINValidations?.length"
          class="m-1"
        >
          <template #actions>
            <v-btn color="primary" data-cy="addNewSINButton" @click="addNewSIN"
              ><font-awesome-icon
                :icon="['fas', 'plus-circle']"
                class="mr-2"
              />Add new SIN</v-btn
            >
          </template>
        </body-header>
        <toggle-content :toggled="!studentSINValidations?.length">
          <DataTable
            :value="studentSINValidations"
            :paginator="true"
            :rows="DEFAULT_PAGE_LIMIT"
            :rowsPerPageOptions="PAGINATION_LIST"
          >
            <Column
              field="createdAtFormatted"
              header="Date created"
              bodyClass="text-nowrap"
            />
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
            <Column header="Action">
              <template #body="slotProps">
                <v-btn
                  color="primary"
                  :disabled="!slotProps.data.temporarySIN"
                  @click="addExpireDate(slotProps.data.id)"
                  >Add expire date</v-btn
                >
              </template></Column
            >
          </DataTable>
        </toggle-content>
      </content-group>
    </div>
  </v-card>
  <formio-modal-dialog
    max-width="730"
    ref="addNewSINModal"
    title="Add a new SIN"
    formName="aestAddNewSIN"
  >
    <template #actions="{ cancel, submit }">
      <footer-buttons
        justify="end"
        primaryLabel="Add SIN now"
        @secondaryClick="cancel"
        @primaryClick="submit"
      />
    </template>
  </formio-modal-dialog>
  <formio-modal-dialog
    max-width="730"
    ref="addExpireDateModal"
    title="Add expire date"
    formName="aestAddSINExpiryDate"
  >
    <template #actions="{ cancel, submit }">
      <footer-buttons
        justify="end"
        primaryLabel="Add expire date now"
        @secondaryClick="cancel"
        @primaryClick="submit"
      />
    </template>
  </formio-modal-dialog>
</template>

<script lang="ts">
import { ref, watch } from "vue";
import { DEFAULT_PAGE_LIMIT, FormIOForm, PAGINATION_LIST } from "@/types";
import { StudentService } from "@/services/StudentService";
import { useFileUtils, ModalDialog, useToastMessage } from "@/composables";
import FormioModalDialog from "@/components/generic/FormioModalDialog.vue";
import { SINValidationsAPIOutDTO } from "@/services/http/dto/Student.dto";

export default {
  components: {
    FormioModalDialog,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const studentSINValidations = ref([] as SINValidationsAPIOutDTO[]);
    const addNewSINModal = ref({} as ModalDialog<FormIOForm | boolean>);
    const addExpireDateModal = ref({} as ModalDialog<FormIOForm | boolean>);
    const toast = useToastMessage();
    const fileUtils = useFileUtils();
    const initialData = ref({ studentId: props.studentId });

    const loadSINValidations = async () => {
      studentSINValidations.value =
        await StudentService.shared.getStudentSINValidations(props.studentId);
    };

    watch(props.studentId, loadSINValidations, { immediate: true });

    const addNewSIN = async () => {
      const modalResult = await addNewSINModal.value.showModal();
      if (!modalResult) {
        return;
      }
      // TODO: Update to create the new SIN.
      toast.success("addNewSIN", "addNewSIN");
    };

    const addExpireDate = async (sinValidationId: number) => {
      //const modalResult = await addExpireDateModal.value.showModal();
      await addExpireDateModal.value.showModal();
      // TODO: Update add the expiry date.
      toast.success("addExpireDate", "sinValidationId: " + sinValidationId);
    };

    return {
      studentSINValidations,
      fileUtils,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      addNewSIN,
      addNewSINModal,
      addExpireDateModal,
      initialData,
      addExpireDate,
    };
  },
};
</script>
