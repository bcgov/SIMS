<template>
  <body-header-container>
    <template #header>
      <body-header
        title="File Uploads"
        :records-count="studentFileUploads?.length"
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
      <toggle-content
        :toggled="!studentFileUploads.length"
        message="No file uploads found."
      >
        <v-data-table
          :headers="studentFileUploadHeaders"
          :items="studentFileUploads"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
        >
          <template #loading>
            <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
          </template>
          <template #[`item.groupName`]="{ item }">
            {{ item.groupName }}
          </template>
          <template v-if="canViewUploadedBy" #[`item.uploadedBy`]="{ item }">
            {{ item.uploadedBy }}
          </template>
          <template #[`item.applicationNumber`]="{ item }">
            {{ emptyStringFiller(item.metadata?.applicationNumber) }}
          </template>
          <template #[`item.createdAt`]="{ item }">
            {{ getISODateHourMinuteString(item.createdAt) }}
          </template>
          <template #[`item.fileName`]="{ item }">
            <div v-if="canDownloadFiles">
              <div
                class="file-label"
                @click="fileUtils.downloadStudentDocument(item)"
              >
                <span class="mr-4">
                  <v-icon icon="fa:far fa-file-alt" size="20"></v-icon
                ></span>
                <span>{{ item.fileName }}</span>
              </div>
            </div>
            <div v-else>
              <span class="mr-4">
                <v-icon icon="fa:far fa-file-alt" size="20"></v-icon
              ></span>
              <span>{{ item.fileName }}</span>
            </div>
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
    <formio-modal-dialog
      ref="fileUploadModal"
      title="Upload file"
      :form-data="initialData"
      form-name="uploadStudentDocumentsAEST"
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
import { onMounted, ref, defineComponent, computed } from "vue";
import { useDisplay } from "vuetify";

import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  FormIOForm,
  Role,
  StudentFileUploadsHeaders,
} from "@/types";
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
import { StudentFileDetailsAPIOutDTO } from "@/services/http/dto/Student.dto";

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
    canViewUploadedBy: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, context) {
    const studentFileUploads = ref([] as StudentFileDetailsAPIOutDTO[]);
    const fileUploadModal = ref({} as ModalDialog<FormIOForm | boolean>);
    const { getISODateHourMinuteString, emptyStringFiller } = useFormatters();
    const fileUtils = useFileUtils();
    const initialData = ref({ studentId: props.studentId });
    const formioUtils = useFormioUtils();
    const snackBar = useSnackBar();
    const { mobile: isMobile } = useDisplay();

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

    const studentFileUploadHeaders = computed(() => {
      return props.canViewUploadedBy
        ? StudentFileUploadsHeaders
        : StudentFileUploadsHeaders.filter(
            (header) => header.key !== "uploadedBy",
          );
    });

    onMounted(loadStudentFileUploads);

    return {
      fileUtils,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      getISODateHourMinuteString,
      emptyStringFiller,
      uploadFile,
      Role,
      studentFileUploads,
      fileUploadModal,
      initialData,
      studentFileUploadHeaders,
      isMobile,
    };
  },
});
</script>
