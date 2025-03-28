<template>
  <v-table>
    <thead>
      <tr>
        <th id="submitted-header">Submitted</th>
        <th id="status-header">Status</th>
        <th id="actions-header">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="loading">
        <td colspan="3">
          <v-skeleton-loader type="table-row@2" />
        </td>
      </tr>
      <tr v-for="version in versions" :key="version.id">
        <td headers="submitted-header">
          {{ getISODateHourMinuteString(version.submittedDate) }}
        </td>
        <td headers="status-header">
          {{
            mapApplicationEditStatusForStudents(version.applicationEditStatus)
          }}
        </td>
        <td headers="actions-header">
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
import { useApplication, useFormatters } from "@/composables";
import { ApplicationVersionAPIOutDTO } from "@/services/http/dto";

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
    const { mapApplicationEditStatusForStudents } = useApplication();
    const { getISODateHourMinuteString } = useFormatters();
    return {
      getISODateHourMinuteString,
      mapApplicationEditStatusForStudents,
    };
  },
});
</script>
