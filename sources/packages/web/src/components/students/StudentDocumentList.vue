<template>
  <full-page-container>
    <div class="category-header-medium-small mb-4">My received documents</div>
    <div v-if="ministryDocuments.length">
      <div
        class="document-box mb-4"
        v-for="ministryDocument in ministryDocuments"
        :key="ministryDocument"
      >
        <div
          class="file-label"
          @click="fileUtils.downloadStudentDocument(ministryDocument)"
        >
          <span class="mr-4">
            <font-awesome-icon :icon="['far', 'file-alt']"
          /></span>
          <span>{{ ministryDocument.fileName }}</span>
        </div>
      </div>
    </div>
    <div v-else>
      <p>
        Your documents from StudentAid BC are shown here. At the moment there
        are no documents to display.
      </p>
    </div>
    <div class="category-header-medium-small mb-4">My uploaded documents</div>
    <div v-if="studentDocuments.length">
      <div
        class="document-box mb-4"
        v-for="studentDocument in studentDocuments"
        :key="studentDocument"
      >
        <div
          class="file-label"
          @click="fileUtils.downloadStudentDocument(studentDocument)"
        >
          <span class="mr-4">
            <font-awesome-icon :icon="['far', 'file-alt']"
          /></span>
          <span>{{ studentDocument.fileName }}</span>
        </div>
      </div>
    </div>
    <div v-else>
      <p>You have no documents uploaded at this time.</p>
    </div>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref, watch } from "vue";
import { StudentService } from "@/services/StudentService";
import { FileOriginType } from "@/types";
import { useFileUtils } from "@/composables";
import { StudentUploadFileAPIOutDTO } from "@/services/http/dto/Student.dto";

export default {
  props: {
    reload: {
      type: Boolean,
    },
  },
  setup(props: any) {
    const fileUtils = useFileUtils();
    const studentDocuments = ref([] as StudentUploadFileAPIOutDTO[]);
    const ministryDocuments = ref([] as StudentUploadFileAPIOutDTO[]);
    const getStudentDocuments = async () => {
      const documents = await StudentService.shared.getStudentFiles();
      ministryDocuments.value = documents.filter(
        (document) => document.fileOrigin === FileOriginType.Ministry,
      );
      studentDocuments.value = documents.filter(
        (document) => document.fileOrigin === FileOriginType.Student,
      );
    };

    onMounted(getStudentDocuments);

    watch(
      () => props.reload,
      () => {
        getStudentDocuments();
      },
    );
    return { fileUtils, studentDocuments, ministryDocuments };
  },
};
</script>
