<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <content-group>
        <body-header
          title="File Uploads"
          :recordsCount="studentFileUploads?.length"
          class="m-1"
        >
          <template #actions>
            <v-btn
              color="primary"
              data-cy="uploadFileButton"
              @click="uploadFile"
              ><font-awesome-icon
                :icon="['fas', 'plus-circle']"
                class="mr-2"
              />Upload file</v-btn
            >
          </template>
        </body-header>
        <DataTable
          :value="studentFileUploads"
          :paginator="true"
          :rows="DEFAULT_PAGE_LIMIT"
          :rowsPerPageOptions="PAGINATION_LIST"
        >
          <template #empty>
            <p class="text-center font-weight-bold">No records found.</p>
          </template>
          <Column
            field="groupName"
            header="Document Purpose"
            sortable="true"
          ></Column>
          <Column field="metadata" header="Application #">
            <template #body="slotProps">{{
              slotProps.data.metadata?.applicationNumber
                ? slotProps.data.metadata.applicationNumber
                : "-"
            }}</template></Column
          >
          <Column field="updatedAt" header="Date Submitted"
            ><template #body="slotProps">{{
              dateOnlyLongString(slotProps.data.updatedAt)
            }}</template></Column
          >
          <Column field="updatedAt" header="File">
            <template #body="slotProps">
              <div
                class="file-label"
                @click="fileUtils.downloadDocument(slotProps.data)"
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
    ref="fileUploadModal"
    title="Upload file"
    :formData="initialData"
    formName="uploadStudentDocumentsAEST"
  >
    <template #actions="{ cancel, submit }">
      <v-btn color="primary" variant="outlined" @click="cancel">Cancel</v-btn>
      <v-btn class="float-right primary-btn-background" @click="submit"
        >Upload now</v-btn
      >
    </template>
  </formio-modal-dialog>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import {
  AESTFileUploadToStudentAPIInDTO,
  DEFAULT_PAGE_LIMIT,
  FormIOForm,
  PAGINATION_LIST,
  StudentUploadFileAPIOutDTO,
} from "@/types";
import { StudentService } from "@/services/StudentService";
import {
  useFormatters,
  useFileUtils,
  ModalDialog,
  useFormioUtils,
  useToastMessage,
} from "@/composables";
import FormioModalDialog from "@/components/generic/FormioModalDialog.vue";

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
    const studentFileUploads = ref([] as StudentUploadFileAPIOutDTO[]);
    const fileUploadModal = ref({} as ModalDialog<FormIOForm | boolean>);
    const { dateOnlyLongString } = useFormatters();
    const toast = useToastMessage();
    const fileUtils = useFileUtils();
    const formioUtils = useFormioUtils();
    const initialData = ref({ studentId: props.studentId });
    const loadStudentFileUploads = async () => {
      studentFileUploads.value =
        await StudentService.shared.getAESTStudentFiles(props.studentId);
    };

    onMounted(async () => {
      await loadStudentFileUploads();
    });

    const uploadFile = async () => {
      const modalResult = await fileUploadModal.value.showModal();
      if (!modalResult) {
        return;
      }

      try {
        const associatedFiles = formioUtils.getAssociatedFiles(modalResult);
        const payload: AESTFileUploadToStudentAPIInDTO = {
          associatedFiles,
        };
        await StudentService.shared.saveMinistryUploadedFilesToStudent(
          props.studentId,
          payload,
        );
        toast.success(
          "Documents submitted",
          "The documents were submitted and a notification was sent to the student.",
        );
      } catch {
        toast.error("Unexpected error", "An unexpected error happened.");
      }
    };

    return {
      studentFileUploads,
      fileUtils,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      dateOnlyLongString,
      uploadFile,
      fileUploadModal,
      initialData,
    };
  },
};
</script>
