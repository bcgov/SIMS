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
import {
  ref,
  onBeforeUnmount,
  defineComponent,
  onMounted,
  watchEffect,
} from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuItemModel, SupportingUserType } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { useFormatters, useApplication } from "@/composables";
import {
  ApplicationSupportingUsersAPIOutDTO,
  ApplicationVersionAPIOutDTO,
} from "@/services/http/dto";
import useEmitterEvents from "@/composables/useEmitterEvents";

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
    // Event emitter for application sidebar refresh.
    const { refreshApplicationSidebarOn, refreshApplicationSidebarOff } =
      useEmitterEvents();

    // Function to load application data and update menu items.
    const loadApplicationData = async () => {
      const overallDetails =
        await ApplicationService.shared.getApplicationOverallDetails(
          props.applicationId,
        );
      menuItems.value = [
        ...createCurrentApplicationMenuItems(overallDetails.currentApplication),
        ...createChangeRequestMenuItems(overallDetails.inProgressChangeRequest),
        ...createVersionsMenuItems(overallDetails.previousVersions),
      ];
    };

    // Re-register the handler when applicationId changes
    watchEffect(async () => {
      await loadApplicationData();
    });

    // Handler that references the current applicationId
    const handleSideBarRefresh = () => {
      return loadApplicationData();
    };

    onMounted(async () => {
      refreshApplicationSidebarOn(handleSideBarRefresh);
    });

    onBeforeUnmount(() => {
      refreshApplicationSidebarOff(handleSideBarRefresh);
    });

    /**
     * Basic divider for the sections.
     */
    const DIVIDER_MENU_ITEM: MenuItemModel = {
      type: "divider",
      props: {
        class: "mx-2",
      },
    };

    /**
     * Get display name for supporting user with truncation.
     * @param supportingUser supporting user information.
     * @param index index for fallback naming.
     */
    const getSupportingUserDisplayName = (
      supportingUser: ApplicationSupportingUsersAPIOutDTO,
      index: number,
    ): string => {
      if (supportingUser.supportingUserType === SupportingUserType.Partner) {
        return "Partner";
      }

      // For parents, use full name if available, otherwise default to Parent 1/Parent 2
      if (supportingUser.supportingUserFullName) {
        const fullName = supportingUser.supportingUserFullName.trim();
        // Truncate if name is longer than 36 characters
        return fullName.length > 36
          ? `${fullName.substring(0, 33)}...`
          : fullName;
      }

      // Fallback to Parent 1/Parent 2 when no name is available
      return `Parent ${index + 1}`;
    };

    /**
     * Get subtitle for supporting user based on who declared the information.
     * @param supportingUser supporting user information.
     */
    const getSupportingUserSubtitle = (
      supportingUser: ApplicationSupportingUsersAPIOutDTO,
    ): string => {
      if (supportingUser.supportingUserType === SupportingUserType.Partner) {
        return "";
      }

      // For parents, determine if it was student declared or parent declared
      if (supportingUser.isAbleToReport === false) {
        return "Student Declared";
      } else {
        return "Parent Declared";
      }
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
          const title = getSupportingUserDisplayName(supportingUser, index);
          const subtitle = getSupportingUserSubtitle(supportingUser);
          return {
            title,
            props: {
              prependIcon: "mdi-account-outline",
              slim: true,
              subtitle: subtitle || undefined,
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
     * @param currentVersion application version information.
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
