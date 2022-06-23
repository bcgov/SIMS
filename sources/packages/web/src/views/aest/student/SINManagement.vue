<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <content-group>
        <body-header
          title="Social Insurance Number"
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
        <DataTable
          :value="studentSINValidations"
          :paginator="true"
          :rows="DEFAULT_PAGE_LIMIT"
          :rowsPerPageOptions="PAGINATION_LIST"
        >
          <Column field="createdAt" header="Date created"
            ><template #body="slotProps">{{
              dateOnlyLongString(slotProps.data.createdAt)
            }}</template></Column
          >
          <Column field="sin" header="SIN"
            ><template #body="slotProps">{{
              sinDisplayFormat(slotProps.data.sin)
            }}</template></Column
          >
          <Column field="isValidSIN" header="SIN validated"
            ><template #body="slotProps">{{
              booleanToYesNo(slotProps.data.isValidSIN)
            }}</template></Column
          >
          <Column field="sinStatus" header="Response code"></Column>
          <Column field="validSINCheck" header="SIN accepted"
            ><template #body="slotProps">{{
              yesNoFlagDescription(slotProps.data.validSINCheck)
            }}</template></Column
          >
          <Column field="validFirstNameCheck" header="First name"
            ><template #body="slotProps">{{
              yesNoFlagDescription(slotProps.data.validFirstNameCheck)
            }}</template></Column
          >
          <Column field="validLastNameCheck" header="Last name"
            ><template #body="slotProps">{{
              yesNoFlagDescription(slotProps.data.validLastNameCheck)
            }}</template></Column
          >
          <Column field="validBirthdateCheck" header="Date of birth"
            ><template #body="slotProps">{{
              yesNoFlagDescription(slotProps.data.validBirthdateCheck)
            }}</template></Column
          >
          <Column field="validGenderCheck" header="Gender"
            ><template #body="slotProps">{{
              yesNoFlagDescription(slotProps.data.validGenderCheck)
            }}</template></Column
          >

          <Column header="File">
            <template #body="slotProps">
              <div
                class="file-label"
                @click="fileUtils.downloadStudentDocument(slotProps.data)"
              >
                <span class="mr-4">
                  <font-awesome-icon :icon="['far', 'file-alt']"
                /></span>
                <span>{{ slotProps.data.fileName }}</span>
              </div>
            </template></Column
          >
        </DataTable>
      </content-group>
    </div>
  </v-card>
  <formio-modal-dialog
    max-width="730"
    ref="addNewSINModal"
    title="Add a new SIN"
    :formData="initialData"
    formName="aestAddNewSIN"
  >
    <template #actions="{ cancel, submit }">
      <v-btn color="primary" variant="outlined" @click="cancel">Cancel</v-btn>
      <v-btn class="float-right primary-btn-background" @click="submit"
        >Add SIN now</v-btn
      >
    </template>
  </formio-modal-dialog>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { DEFAULT_PAGE_LIMIT, FormIOForm, PAGINATION_LIST } from "@/types";
import { StudentService } from "@/services/StudentService";
import {
  useFormatters,
  useFileUtils,
  ModalDialog,
  useFormioUtils,
  useToastMessage,
} from "@/composables";
import FormioModalDialog from "@/components/generic/FormioModalDialog.vue";
import {
  AESTFileUploadToStudentAPIInDTO,
  SINValidationsAPIOutDTO,
} from "@/services/http/dto/Student.dto";

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
    const {
      dateOnlyLongString,
      yesNoFlagDescription,
      booleanToYesNo,
      sinDisplayFormat,
    } = useFormatters();
    const toast = useToastMessage();
    const fileUtils = useFileUtils();
    const formioUtils = useFormioUtils();
    const initialData = ref({ studentId: props.studentId });
    const loadStudentFileUploads = async () => {
      studentSINValidations.value =
        await StudentService.shared.getStudentSINValidations(props.studentId);
    };

    onMounted(async () => {
      await loadStudentFileUploads();
    });

    const addNewSIN = async () => {
      const modalResult = await addNewSINModal.value.showModal();
      if (!modalResult) {
        return;
      }

      try {
        const associatedFiles = formioUtils.getAssociatedFiles(modalResult);
        const payload: AESTFileUploadToStudentAPIInDTO = {
          associatedFiles,
        };
        await StudentService.shared.saveAESTUploadedFilesToStudent(
          props.studentId,
          payload,
        );
        toast.success(
          "Documents submitted",
          "The documents were submitted and a notification was sent to the student.",
        );
        await loadStudentFileUploads();
      } catch {
        toast.error("Unexpected error", "An unexpected error happened.");
      }
    };

    return {
      studentSINValidations,
      fileUtils,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      dateOnlyLongString,
      yesNoFlagDescription,
      booleanToYesNo,
      sinDisplayFormat,
      addNewSIN,
      addNewSINModal,
      initialData,
    };
  },
};
</script>
