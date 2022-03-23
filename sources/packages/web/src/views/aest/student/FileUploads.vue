<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <content-group>
        <v-row class="m-2">
          <v-col class="category-header-medium color-blue">File Uploads</v-col>
        </v-row>
        <DataTable
          :value="studentFileUploads"
          :paginator="true"
          :rows="DEFAULT_PAGE_LIMIT"
          :rowsPerPageOptions="PAGINATION_LIST"
        >
          <template #empty>
            <p class="text-center font-weight-bold">No records found.</p>
          </template>
        </DataTable>
      </content-group>
    </div>
  </v-card>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { DEFAULT_PAGE_LIMIT, PAGINATION_LIST } from "@/types";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import { StudentService } from "@/services/StudentService";

export default {
  components: {
    ContentGroup,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const studentFileUploads = ref();
    const loadStudentFileUploads = async () => {
      studentFileUploads.value = await StudentService.shared.getStudentFiles(
        props.studentId,
      );
    };
    onMounted(async () => {
      await loadStudentFileUploads();
    });
    return { studentFileUploads, DEFAULT_PAGE_LIMIT, PAGINATION_LIST };
  },
};
</script>
