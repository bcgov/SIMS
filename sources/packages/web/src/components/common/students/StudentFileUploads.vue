<template>
  <body-header-container>
    <template #header>
      <body-header
        title="File Uploads"
        :recordsCount="studentFileUploads?.length"
      >
        <template #actions>
          <slot name="uploadBtn"></slot>
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
    <slot></slot>
  </body-header-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  LayoutTemplates,
  Role,
} from "@/types";
import { StudentService } from "@/services/StudentService";
import { useFormatters, useFileUtils } from "@/composables";
import { StudentUploadFileAPIOutDTO } from "@/services/http/dto/Student.dto";

export default defineComponent({
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    canDownloadFiles: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const studentFileUploads = ref([] as StudentUploadFileAPIOutDTO[]);
    const { dateOnlyLongString, emptyStringFiller } = useFormatters();
    const fileUtils = useFileUtils();

    const loadStudentFileUploads = async () => {
      studentFileUploads.value =
        await StudentService.shared.getStudentFileDetails(props.studentId);
    };

    onMounted(loadStudentFileUploads);

    return {
      fileUtils,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      dateOnlyLongString,
      emptyStringFiller,
      LayoutTemplates,
      Role,
      studentFileUploads,
      loadStudentFileUploads,
    };
  },
});
</script>
