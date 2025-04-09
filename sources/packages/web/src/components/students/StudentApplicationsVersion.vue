<template>
  <toggle-content
    :toggled="!filteredVersions.length && !loading"
    message="There are no versions available for viewing in this application."
  >
    <v-table v-if="filteredVersions.length">
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
        <tr v-for="version in filteredVersions" :key="version.id">
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
  </toggle-content>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useApplication, useFormatters } from "@/composables";
import { ApplicationVersionAPIOutDTO } from "@/services/http/dto";
import { ApplicationEditStatus } from "@/types";

/**
 * Edited applications that should be filtered out from the list of
 * application versions to be displayed in the UI.
 * The student can potentially see all its edited applications versions,
 * the filter is applied at this stage as per the business understanding
 * that it will be best for the student to see only the most relevant
 * versions of the application.
 */
const APPLICATION_VERSIONS_STATUSES = [
  ApplicationEditStatus.Original,
  ApplicationEditStatus.Edited,
  ApplicationEditStatus.ChangeCancelled,
  ApplicationEditStatus.ChangeDeclined,
  ApplicationEditStatus.ChangedWithApproval,
];

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
  setup(props) {
    const { mapApplicationEditStatusForStudents } = useApplication();
    const { getISODateHourMinuteString } = useFormatters();
    const filteredVersions = computed(() => {
      if (!props.versions) {
        return [];
      }
      return props.versions.filter((version) =>
        APPLICATION_VERSIONS_STATUSES.includes(version.applicationEditStatus),
      );
    });
    return {
      filteredVersions,
      getISODateHourMinuteString,
      mapApplicationEditStatusForStudents,
    };
  },
});
</script>
