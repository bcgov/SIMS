<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <body-header
        title="Social Insurance Number"
        subTitle="The first row will always be the student's current active SIN."
        :recordsCount="studentSINValidations?.length"
        class="m-1"
      >
        <template #actions>
          <v-btn
            color="primary"
            data-cy="addNewSINButton"
            :disabled="processingNewSIN"
            @click="addNewSIN"
            ><font-awesome-icon
              :icon="['fas', 'plus-circle']"
              class="mr-2"
            />Add new SIN</v-btn
          >
        </template>
      </body-header>
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
                <v-btn
                  color="primary"
                  :disabled="
                    !slotProps.data.temporarySIN ||
                    !!slotProps.data.sinExpiryDate ||
                    processingEditExpiryDate
                  "
                  @click="addExpiryDate(slotProps.data.id)"
                  >Add expiry date</v-btn
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
    ref="addExpiryDateModal"
    title="Add expiry date"
    formName="aestAddSINExpiryDate"
  >
    <template #actions="{ cancel, submit }">
      <footer-buttons
        justify="end"
        primaryLabel="Add expiry date now"
        @secondaryClick="cancel"
        @primaryClick="submit"
      />
    </template>
  </formio-modal-dialog>
</template>

<script lang="ts">
import { ref, watch } from "vue";
import {
  DEFAULT_PAGE_LIMIT,
  FormIOForm,
  PAGINATION_LIST,
  SINValidations,
} from "@/types";
import { StudentService } from "@/services/StudentService";
import {
  useFileUtils,
  ModalDialog,
  useToastMessage,
  useFormatters,
} from "@/composables";
import FormioModalDialog from "@/components/generic/FormioModalDialog.vue";
import {
  CreateSINValidationAPIInDTO,
  UpdateSINValidationAPIInDTO,
} from "@/services/http/dto";
import useEmitter from "@/composables/useEmitter";

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
    const emitter = useEmitter();
    const studentSINValidations = ref([] as SINValidations[]);
    const addNewSINModal = ref(
      {} as ModalDialog<FormIOForm<CreateSINValidationAPIInDTO> | boolean>,
    );
    const addExpiryDateModal = ref(
      {} as ModalDialog<FormIOForm<UpdateSINValidationAPIInDTO> | boolean>,
    );
    const { getISODateOnlyString } = useFormatters();
    const toast = useToastMessage();
    const fileUtils = useFileUtils();
    const initialData = ref({ studentId: props.studentId });
    const processingNewSIN = ref(false);
    const processingEditExpiryDate = ref(false);

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

      try {
        processingNewSIN.value = true;
        const formioForm =
          modalResult as FormIOForm<CreateSINValidationAPIInDTO>;
        await StudentService.shared.createStudentSINValidation(
          props.studentId,
          formioForm.data,
        );
        emitter.emit(
          "snackBar",
          toast.success1(
            "New SIN record created and associated to the student.",
          ),
        );
        await loadSINValidations();
      } catch {
        emitter.emit(
          "snackBar",
          toast.error1("Unexpected error while creating a new SIN record."),
        );
      } finally {
        processingNewSIN.value = false;
      }
    };

    const addExpiryDate = async (sinValidationId: number) => {
      const modalResult = await addExpiryDateModal.value.showModal();
      if (!modalResult) {
        return;
      }

      try {
        processingEditExpiryDate.value = true;
        const formioForm =
          modalResult as FormIOForm<UpdateSINValidationAPIInDTO>;
        formioForm.data.expiryDate = getISODateOnlyString(
          formioForm.data.expiryDate,
        );
        await StudentService.shared.updateStudentSINValidation(
          props.studentId,
          sinValidationId,
          formioForm.data,
        );
        emitter.emit(
          "snackBar",
          toast.success1("Temporary SIN expiry date updated."),
        );
        await loadSINValidations();
      } catch {
        emitter.emit(
          "snackBar",
          toast.error1("Unexpected error while updating the expiry date."),
        );
      } finally {
        processingEditExpiryDate.value = false;
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
    };
  },
};
</script>
