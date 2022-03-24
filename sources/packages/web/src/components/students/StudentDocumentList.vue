<template>
  <full-page-container>
    <div class="category-header-medium-small mb-4">My uploaded documents</div>
    <div v-if="studentDocuments.length">
      <div
        class="document-box mb-4"
        v-for="studentDocument in studentDocuments"
        :key="studentDocument"
      >
        <div
          class="file-label"
          @click="formioUtils.downloadDocument(studentDocument)"
        >
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
import { useFormioUtils } from "@/composables";

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
    const formioUtils = useFormioUtils();
    const studentDocuments = ref([] as StudentUploadFileDto[]);
    const getStudentDocuments = async () => {
      studentDocuments.value = await StudentService.shared.getStudentFiles();
    };

    onMounted(getStudentDocuments);

    watch(
      () => props.reload,
      () => {
        getStudentDocuments();
      },
    );
    return { formioUtils, studentDocuments };
  },
};
</script>
