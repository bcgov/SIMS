<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Manage institution"
        subTitle="Offerings Upload"
      />
    </template>
    <body-header title="Upload Results">
      <template #actions>
        <v-row class="m-0 p-0">
          <v-file-input
            density="compact"
            accept="text/csv"
            v-model="offeringFile"
            show-size
            label="Select offering CSV file"
            variant="outlined"
            data-cy="fileUpload"
            prepend-inner-icon="mdi-paperclip"
          >
          </v-file-input>
          <v-btn
            class="ml-2"
            color="primary"
            prepend-icon="mdi-paperclip"
            @click="validateFile"
          >
            Validate
          </v-btn>
        </v-row>
      </template>
    </body-header>
    <content-group>
      <DataTable
        :lazy="true"
        :paginator="true"
        :rows="DEFAULT_PAGE_LIMIT"
        :rowsPerPageOptions="PAGINATION_LIST"
        :loading="loading"
        breakpoint="1250px"
      >
        <Column header="Name" sortable="true"></Column>
        <Column header="Email" sortable="true"></Column>
      </DataTable>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { ref } from "vue";
import { ApiProcessError, DEFAULT_PAGE_LIMIT, PAGINATION_LIST } from "@/types";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { OfferingBulkInsertValidationResultAPIOutDTO } from "@/services/http/dto";

export default {
  setup() {
    const loading = ref(false);
    const offeringFile = ref();

    const validateFile = async () => {
      try {
        console.log(offeringFile.value);
        const uploadResults =
          await EducationProgramOfferingService.shared.offeringBulkInsert(
            offeringFile.value[0],
            (progressEvent: any) => {
              console.log(progressEvent);
            },
          );
        console.log(uploadResults);
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          const validationResult = error as ApiProcessError<
            OfferingBulkInsertValidationResultAPIOutDTO[]
          >;
          console.log(validationResult.objectInfo);
        }
      }
    };

    return {
      loading,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      offeringFile,
      validateFile,
    };
  },
};
</script>
