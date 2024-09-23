<template>
  <!-- TODO: need to use v-list-group and update code with vuetify is -->
  <v-navigation-drawer app class="body-background" permanent>
    <v-list-item
      density="compact"
      nav
      :prepend-icon="studentMenu.studentApplication.icon"
      :title="studentMenu.studentApplication.label"
      @click="studentMenu.studentApplication.command"
    />
    <v-list density="compact" v-if="relatedParentPartners.length" nav>
      <v-list-subheader>Supporting users</v-list-subheader>
      <v-list-item
        v-for="relatedParentPartner in relatedParentPartners"
        :key="relatedParentPartner.label"
        :prepend-icon="relatedParentPartner.icon"
        :title="relatedParentPartner.label"
        @click="relatedParentPartner.command"
      />
    </v-list>
    <v-list-item
      density="compact"
      nav
      :prepend-icon="studentMenu.assessments.icon"
      :title="studentMenu.assessments.label"
      @click="studentMenu.assessments.command"
    />
    <v-list-item
      density="compact"
      nav
      :prepend-icon="studentMenu.restrictionsManagement.icon"
      :title="studentMenu.restrictionsManagement.label"
      @click="studentMenu.restrictionsManagement.command"
      :hidden="isDraftApplication"
    />
  </v-navigation-drawer>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted, defineComponent } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { ApplicationStatus, MenuModel, SupportingUserType } from "@/types";
import { SupportingUsersService } from "@/services/SupportingUserService";
import { ApplicationService } from "@/services/ApplicationService";

export interface StudentApplicationMenu {
  studentApplication: MenuModel;
  assessments: MenuModel;
  restrictionsManagement: MenuModel;
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
    const relatedParentPartners = ref([] as MenuModel[]);
    const studentMenu = ref<StudentApplicationMenu>({
      studentApplication: {
        label: "Application",
        icon: "mdi-school-outline",
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
        label: "Assessments",
        icon: "mdi-checkbox-marked-outline",
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
      restrictionsManagement: {
        label: "Restrictions Management",
        icon: "mdi-close-circle-outline",
        command: () => {
          router.push({
            name: AESTRoutesConst.RESTRICTIONS_MANAGEMENT,
            params: {
              applicationId: props.applicationId,
              studentId: props.studentId,
            },
          });
        },
      },
    });
    const isDraftApplication = ref(true as boolean);

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

    onMounted(async () => {
      const supportingUsers =
        await SupportingUsersService.shared.getSupportingUsersForSideBar(
          props.applicationId,
        );
      supportingUsers.forEach((supportingUser, index) => {
        if (supportingUser.supportingUserType === SupportingUserType.Parent) {
          relatedParentPartners.value.push({
            label: `Parent ${index + 1}`,
            icon: "mdi-account-outline",
            command: () => goToSupportingUser(supportingUser.supportingUserId),
          });
        }
        if (supportingUser.supportingUserType === SupportingUserType.Partner) {
          relatedParentPartners.value.push({
            label: "Partner",
            icon: "mdi-account-outline",
            command: () => goToSupportingUser(supportingUser.supportingUserId),
          });
        }
      });
      const applicationDetail =
        await ApplicationService.shared.getApplicationDetail(
          props.applicationId,
        );
      isDraftApplication.value =
        applicationDetail.applicationStatus === ApplicationStatus.Draft;
    });

    return {
      studentMenu,
      relatedParentPartners,
      isDraftApplication,
    };
  },
});
</script>
