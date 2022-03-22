<template>
  <v-container>
    <v-card>
      <v-container>
        <p class="category-header-large color-blue">
          History
        </p>
        <span>A history of assessments</span>
        <DataTable
          :value="[]"
          :paginator="true"
          :rows="DEFAULT_PAGE_LIMIT"
          :rowsPerPageOptions="PAGINATION_LIST"
          :totalRecords="[].length"
        >
          <template #empty>
            <p class="text-center font-weight-bold">No records found.</p>
          </template>
        </DataTable>
      </v-container>
    </v-card>
  </v-container>
</template>
<script lang="ts">
import { DEFAULT_PAGE_LIMIT, PAGINATION_LIST } from "@/types";

export default {
  setup() {
    return {
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
    };
  },
};
</script>
