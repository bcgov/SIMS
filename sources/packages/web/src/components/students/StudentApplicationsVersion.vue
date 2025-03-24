<template>
  <v-table>
    <thead>
      <tr>
        <th>Submitted</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="loading">
        <td colspan="3">
          <v-skeleton-loader type="table-row@2" />
        </td>
      </tr>
      <tr v-for="version in versions" :key="version.id">
        <td>
          {{ getISODateHourMinuteString(version.submittedDate) }}
        </td>
        <td>{{ version.applicationEditStatus }}</td>
        <td>
          <v-btn
            variant="text"
            color="primary"
            @click="$emit('viewApplicationVersion', version.id)"
            >View
            <v-tooltip activator="parent" location="start"
              >Click to view this application version</v-tooltip
            >
          </v-btn>
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useFormatters } from "@/composables";
import { ApplicationVersionAPIOutDTO } from "@/services/http/dto/Application.dto";

export default defineComponent({
  emits: {
    viewApplicationVersion: (applicationId: number) => !!applicationId,
  },
  props: {
    versions: {
      type: Array<ApplicationVersionAPIOutDTO>,
      required: false,
    },
    loading: {
      type: Boolean,
      required: false,
    },
  },
  setup() {
    const { getISODateHourMinuteString } = useFormatters();
    return {
      getISODateHourMinuteString,
    };
  },
});
</script>
