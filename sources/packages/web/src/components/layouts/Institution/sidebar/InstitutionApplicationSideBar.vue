<template>
  <v-navigation-drawer app color="default" permanent width="300">
    <v-list
      :items="menuItems"
      density="compact"
      color="primary"
      bg-color="default"
      open-strategy="multiple"
    ></v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuItemModel } from "@/types";
import { useApplication, useFormatters } from "@/composables";
import { ApplicationService } from "@/services/ApplicationService";
import { ApplicationVersionAPIOutDTO } from "@/services/http/dto";

const props = defineProps({
  studentId: {
    type: Number,
    required: true,
  },
  applicationId: {
    type: Number,
    required: true,
  },
});

const { getISODateHourMinuteString } = useFormatters();
const { mapApplicationEditStatusForMinistry } = useApplication();
const menuItems = ref<MenuItemModel[]>([]);

// Function to load application data and update menu items.
const loadApplicationData = async () => {
  const overallDetails =
    await ApplicationService.shared.getApplicationOverallDetails(
      props.applicationId,
      { studentId: props.studentId },
    );
  menuItems.value = [
    ...createCurrentApplicationMenuItems(overallDetails.currentApplication),
  ];
};

// Re-register the handler when applicationId changes
watchEffect(async () => {
  await loadApplicationData();
});

/**
 * Create the menu for the current application (Active).
 * @param currentVersion application version information.
 */
const createCurrentApplicationMenuItems = (
  currentVersion: ApplicationVersionAPIOutDTO,
): MenuItemModel[] => {
  return [
    {
      title: "Active",
      props: {
        subtitle: `Submitted on ${getISODateHourMinuteString(
          currentVersion.submittedDate,
        )}`,
        slim: true,
      },
    },
    {
      title: "Application",
      props: {
        prependIcon: "mdi-school-outline",
        subtitle: mapApplicationEditStatusForMinistry(
          currentVersion.applicationEditStatus,
        ),
        to: {
          name: InstitutionRoutesConst.STUDENT_APPLICATION_DETAILS,
          params: {
            applicationId: props.applicationId,
            studentId: props.studentId,
          },
        },
      },
    },
    {
      title: "Assessments",
      props: {
        prependIcon: "mdi-checkbox-marked-outline",
        to: {
          name: InstitutionRoutesConst.ASSESSMENTS_SUMMARY,
          params: {
            applicationId: props.applicationId,
            studentId: props.studentId,
          },
        },
      },
    },
    {
      title: "Application Status",
      props: {
        prependIcon: "mdi-information-outline",
        to: {
          name: InstitutionRoutesConst.APPLICATION_STATUS_TRACKER,
          params: {
            applicationId: props.applicationId,
            studentId: props.studentId,
          },
        },
      },
    },
  ];
};
</script>
