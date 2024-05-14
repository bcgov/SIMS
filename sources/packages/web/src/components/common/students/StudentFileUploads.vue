<template>
  <body-header-container>
    <template #header>
      <body-header
        title="File Uploads"
        :recordsCount="studentFileUploads?.length"
      >
        <template #actions v-if="canUploadFiles">
          <check-permission-role :role="Role.StudentUploadFile">
            <template #="{ notAllowed }">
              <v-btn
                color="primary"
                data-cy="uploadFileButton"
                @click="uploadFile"
                prepend-icon="fa:fa fa-plus-circle"
                class="float-right"
                :disabled="notAllowed"
                >Upload file</v-btn
              >
            </template>
          </check-permission-role>
        </template>
      </body-header>
    </template>
    <content-group>
      <toggle-content :toggled="!studentFileUploads.length">
        <DataTable
          :value="studentFileUploads"
          :paginator="true"
          :totalRecords="studentFileUploads?.length"
          :rows="DEFAULT_PAGE_LIMIT"
          :rowsPerPageOptions="PAGINATION_LIST"
        >
          <Column
            field="groupName"
            header="Document Purpose"
            :sortable="true"
          ></Column>
          <Column field="metadata" header="Application #">
            <template #body="slotProps">{{
              emptyStringFiller(slotProps.data.metadata?.applicationNumber)
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
                v-if="canDownloadFiles"
                class="file-label"
                @click="fileUtils.downloadStudentDocument(slotProps.data)"
              >
                <span class="mr-4">
                  <v-icon icon="fa:far fa-file-alt" size="20"></v-icon
                ></span>
                <span>{{ slotProps.data.fileName }}</span>
              </div>
              <div v-else>
                <span class="mr-4">
                  <v-icon icon="fa:far fa-file-alt" size="20"></v-icon
                ></span>
                <span>{{ slotProps.data.fileName }}</span>
              </div>
            </template></Column
          >
        </DataTable>
      </toggle-content>
    </content-group>
    <formio-modal-dialog
      ref="fileUploadModal"
      title="Upload file"
      :formData="initialData"
      formName="uploadStudentDocumentsAEST"
    >
      <template #actions="{ cancel, submit }">
        <v-row class="m-0 p-0">
          <v-btn color="primary" variant="outlined" @click="cancel"
            >Cancel</v-btn
          >
          <check-permission-role :role="Role.StudentUploadFile">
            <template #="{ notAllowed }">
              <v-btn
                class="float-right"
                @click="submit"
                color="primary"
                variant="elevated"
                :disabled="notAllowed"
                >Upload now</v-btn
              >
            </template>
          </check-permission-role>
        </v-row>
      </template>
    </formio-modal-dialog>
  </body-header-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { DEFAULT_PAGE_LIMIT, FormIOForm, PAGINATION_LIST, Role } from "@/types";
import { StudentService } from "@/services/StudentService";
import {
  useFormatters,
  useFileUtils,
  ModalDialog,
  useSnackBar,
  useFormioUtils,
} from "@/composables";
import FormioModalDialog from "@/components/generic/FormioModalDialog.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { StudentUploadFileAPIOutDTO } from "@/services/http/dto/Student.dto";

export default defineComponent({
  emits: ["uploadFile"],
  components: {
    CheckPermissionRole,
    FormioModalDialog,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    canUploadFiles: {
      type: Boolean,
      required: false,
      default: false,
    },
    canDownloadFiles: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, context) {
    const studentFileUploads = ref([] as StudentUploadFileAPIOutDTO[]);
    const fileUploadModal = ref({} as ModalDialog<FormIOForm | boolean>);
    const { dateOnlyLongString, emptyStringFiller } = useFormatters();
    const fileUtils = useFileUtils();
    const initialData = ref({ studentId: props.studentId });
    const formioUtils = useFormioUtils();
    const snackBar = useSnackBar();

    const loadStudentFileUploads = async () => {
      studentFileUploads.value =
        await StudentService.shared.getStudentFileDetails(props.studentId);
    };

    const uploadFile = async () => {
      const modalResult = await fileUploadModal.value.showModal();
      if (!modalResult) {
        return;
      }

      try {
        const associatedFiles = formioUtils.getAssociatedFiles(modalResult);
        context.emit("uploadFile", associatedFiles, () =>
          loadStudentFileUploads(),
        );
      } catch {
        snackBar.error("An unexpected error happened.");
      }
    };

    onMounted(loadStudentFileUploads);

    return {
      fileUtils,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      dateOnlyLongString,
      emptyStringFiller,
      uploadFile,
      Role,
      studentFileUploads,
      fileUploadModal,
      initialData,
    };
  },
});
</script>
