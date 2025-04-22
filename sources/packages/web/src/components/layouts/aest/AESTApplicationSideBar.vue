<template>
  <v-navigation-drawer permanent width="300">
    <v-list :items="currentApplicationMenuItems" density="compact"></v-list>
    <v-list :items="changeRequestMenuItems" density="compact"></v-list>
    <v-list :items="versionsMenuItems" density="compact"></v-list>
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

    const currentApplicationMenuItems = computed(() => {
      const currentVersion = overallDetails.value?.currentApplication;
      const supportingUsers = createSupportingUsersMenu(
        currentVersion?.supportingUsers,
      );
      return [
        {
          title: "Current application",
          props: {
            style: {
              color: "gray",
            },
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

    const changeRequestMenuItems = computed(() => {
      const inProgressChangeRequest =
        overallDetails.value?.inProgressChangeRequest;
      if (!inProgressChangeRequest) {
        return [];
      }
      const supportingUsers = createSupportingUsersMenu(
        inProgressChangeRequest?.supportingUsers,
      );
      const menuItems = [
        {
          type: "divider",
          props: {
            class: "my-1",
            style: {
              backgroundColor: "gray",
            },
          },
        },
        {
          title: "Change request",
          props: {
            style: {
              color: "gray",
            },
            subtitle: `Submitted on ${getISODateHourMinuteString(
              inProgressChangeRequest?.submittedDate,
            )}`,
            slim: true,
          },
        },
        {
          title: "Application",
          props: {
            subtitle: inProgressChangeRequest?.applicationEditStatus,
            prependIcon: "mdi-school-outline",
            slim: true,
            to: {
              name: AESTRoutesConst.APPLICATION_VERSION_DETAILS,
              params: {
                studentId: props.studentId,
                applicationId: props.applicationId,
                versionApplicationId: inProgressChangeRequest.id,
              },
            },
          },
        },
        ...supportingUsers,
      ];
      return menuItems;
    });

    const versionsMenuItems = computed(() => {
      const versions = overallDetails.value?.previousVersions;
      if (!versions?.length) {
        return [];
      }
      const menuItems = [
        {
          type: "divider",
          props: {
            class: "my-1",
            style: {
              backgroundColor: "gray",
            },
          },
        },
        {
          title: "Versions",
          props: {
            style: {
              color: "gray",
            },
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
      currentApplicationMenuItems,
      changeRequestMenuItems,
      versionsMenuItems,
    };
  },
});
</script>
