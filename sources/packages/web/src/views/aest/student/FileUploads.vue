<template>
  <full-page-container
    :layout-template="LayoutTemplates.CenteredCard"
    :fullWidth="true"
  >
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
          prepend-icon="fa:fa fa-plus-circle"
          class="float-right"
          >Upload file</v-btn
        >
      </template>
    </body-header>
    <content-group>
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
              @click="fileUtils.downloadStudentDocument(slotProps.data)"
            >
              <span class="mr-4">
                <v-icon icon="fa:far fa-file-alt" size="20"></v-icon
              ></span>
              <span>{{ slotProps.data.fileName }}</span>
            </div>
          </template></Column
        >
      </DataTable>
    </content-group>
    <formio-modal-dialog
      max-width="730"
      ref="fileUploadModal"
      title="Upload file"
      :formData="initialData"
      formName="uploadStudentDocumentsAEST"
    >
      <template #actions="{ cancel, submit }">
        <v-btn color="primary" variant="outlined" @click="cancel">Cancel</v-btn>
        <v-btn class="float-right" @click="submit" color="primary"
          >Upload now</v-btn
        >
      </template>
    </formio-modal-dialog>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import {
  DEFAULT_PAGE_LIMIT,
  FormIOForm,
  PAGINATION_LIST,
  LayoutTemplates,
} from "@/types";
import { StudentService } from "@/services/StudentService";
import {
  useFormatters,
  useFileUtils,
  ModalDialog,
  useFormioUtils,
  useSnackBar,
} from "@/composables";
import FormioModalDialog from "@/components/generic/FormioModalDialog.vue";
import {
  AESTFileUploadToStudentAPIInDTO,
  StudentUploadFileAPIOutDTO,
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
    const studentFileUploads = ref([] as StudentUploadFileAPIOutDTO[]);
    const fileUploadModal = ref({} as ModalDialog<FormIOForm | boolean>);
    const { dateOnlyLongString } = useFormatters();
    const snackBar = useSnackBar();
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
        await StudentService.shared.saveAESTUploadedFilesToStudent(
          props.studentId,
          payload,
        );
        snackBar.success(
          "The documents were submitted and a notification was sent to the student.",
        );
        await loadStudentFileUploads();
      } catch {
        snackBar.error("An unexpected error happened.");
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
      LayoutTemplates,
    };
  },
};
</script>
