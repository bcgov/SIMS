<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <content-group>
        <v-row class="m-2">
          <v-col class="category-header-medium color-blue">File Uploads</v-col>
        </v-row>
        <DataTable
          :value="studentRestrictions"
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
import ContentGroup from "@/components/generic/ContentGroup.vue";

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
    return {};
  },
};
</script>
