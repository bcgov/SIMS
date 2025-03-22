<template>
  <v-table loading="loading">
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
      <tr v-for="version in applicationVersions" :key="version.id">
        <td>
          {{ getISODateHourMinuteString(version.submittedDate) }}
        </td>
        <td>{{ version.applicationEditStatus }}</td>
        <td>
          <v-btn
            variant="text"
            color="primary"
            @click="goToApplicationVersion(version.id)"
            >View
            <v-tooltip activator="parent" location="start"
              >Click to view this application</v-tooltip
            >
          </v-btn>
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect } from "vue";
import { ApplicationService } from "@/services/ApplicationService";
import { useFormatters } from "@/composables";
import { ApplicationVersionAPIOutDTO } from "@/services/http/dto/Application.dto";
import { useRouter } from "vue-router";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";

export default defineComponent({
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const loading = ref(false);
    const { getISODateHourMinuteString } = useFormatters();
    const applicationVersions = ref<ApplicationVersionAPIOutDTO[]>([]);
    const router = useRouter();

    watchEffect(async () => {
      if (applicationVersions.value.length > 0) return;
      try {
        loading.value = true;
        const applications =
          await ApplicationService.shared.getApplicationOverallDetails(
            props.applicationId,
          );
        applicationVersions.value = applications.previousVersions ?? [];
      } catch (error) {
        console.error(error);
      } finally {
        loading.value = false;
      }
    });

    const goToApplicationVersion = (versionId: number) => {
      // TODO: adapt the application form to work with the application ID only?
      // TODO: move this code to outside the component?
      router.push({
        name: StudentRoutesConst.DYNAMIC_FINANCIAL_APP_FORM_VIEW,
        params: {
          selectedForm: "applicationWithPY.formName",
          programYearId: "applicationWithPY.programYearId",
          id: props.applicationId,
          readOnly: "readOnly",
        },
      });
    };

    return {
      getISODateHourMinuteString,
      applicationVersions,
      loading,
      goToApplicationVersion,
    };
  },
});
</script>
