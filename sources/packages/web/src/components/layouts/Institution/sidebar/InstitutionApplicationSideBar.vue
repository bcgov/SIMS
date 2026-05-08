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
import { DIVIDER_MENU_ITEM } from "@/constants";

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
const { mapApplicationEditStatusForMinistryAndInstitution } = useApplication();
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
    ...createVersionsMenuItems(overallDetails.previousVersions),
  ];
};

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
        subtitle: mapApplicationEditStatusForMinistryAndInstitution(
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

/**
 * Create the menu for the past applications (Application History).
 * @param versions application version information.
 */
const createVersionsMenuItems = (
  versions: ApplicationVersionAPIOutDTO[],
): MenuItemModel[] => {
  if (!versions.length) {
    return [];
  }
  const menuItems: MenuItemModel[] = [
    DIVIDER_MENU_ITEM,
    {
      title: "Application History",
      props: {
        subtitle: "Past submitted applications",
        slim: true,
      },
    },
  ];
  versions.forEach((version) => {
    // Application history children menu.
    // Initialized with the application itself that always will be present.
    const children: MenuItemModel[] = [
      {
        title: "Application",
        props: {
          slim: true,
          prependIcon: "mdi-school-outline",
          subtitle: mapApplicationEditStatusForMinistryAndInstitution(
            version.applicationEditStatus,
          ),
          to: {
            name: InstitutionRoutesConst.APPLICATION_VERSION_DETAILS,
            params: {
              studentId: props.studentId,
              applicationId: props.applicationId,
              versionApplicationId: version.id,
            },
          },
        },
      },
    ];
    // Application history menu.
    menuItems.push({
      title: `${getISODateHourMinuteString(version.submittedDate)}`,
      props: {
        color: null,
      },
      children,
    });
  });
  return menuItems;
};

// Re-register the handler when applicationId changes
watchEffect(async () => {
  await loadApplicationData();
});
</script>
