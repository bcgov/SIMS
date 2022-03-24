<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <content-group>
        <body-header
          title="File Uploads"
          :recordsCount="studentFileUploads?.length"
          class="m-1"
        >
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
            <template #body="slotProps"
              ><span v-if="slotProps.data.metadata">{{
                `${slotProps.data.metadata.applicationNumber}`
              }}</span
              ><span v-else>----</span></template
            ></Column
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
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  StudentUploadFileDTO,
} from "@/types";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import { StudentService } from "@/services/StudentService";
import { useFormatters, useFileUtils } from "@/composables";
import BodyHeader from "@/components/generic/BodyHeader.vue";

export default {
  components: {
    ContentGroup,
    BodyHeader,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const studentFileUploads = ref([] as StudentUploadFileDTO[]);
    const { dateOnlyLongString } = useFormatters();
    const fileUtils = useFileUtils();
    const loadStudentFileUploads = async () => {
      studentFileUploads.value = await StudentService.shared.getAESTStudentFiles(
        props.studentId,
      );
    };
    onMounted(async () => {
      await loadStudentFileUploads();
    });
    return {
      studentFileUploads,
      fileUtils,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      dateOnlyLongString,
    };
  },
};
</script>
