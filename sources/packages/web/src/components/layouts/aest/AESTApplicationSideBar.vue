<template>
  <!-- TODO: need to use v-list-group and update code with vuetify is -->
  <v-navigation-drawer app class="body-background" permanent>
    <v-list-item
      density="compact"
      nav
      :prepend-icon="studentMenu.studentApplication.props?.prependIcon"
      :title="studentMenu.studentApplication.title"
      @click="studentMenu.studentApplication.command"
    />
    <v-list density="compact" v-if="relatedParentPartners.length" nav>
      <v-list-subheader>Supporting users</v-list-subheader>
      <v-list-item
        v-for="relatedParentPartner in relatedParentPartners"
        :key="relatedParentPartner.title"
        :prepend-icon="relatedParentPartner.props?.prependIcon"
        :title="relatedParentPartner.title"
        @click="relatedParentPartner.command"
      />
    </v-list>
    <v-list-item
      density="compact"
      nav
      :prepend-icon="studentMenu.assessments.props?.prependIcon"
      :title="studentMenu.assessments.title"
      @click="studentMenu.assessments.command"
    />
    <v-list-item
      density="compact"
      nav
      :prepend-icon="
        studentMenu.applicationRestrictionsManagement.props?.prependIcon
      "
      :title="studentMenu.applicationRestrictionsManagement.title"
      @click="studentMenu.applicationRestrictionsManagement.command"
    />
    <v-list-item
      density="compact"
      nav
      :prepend-icon="studentMenu.applicationStatus.props?.prependIcon"
      :title="studentMenu.applicationStatus.title"
      @click="studentMenu.applicationStatus.command"
    />
    <v-list v-if="applicationHistory.length" density="compact" nav>
      <v-list-group
        v-for="application in applicationHistory"
        :key="application.title"
        :prepend-icon="application.props?.prependIcon"
        :title="application.title"
        :value="application.title"
      >
        <template v-slot:activator="{ props }">
          <v-list-item v-bind="props" :title="application.title"></v-list-item>
        </template>

        <v-list-item
          v-for="child in application.children"
          :key="child.title"
          :title="child.title"
          :prepend-icon="child.props?.prependIcon"
          @click="child.command"
        ></v-list-item>
      </v-list-group>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted, defineComponent } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuItemModel, SupportingUserType } from "@/types";
import { SupportingUsersService } from "@/services/SupportingUserService";
import { ApplicationService } from "@/services/ApplicationService";

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
  },
  setup(props) {
    const router = useRouter();
    const relatedParentPartners = ref([] as MenuItemModel[]);
    const applicationHistory = ref([] as MenuItemModel[]);
    const studentMenu = ref<StudentApplicationMenu>({
      studentApplication: {
        title: "Application",
        props: { prependIcon: "mdi-school-outline" },
        command: () => {
          router.push({
            name: AESTRoutesConst.APPLICATION_DETAILS,
            params: {
              applicationId: props.applicationId,
              studentId: props.studentId,
            },
          });
        },
      },
      assessments: {
        title: "Assessments",
        props: { prependIcon: "mdi-checkbox-marked-outline" },
        command: () => {
          router.push({
            name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
            params: {
              applicationId: props.applicationId,
              studentId: props.studentId,
            },
          });
        },
      },
      applicationRestrictionsManagement: {
        title: "Restrictions Management",
        props: { prependIcon: "mdi-close-circle-outline" },
        command: () => {
          router.push({
            name: AESTRoutesConst.APPLICATION_RESTRICTIONS_MANAGEMENT,
            params: {
              applicationId: props.applicationId,
              studentId: props.studentId,
            },
          });
        },
      },
      applicationStatus: {
        title: "Application Status",
        props: { prependIcon: "mdi-information-outline" },
        command: () => {
          router.push({
            name: AESTRoutesConst.APPLICATION_STATUS_TRACKER,
            params: {
              applicationId: props.applicationId,
              studentId: props.studentId,
            },
          });
        },
      },
    });

    const goToSupportingUser = (supportingUserId: number) => {
      router.push({
        name: AESTRoutesConst.SUPPORTING_USER_DETAILS,
        params: {
          applicationId: props.applicationId,
          studentId: props.studentId,
          supportingUserId: supportingUserId,
        },
      });
    };

    const goToApplicationVersion = (applicationId: number) => {
      router.push({
        name: AESTRoutesConst.APPLICATION_DETAILS,
        params: {
          studentId: props.studentId,
          applicationId: applicationId,
        },
      });
    };

    onMounted(async () => {
      const supportingUsers =
        await SupportingUsersService.shared.getSupportingUsersForSideBar(
          props.applicationId,
        );
      supportingUsers.forEach((supportingUser, index) => {
        if (supportingUser.supportingUserType === SupportingUserType.Parent) {
          relatedParentPartners.value.push({
            title: `Parent ${index + 1}`,
            props: { prependIcon: "mdi-account-outline" },
            command: () => goToSupportingUser(supportingUser.supportingUserId),
          });
        }
        if (supportingUser.supportingUserType === SupportingUserType.Partner) {
          relatedParentPartners.value.push({
            title: "Partner",
            props: { prependIcon: "mdi-account-outline" },
            command: () => goToSupportingUser(supportingUser.supportingUserId),
          });
        }
      });
      const applicationVersionHistory =
        await ApplicationService.shared.getApplicationVersionHistory(
          props.applicationId,
        );
      if (applicationVersionHistory.length) {
        applicationVersionHistory.forEach((application) => {
          applicationHistory.value.push({
            title: `${application.submittedDate}`,
            props: { prependIcon: "mdi-update" },
            children: [
              {
                title: "Application",
                props: { prependIcon: "mdi-school-outline" },
                command: () => goToApplicationVersion(application.id),
              },
            ],
          });
        });
      }
    });

    return {
      studentMenu,
      relatedParentPartners,
      applicationHistory,
    };
  },
});
</script>
