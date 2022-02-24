<template>
  <v-navigation-drawer app class="body-background">
    <v-list dense nav>
      <v-list-item @click="studentMenu.command">
        <v-list-item-icon>
          <font-awesome-icon :icon="studentMenu.icon" class="mr-2" />
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ studentMenu.label }} </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item
        v-for="relatedParentPartner in relatedParentPartners"
        :key="relatedParentPartner.label"
        @click="relatedParentPartner.command"
      >
        <v-list-item-icon>
          <font-awesome-icon :icon="relatedParentPartner.icon" class="mr-2" />
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{
            relatedParentPartner.label
          }}</v-list-item-title>
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

    const studentMenu = ref<MenuModel>({
      label: "Student",
      // TODO: in figma this icon is PRO version
      icon: "graduation-cap",
      command: () => {
        router.push({
          name: AESTRoutesConst.APPLICATION_DETAILS,
          params: {
            applicationId: props.applicationId,
            studentId: props.studentId,
          },
        });
      },
    });
    onMounted(async () => {
      const supportingUsers = await SupportingUsersService.shared.getSupportingUsersForSideBar(
        props.applicationId,
      );
      supportingUsers.forEach((supportingUser, index) => {
        if (supportingUser.supportingUserType === SupportingUserType.Parent) {
          relatedParentPartners.value.push({
            label: `Parent ${index + 1}`,
            // TODO: in figma this icon is PRO version
            icon: "user",
            command: () => {
              router.push({
                name: AESTRoutesConst.SUPPORTING_USER_DETAILS,
                params: {
                  applicationId: props.applicationId,
                  studentId: props.studentId,
                  supportingUserId: supportingUser.supportingUserId,
                },
              });
            },
          });
        }
        if (supportingUser.supportingUserType === SupportingUserType.Partner) {
          relatedParentPartners.value.push({
            label: "Partner",
            // TODO: in figma this icon is PRO version
            icon: "user",
            command: () => {
              router.push({
                name: AESTRoutesConst.SUPPORTING_USER_DETAILS,
                params: {
                  applicationId: props.applicationId,
                  studentId: props.studentId,
                  supportingUserId: supportingUser.supportingUserId,
                },
              });
            },
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
