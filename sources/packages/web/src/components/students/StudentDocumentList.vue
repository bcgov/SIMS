<template>
  <v-card>
    <v-container>
      <h3 class="category-header-medium-small mb-4">My received documents</h3>
      <template v-if="ministryDocuments.length">
        <div
          class="document-box mb-4"
          v-for="ministryDocument in ministryDocuments"
          :key="ministryDocument.uniqueFileName"
        >
          <div
            class="file-label"
            @click="fileUtils.downloadStudentDocument(ministryDocument)"
          >
            <span class="mr-4">
              <v-icon icon="fa:far fa-file-alt" size="20"></v-icon
            ></span>
            <span>{{ ministryDocument.fileName }}</span>
          </div>
        </div>
      </template>
      <template v-else>
        <p>
          Your documents from StudentAid BC are shown here. At the moment there
          are no documents to display.
        </p>
      </template>
      <h3 class="category-header-medium-small mb-4">My uploaded documents</h3>
      <template v-if="studentDocuments.length">
        <div
          class="document-box mb-4"
          v-for="studentDocument in studentDocuments"
          :key="studentDocument.uniqueFileName"
        >
          <div
            class="file-label"
            @click="fileUtils.downloadStudentDocument(studentDocument)"
          >
            <span class="mr-4">
              <v-icon icon="fa:far fa-file-alt" size="20"></v-icon
            ></span>
            <span>{{ studentDocument.fileName }}</span>
          </div>
        </div>
      </template>
      <template v-else>
        <p>You have no documents uploaded at this time.</p>
      </template>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { ref, watch, defineComponent } from "vue";
import { StudentService } from "@/services/StudentService";
import { FileOriginType } from "@/types";
import { useFileUtils } from "@/composables";
import { StudentUploadFileAPIOutDTO } from "@/services/http/dto/Student.dto";

export default defineComponent({
  props: {
    reload: {
      type: Boolean,
    },
  },
  setup(props) {
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

    watch(
      () => props.reload,
      async () => {
        await getStudentDocuments();
      },
      {
        immediate: true,
      },
    );
    return { fileUtils, studentDocuments, ministryDocuments };
  },
});
</script>
