<template>
  <full-page-container>
    <div class="category-header-medium-small mb-4">My uploaded documents</div>
    <div v-if="studentDocuments.length">
      <div
        class="document-box mb-4"
        v-for="studentDocument in studentDocuments"
        :key="studentDocument"
      >
        <div class="file-label" @click="downloadDocument(studentDocument)">
          <span class="mr-4">
            <font-awesome-icon :icon="['far', 'file-alt']"
          /></span>
          <span>{{ studentDocument.fileName }}</span>
        </div>
      </div>
    </div>
    <div v-else>
      <p class="text-center">No documents found.</p>
    </div>
  </full-page-container>
</template>

<script lang="ts">
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { onMounted, ref, watch } from "vue";
import { StudentService } from "@/services/StudentService";
import { StudentUploadFileDto } from "@/types";

export default {
  components: {
    FullPageContainer,
  },
  props: {
    reload: {
      type: Boolean,
    },
  },
  setup(props: any) {
    const studentDocuments = ref([] as StudentUploadFileDto[]);
    const getStudentDocuments = async () => {
      studentDocuments.value = await StudentService.shared.getStudentFiles();
    };

    const downloadDocument = async (studentDocument: StudentUploadFileDto) => {
      const fileURL = await StudentService.shared.downloadStudentFile(
        studentDocument.uniqueFileName,
      );
      const fileLink = document.createElement("a");
      fileLink.href = fileURL;
      fileLink.setAttribute("download", studentDocument.fileName);
      document.body.appendChild(fileLink);
      fileLink.click();
      // After download, remove the element
      fileLink.remove();
    };

    onMounted(getStudentDocuments);

    watch(
      () => props.reload,
      () => {
        getStudentDocuments();
      },
    );
    return { studentDocuments, downloadDocument };
  },
};
</script>
