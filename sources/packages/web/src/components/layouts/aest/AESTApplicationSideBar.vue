<template>
  <!-- TODO: need to use v-list-group and update code with vuetify is -->
  <v-navigation-drawer app class="body-background">
    <v-list dense nav>
      <v-list-item @click="studentMenu.studentApplication.command">
        <v-list-item-icon>
          <font-awesome-icon
            :icon="studentMenu.studentApplication.icon"
            class="mr-2"
          />
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title
            >{{ studentMenu.studentApplication.label }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item
        v-for="relatedParentPartner in relatedParentPartners"
        :key="relatedParentPartner.label"
        @click="relatedParentPartner.command"
      >
        <!-- TODO: remove the div when `v-list-item-group` is available and implemented -->
        <div class="px-3">
          <v-list-item-icon>
            <font-awesome-icon :icon="relatedParentPartner.icon" class="mr-2" />
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{
              relatedParentPartner.label
            }}</v-list-item-title>
          </v-list-item-content>
        </div>
      </v-list-item>
      <v-list-item @click="studentMenu.assessments.command">
        <v-list-item-icon>
          <font-awesome-icon
            :icon="studentMenu.assessments.icon"
            class="mr-2"
          />
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title
            >{{ studentMenu.assessments.label }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { MenuModel, SupportingUserType } from "@/types";
import { SupportingUsersService } from "@/services/SupportingUserService";

export interface StudentApplicationMenu {
  studentApplication: MenuModel;
  assessments: MenuModel;
}

export default {
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
  setup(props: any) {
    const router = useRouter();
    const relatedParentPartners = ref([] as MenuModel[]);
    const studentMenu = ref<StudentApplicationMenu>({
      studentApplication: {
        label: "Student",
        // TODO: in figma this icon is PRO version
        icon: ["fas", "graduation-cap"],
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
        icon: ["far", "check-square"],
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
    onMounted(async () => {
      const supportingUsers = await SupportingUsersService.shared.getSupportingUsersForSideBar(
        props.applicationId,
      );
      supportingUsers.forEach((supportingUser, index) => {
        if (supportingUser.supportingUserType === SupportingUserType.Parent) {
          relatedParentPartners.value.push({
            label: `Parent ${index + 1}`,
            icon: ["far", "user"],
            command: () => goToSupportingUser(supportingUser.supportingUserId),
          });
        }
        if (supportingUser.supportingUserType === SupportingUserType.Partner) {
          relatedParentPartners.value.push({
            label: "Partner",
            icon: ["far", "user"],
            command: () => goToSupportingUser(supportingUser.supportingUserId),
          });
        }
      });
    });

    return {
      studentMenu,
      relatedParentPartners,
    };
  },
};
</script>
