<template>
  <v-navigation-drawer app color="default" permanent width="300">
    <v-list
      :items="menuItems"
      density="compact"
      color="primary"
      bg-color="default"
    />
  </v-navigation-drawer>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuItemModel, SupportingUserType } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { useFormatters, useApplication } from "@/composables";
import {
  ApplicationSupportingUsersAPIOutDTO,
  ApplicationVersionAPIOutDTO,
} from "@/services/http/dto";

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
    const { mapApplicationEditStatusForMinistry } = useApplication();
    const menuItems = ref<MenuItemModel[]>([]);

    onMounted(async () => {
      const overallDetails =
        await ApplicationService.shared.getApplicationOverallDetails(
          props.applicationId,
        );
      menuItems.value = [
        ...createCurrentApplicationMenuItems(overallDetails.currentApplication),
        ...createChangeRequestMenuItems(overallDetails.inProgressChangeRequest),
        ...createVersionsMenuItems(overallDetails.previousVersions),
      ];
    });

    /**
     * Basic divider for the sections.
     */
    const DIVIDER_MENU_ITEM: MenuItemModel = {
      type: "divider",
      props: {
        opacity: 0.75,
        class: "mx-2",
      },
    };

    /**
     * Create one or more menu items for one to two parents or one partner.
     * @param supportingUsers supporting users information.
     */
    const createSupportingUsersMenu = (
      supportingUsers: ApplicationSupportingUsersAPIOutDTO[],
    ): MenuItemModel[] => {
      return (
        supportingUsers.map((supportingUser, index) => {
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
    ): MenuItemModel => {
      return {
        title: "Application",
        props: {
          subtitle: mapApplicationEditStatusForMinistry(
            applicationVersion.applicationEditStatus,
          ),
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
    const createCurrentApplicationMenuItems = (
      currentVersion: ApplicationVersionAPIOutDTO,
    ): MenuItemModel[] => {
      const supportingUsers = createSupportingUsersMenu(
        currentVersion.supportingUsers,
      );
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
            subtitle: mapApplicationEditStatusForMinistry(
              currentVersion.applicationEditStatus,
            ),
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
    };

    /**
     * Create the menu for an in-progress change (Pending Change Request).
     * @param inProgressChangeRequest application version information.
     */
    const createChangeRequestMenuItems = (
      inProgressChangeRequest?: ApplicationVersionAPIOutDTO,
    ): MenuItemModel[] => {
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
    };

    /**
     * Create the menu for the past applications (Application History).
     * @param applicationVersion application version information.
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
        const versionSupportingUsersMenuItems = createSupportingUsersMenu(
          version.supportingUsers,
        );
        menuItems.push({
          title: `${getISODateHourMinuteString(version.submittedDate)}`,
          props: {
            color: null,
          },
          children: [
            {
              title: "Application",
              props: {
                slim: true,
                prependIcon: "mdi-school-outline",
                subtitle: mapApplicationEditStatusForMinistry(
                  version.applicationEditStatus,
                ),
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
            ...versionSupportingUsersMenuItems,
          ],
        });
      });
      return menuItems;
    };

    return {
      menuItems,
    };
  },
});
</script>
