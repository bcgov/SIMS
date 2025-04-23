<template>
  <v-navigation-drawer app color="default" permanent width="300">
    <v-list
      :items="activeApplicationMenuItems"
      density="compact"
      bg-color="default"
      color="primary"
    ></v-list>
    <v-list
      :items="changeRequestMenuItems"
      density="compact"
      bg-color="default"
      color="primary"
    ></v-list>
    <v-list
      :items="versionsMenuItems"
      density="compact"
      bg-color="default"
    ></v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent, computed } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuItemModel, SupportingUserType } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { useFormatters } from "@/composables";
import {
  ApplicationOverallDetailsAPIOutDTO,
  ApplicationSupportingUsersAPIOutDTO,
  ApplicationVersionAPIOutDTO,
} from "@/services/http/dto";

export interface StudentApplicationMenu {
  studentApplication: MenuItemModel;
  assessments: MenuItemModel;
  applicationRestrictionsManagement: MenuItemModel;
  applicationStatus: MenuItemModel;
}

export default defineComponent({
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    versionApplicationId: {
      type: Number,
      required: false,
    },
  },
  setup(props) {
    const { getISODateHourMinuteString } = useFormatters();
    const overallDetails = ref<ApplicationOverallDetailsAPIOutDTO | null>(null);

    /**
     * Basic divider for the sections.
     */
    const DIVIDER_MENU_ITEM = {
      type: "divider",
      props: {
        class: "my-1",
        style: {
          backgroundColor: "gray",
        },
      },
    };

    /**
     * Create one or more menu items for one to two parents or one partner.
     * @param supportingUsers supporting users information.
     */
    const createSupportingUsersMenu = (
      supportingUsers?: ApplicationSupportingUsersAPIOutDTO[],
    ) => {
      return (
        supportingUsers?.map((supportingUser, index) => {
          const title =
            supportingUser.supportingUserType === SupportingUserType.Parent
              ? `Parent ${index + 1}`
              : "Partner";
          return {
            title,
            props: {
              prependIcon: "mdi-account-outline",
              slim: true,
              to: {
                name: AESTRoutesConst.SUPPORTING_USER_DETAILS,
                params: {
                  studentId: props.studentId,
                  supportingUserId: supportingUser.supportingUserId,
                },
              },
            },
          };
        }) ?? []
      );
    };

    /**
     * Create the menu for an application version (change request or past applications).
     * @param applicationVersion application version information.
     */
    const createApplicationVersionMenu = (
      applicationVersion: ApplicationVersionAPIOutDTO,
    ) => {
      return {
        title: "Application",
        props: {
          subtitle: applicationVersion.applicationEditStatus,
          prependIcon: "mdi-school-outline",
          slim: true,
          to: {
            name: AESTRoutesConst.APPLICATION_VERSION_DETAILS,
            params: {
              studentId: props.studentId,
              applicationId: props.applicationId,
              versionApplicationId: applicationVersion.id,
            },
          },
        },
      };
    };

    /**
     * Create the menu for the current application (Active).
     * @param applicationVersion application version information.
     */
    const activeApplicationMenuItems = computed(() => {
      const currentVersion = overallDetails.value?.currentApplication;
      const supportingUsers = createSupportingUsersMenu(
        currentVersion?.supportingUsers,
      );
      return [
        {
          title: "Active",
          props: {
            subtitle: `Submitted on ${getISODateHourMinuteString(
              currentVersion?.submittedDate,
            )}`,
            slim: true,
          },
        },
        {
          title: "Application",
          props: {
            subtitle: currentVersion?.applicationEditStatus,
            prependIcon: "mdi-school-outline",
            slim: true,
            to: {
              name: AESTRoutesConst.APPLICATION_DETAILS,
              params: {
                applicationId: props.applicationId,
                studentId: props.studentId,
              },
            },
          },
        },
        ...supportingUsers,
        {
          title: "Assessments",
          props: {
            prependIcon: "mdi-checkbox-marked-outline",
            slim: true,
            to: {
              name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
              params: {
                applicationId: props.applicationId,
                studentId: props.studentId,
              },
            },
          },
        },
        {
          title: "Restrictions Management",
          props: {
            prependIcon: "mdi-close-circle-outline",
            slim: true,
            to: {
              name: AESTRoutesConst.APPLICATION_RESTRICTIONS_MANAGEMENT,
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
            slim: true,
            to: {
              name: AESTRoutesConst.APPLICATION_STATUS_TRACKER,
              params: {
                applicationId: props.applicationId,
                studentId: props.studentId,
              },
            },
          },
        },
      ];
    });

    /**
     * Create the menu for an in-progress change (Pending Change Request).
     * @param applicationVersion application version information.
     */
    const changeRequestMenuItems = computed(() => {
      const inProgressChangeRequest =
        overallDetails.value?.inProgressChangeRequest;
      if (!inProgressChangeRequest) {
        return [];
      }
      const applicationMenuItem = createApplicationVersionMenu(
        inProgressChangeRequest,
      );
      const supportingUsersMenuItems = createSupportingUsersMenu(
        inProgressChangeRequest?.supportingUsers,
      );
      const menuItems = [
        DIVIDER_MENU_ITEM,
        {
          title: "Pending Change Request",
          props: {
            subtitle: `Submitted on ${getISODateHourMinuteString(
              inProgressChangeRequest?.submittedDate,
            )}`,
            slim: true,
          },
        },
        applicationMenuItem,
        ...supportingUsersMenuItems,
      ];
      return menuItems;
    });

    /**
     * Create the menu for the past applications (Application History).
     * @param applicationVersion application version information.
     */
    const versionsMenuItems = computed(() => {
      const versions = overallDetails.value?.previousVersions;
      if (!versions?.length) {
        return [];
      }
      const menuItems = [
        DIVIDER_MENU_ITEM,
        {
          title: "Application History",
          class: "mb-10",
          props: {
            subtitle: "Past submitted applications",
            slim: true,
          },
        },
      ];
      versions.forEach((version) => {
        menuItems.push({
          title: `${getISODateHourMinuteString(version.submittedDate)}`,
          children: [
            {
              title: "Application",
              props: {
                slim: true,
                color: "primary",
                prependIcon: "mdi-school-outline",
                subtitle: version.applicationEditStatus,
                to: {
                  name: AESTRoutesConst.APPLICATION_VERSION_DETAILS,
                  params: {
                    studentId: props.studentId,
                    applicationId: props.applicationId,
                    versionApplicationId: version.id,
                  },
                },
              },
            },
          ],
        });
      });
      return menuItems;
    });

    onMounted(async () => {
      overallDetails.value =
        await ApplicationService.shared.getApplicationOverallDetails(
          props.applicationId,
        );
    });

    return {
      activeApplicationMenuItems,
      changeRequestMenuItems,
      versionsMenuItems,
    };
  },
});
</script>
